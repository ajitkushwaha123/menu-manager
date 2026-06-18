import { NextResponse } from "next/server";
import Image from "@/model/image";
import dbConnect from "@/lib/dbConnect";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.trim() === "") {
            return NextResponse.json({ success: true, data: [] });
        }

        await dbConnect();

        const terms = query.split(/\s+/).filter(Boolean);
        if (terms.length === 0) return NextResponse.json({ success: true, data: [] });

        const regexTerms = terms.map(term => new RegExp(term, "i"));
        const exactRegex = new RegExp(query, "i");

        // 1. Fetch up to 300 candidates where ANY of the terms match
        const candidates = await Image.find({
            $or: [
                { title: exactRegex },
                { title: { $in: regexTerms } },
                { manual_tags: { $in: regexTerms } },
                { auto_tags: { $in: regexTerms } },
                { category: { $in: regexTerms } },
                { cuisine: { $in: regexTerms } }
            ]
        })
        .limit(300)
        .lean();

        // 2. Score candidates in memory for maximum relevancy control
        const qLower = query.toLowerCase();
        const queryWords = terms.length;
        
        candidates.forEach(img => {
            let score = 0;
            const tLower = (img.title || "").toLowerCase();
            const titleWords = tLower.split(/\s+/).length;
            
            // Highest priority: Exact match
            if (tLower === qLower) {
                score += 100;
            } else {
                // High priority: Starts or Ends with the full query
                if (tLower.startsWith(qLower + " ")) score += 40;
                if (tLower.endsWith(" " + qLower)) score += 40;
                
                // Medium priority: Contains the exact full query phrase with word boundaries
                const exactPhraseRegex = new RegExp(`\\b${qLower}\\b`);
                if (exactPhraseRegex.test(tLower)) score += 30;
                else if (tLower.includes(qLower)) score += 15;
            }
            
            // Add points for matching individual terms across fields
            let termsMatchedInTitle = 0;
            terms.forEach(term => {
                const termLower = term.toLowerCase();
                const termRegex = new RegExp(`\\b${termLower}\\b`);
                
                // Matches in title are very important
                if (termRegex.test(tLower)) {
                    score += 10;
                    termsMatchedInTitle++;
                } else if (tLower.includes(termLower)) {
                    score += 3;
                }
                
                // Matches in category/cuisine are moderately important
                if ((img.category || "").toLowerCase().includes(termLower)) score += 5;
                if ((img.cuisine || "").toLowerCase().includes(termLower)) score += 5;
                
                // Matches in tags are somewhat important
                if ((img.manual_tags || []).some(t => t.toLowerCase().includes(termLower))) score += 2;
                if ((img.auto_tags || []).some(t => t.toLowerCase().includes(termLower))) score += 1;
            });

            // If we matched terms in the title, penalize for excess words in the title.
            // E.g. "Roti" (1 word) vs "Kadai Paneer with Roti" (4 words).
            // A dish named closer to the query word count is usually the dish itself, not a combo.
            if (titleWords > queryWords) {
                // Penalize 3 points for every extra word
                score -= (titleWords - queryWords) * 3;
            }

            // Penalize combo/side dish keywords if they weren't explicitly searched for
            const comboWords = ["with", "combo", "thali", "and", "platter"];
            comboWords.forEach(cw => {
                const cwRegex = new RegExp(`\\b${cw}\\b`);
                if (cwRegex.test(tLower) && !qLower.includes(cw)) {
                    score -= 15; // heavy penalty for side dishes/combos
                }
            });

            // Tie-breakers: Use quality & popularity if available
            score += (img.quality_score || 0) * 10;
            score += (img.popularity_score || 0) * 5;
            
            img._relevanceScore = score;
        });

        // 3. Sort by our calculated relevance score descending
        candidates.sort((a, b) => b._relevanceScore - a._relevanceScore);

        // 4. Return the top 40 most relevant results
        const sortedImages = candidates.slice(0, 40);

        return NextResponse.json({
            success: true,
            data: sortedImages,
        });
    } catch (error) {
        console.error("Error searching images:", error);
        return NextResponse.json(
            { success: false, message: "Failed to search images" },
            { status: 500 }
        );
    }
}

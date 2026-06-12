import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
    project: 'advance-maker-499006-k7',
    location: 'us-central1'
});

const generativeModel = vertexAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

const menuSchema = {
    type: "OBJECT",
    properties: {
        categories: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    sub_category: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING" },
                                items: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            name: { type: "STRING" },

                                            description: {
                                                type: "STRING"
                                            },

                                            price: {
                                                type: "NUMBER",
                                                nullable: true
                                            },

                                            foodType: {
                                                type: "STRING",
                                                enum: ["VEG", "NON_VEG", "EGG", "UNKNOWN"]
                                            },

                                            variants: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        name: { type: "STRING" },
                                                        options: {
                                                            type: "ARRAY",
                                                            items: {
                                                                type: "OBJECT",
                                                                properties: {
                                                                    name: { type: "STRING" },
                                                                    price: {
                                                                        type: "NUMBER",
                                                                        nullable: true
                                                                    }
                                                                },
                                                                required: ["name"]
                                                            }
                                                        }
                                                    },
                                                    required: ["name"]
                                                }
                                            }
                                        },
                                        required: ["name"]
                                    }
                                }
                            },
                            required: ["name", "items"]
                        }
                    }
                },
                required: ["name", "sub_category"]
            }
        }
    },
    required: ["categories"]
};

export async function extractMenuFromImage(imageUrl) {
    try {
        const prompt = `
You are a world-class restaurant menu extraction system.
Your job is to extract structured menu data from a restaurant PDF/image.
========================
RULES (VERY IMPORTANT)
========================

1. Output ONLY valid JSON matching the provided schema.
2. Do NOT invent or hallucinate menu items.
3. Preserve exact category → subcategory → item hierarchy.
4. If price is missing → set price = null.

------------------------
FIELD HANDLING RULES
------------------------

5. description:
   - MUST ALWAYS be filled
   - If missing in menu, GENERATE a short food description (5–12 words)
   - Must be simple, human-friendly, and food-focused

   Example:
   "Crispy chicken burger with spicy mayo and lettuce"

6. foodType:
   - Set based on visible clues:
     - VEG → vegetarian items
     - NON_VEG → chicken, mutton, fish, meat
     - EGG → egg-based dishes
     - UNKNOWN → if not clearly identifiable

7. variants:
   - Include ONLY if clearly shown in the menu
   - If not present → return []

8. options inside variants:
   - Include ONLY if visible
   - Otherwise omit or use empty array

------------------------
STRICT RULES
------------------------

9. NEVER leave description empty.
10. NEVER leave foodType empty.
11. NEVER fabricate prices.
12. NEVER create fake variants or options.
13. If unsure → prefer null (only for price).

------------------------
OUTPUT RULE
------------------------

Return ONLY JSON. No explanation. No markdown. No extra text.
`;

        const pdfResponse = await fetch(imageUrl);
        if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF from URL: ${pdfResponse.statusText}`);
        }

        const arrayBuffer = await pdfResponse.arrayBuffer();
        const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

        const response = await generativeModel.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Pdf,
                                mimeType: "application/pdf"
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: menuSchema,
                temperature: 0.1,
            },
        });

        const output = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!output) {
            throw new Error("Empty response from Gemini via Vertex AI");
        }

        let parsed;
        try {
            parsed = JSON.parse(output);
        } catch (err) {
            console.error("❌ Invalid JSON from Gemini:\n", output);
            throw new Error("Failed to parse Gemini response");
        }

        return parsed;
    } catch (error) {
        console.error("❌ Menu extraction error:", error);
        throw error;
    }
}
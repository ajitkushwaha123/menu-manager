import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
    project: "advance-maker-499006-k7",
    location: "us-central1",
});

const generativeModel = vertexAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
});

const descriptionSchema = {
    type: "OBJECT",
    properties: {
        items: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    item_id: {
                        type: "STRING",
                    },
                    name: {
                        type: "STRING",
                    },
                    description: {
                        type: "STRING",
                    },
                },
                required: ["item_id", "name", "description"],
            },
        },
    },
    required: ["items"],
};

export async function generateMenuDescriptions(items = []) {
    console.log("items", items)
    try {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }

        const cleanedItems = items
            .filter(
                (item) =>
                    item &&
                    item.item_id != null &&
                    item.name
            )
            .slice(0, 20);

        const prompt = `
You are an expert restaurant menu copywriter.
Generate a concise menu description for every item.
RULES:
1. Preserve item_id EXACTLY as provided.
2. Preserve name EXACTLY as provided.
3. Description should be one short sentence.
4. Length: 8 - 20 words.
5. Sound natural and appetizing.
6. Do NOT mention price.
7. Do NOT invent variants.
8. Do NOT skip any item.
9. Return valid JSON only.
10. Match the schema exactly.

    Items:

${cleanedItems
                .map(
                    (item) =>
                        `item_id: ${item.item_id}, name: ${item.name}`
                )
                .join("\n")
            }
`;

        const response = await generativeModel.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: descriptionSchema,
                temperature: 0.3,
            },
        });

        const output =
            response.response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!output) {
            throw new Error("Empty response from Gemini");
        }

        const parsed = JSON.parse(output);

        return parsed.items || [];
    } catch (error) {
        console.error("❌ Description generation error:", error);
        throw error;
    }
}
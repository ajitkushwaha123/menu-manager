import { safeParseModelJson } from "@/lib/json-parser"
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const modifiedPriceSchema = {
    type: "object",
    properties: {
        updated_items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    price: { type: "number" },
                    variants: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                property_name: { type: "string" },
                                options: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            option_name: { type: "string" },
                                            price: { type: "number" }
                                        },
                                        required: ["option_name", "price"]
                                    }
                                }
                            },
                            required: ["property_name", "options"]
                        }
                    }
                },
                required: ["id", "price"]
            }
        }
    },
    required: ["updated_items"]
};

export async function modifyPricesWithAI(fileBuffer, mimeType, currentMenuData) {
    const cleanMime = mimeType.toLowerCase().split(";")[0].trim();
    let contentBlock = {};

    if (cleanMime === "application/pdf" || cleanMime.endsWith("pdf")) {
        contentBlock = {
            document: {
                name: `ReferenceMenu_${Date.now()}`,
                format: "pdf",
                source: {
                    bytes: new Uint8Array(fileBuffer)
                }
            }
        };
    } else {
        let imageExt = cleanMime.replace("image/", "");
        if (imageExt === "jpg") imageExt = "jpeg";

        const allowedFormats = ["gif", "jpeg", "png", "webp"];
        if (!allowedFormats.includes(imageExt)) imageExt = "jpeg";

        contentBlock = {
            image: {
                format: imageExt,
                source: {
                    bytes: new Uint8Array(fileBuffer)
                }
            }
        };
    }

    const systemPromptText = `
You are an intelligent menu pricing assistant. You will be provided with a reference file (image/PDF) containing a menu with prices, and a JSON list of the current items in the database (IDs and Names only).
Your job is to find the items from the JSON list in the reference file, extract their prices, and output a JSON array mapping the item IDs to the prices found in the file.
Use the tool 'output_modified_prices' to return your response.
`;

    const promptText = `
Here is the current menu data in JSON format (IDs and Names only):
${JSON.stringify(currentMenuData)}

==================================================
RULES FOR PRICE EXTRACTION
==================================================
1. READ THE IMAGE/PDF: Extract all prices directly from the attached image/PDF.
2. MATCHING: Find each item in the image/PDF. Then, look for a matching name in the JSON to get its "id".
3. OUTPUT: Output every item you successfully mapped to an ID, along with its price from the image/PDF.
4. VARIANTS: If an item has variants (e.g., Half, Full) in the image, map the variant prices accurately.
5. IGNORE: Do NOT include items you cannot confidently match to the JSON.
6. YOU MUST USE THE 'output_modified_prices' tool to provide the structured JSON matching the provided schema.
`;

    const commandInput = {
        modelId: "amazon.nova-lite-v1:0",
        system: [{ text: systemPromptText }],
        messages: [
            {
                role: "user",
                content: [
                    contentBlock,
                    { text: promptText }
                ]
            }
        ],
        toolConfig: {
            tools: [
                {
                    toolSpec: {
                        name: "output_modified_prices",
                        description: "Outputs a list of items with their newly updated prices and variant prices.",
                        inputSchema: { json: modifiedPriceSchema }
                    }
                }
            ],
            toolChoice: { tool: { name: "output_modified_prices" } }
        },
        inferenceConfig: {
            maxTokens: 10000,
            temperature: 0.1
        }
    };

    try {
        const command = new ConverseCommand(commandInput);
        const response = await bedrockClient.send(command);

        const content = response?.output?.message?.content || [];
        const toolBlock = content.find(block => block.toolUse);

        if (toolBlock?.toolUse?.input) {
            return toolBlock.toolUse.input;
        }

        const rawText = content
            .map(block => {
                if (block.text) return block.text;
                if (block.toolUse?.input) return JSON.stringify(block.toolUse.input);
                return "";
            })
            .join("\n");

        const recovered = safeParseModelJson(rawText);

        if (recovered) {
            return recovered;
        }

        return { updated_items: [] };
    } catch (error) {
        console.error("Failed handling Nova Lite price modification step:", error);
        throw error;
    }
}

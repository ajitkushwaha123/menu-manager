import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import axios from "axios";

function generateImagePath(imageName) {
    const sanitizedName = imageName
        .replace(/[<>:"/\\|?*]/g, "")
        .trim();

    return `web-sdk/food/${randomUUID()}/${sanitizedName}`;
}

export async function POST(request) {
    try {
        const incomingForm = await request.formData();

        const image = incomingForm.get("image");
        const itemName = incomingForm.get("itemName");

        if (!image) {
            return NextResponse.json(
                {
                    success: false,
                    message: "image is required",
                },
                { status: 400 }
            );
        }

        if (!itemName) {
            return NextResponse.json(
                {
                    success: false,
                    message: "itemName is required",
                },
                { status: 400 }
            );
        }

        const imagePath = generateImagePath(
            image.name || `${itemName}.jpg`
        );

        /**
         * STEP 1
         * Get presigned upload URL
         */
        const uploadForm = new FormData();

        uploadForm.append("image_name", imagePath);
        uploadForm.append("project_details", "true");
        uploadForm.append(
            "prod_cat_id",
            process.env.PRODUCT_CAT_ID
        );
        uploadForm.append("source", "web_sdk");
        uploadForm.append("project_name", "Swiggy");
        uploadForm.append("sku_name", itemName);

        const { data: uploadResponse } =
            await axios.put(
                `${process.env.NEXT_PUBLIC_SWIGGY_CLIPPER_API}/api/fv1/upload/image`,
                uploadForm,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.SWIGGY_CLIPPER_API_TOKEN}`,
                        Origin:
                            "https://partner.swiggy.com",
                        Referer:
                            "https://partner.swiggy.com/",
                    },
                }
            );

        const {
            presigned_url,
            file_url,
            project_id,
            sku_id,
            request_id,
        } = uploadResponse.data;

        /**
         * STEP 2
         * Upload binary to S3
         */
        const buffer = Buffer.from(
            await image.arrayBuffer()
        );

        await axios.put(
            presigned_url,
            buffer,
            {
                headers: {
                    "Content-Type":
                        image.type ||
                        "image/jpeg",

                    "Content-Length":
                        buffer.length,

                    Origin:
                        "https://partner.swiggy.com",

                    Referer:
                        "https://partner.swiggy.com/",
                },

                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        /**
         * STEP 3
         * Angle Classifier
         */
        const angleForm = new FormData();

        angleForm.append(
            "image_url",
            file_url
        );

        angleForm.append(
            "prod_cat_id",
            process.env.PRODUCT_CAT_ID
        );

        angleForm.append(
            "project_id",
            project_id
        );

        angleForm.append(
            "sku_id",
            sku_id
        );

        const { data: angleResponse } =
            await axios.post(
                `${process.env.NEXT_PUBLIC_SWIGGY_CLIPPER_API}/api/fv2/image/angle-classifier`,
                angleForm,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.SWIGGY_CLIPPER_API_TOKEN}`,
                        Origin:
                            "https://partner.swiggy.com",
                        Referer:
                            "https://partner.swiggy.com/",
                    },
                }
            );

        const classificationStatus =
            angleResponse?.data
                ?.classification_status;

        if (
            classificationStatus !==
            "passed"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    stage:
                        "angle-classifier",
                    classification:
                        angleResponse,
                },
                {
                    status: 400,
                }
            );
        }

        const {
            category,
            sub_category,
            angle,
        } =
            angleResponse.data
                .classification_result;

        /**
         * STEP 4
         * Stable Diffusion
         */
        const sessionId =
            `web_food_${randomUUID()}`;

        const {
            data: stableDiffusionResponse,
        } = await axios.post(
            `${process.env.NEXT_PUBLIC_SWIGGY_CLIPPER_API}/api/nv2/app/stable-diffusion`,
            {
                prod_cat_id:
                    process.env.PRODUCT_CAT_ID,

                image_url:
                    file_url,

                source:
                    "web_sdk",

                image_name:
                    imagePath,

                angle,

                prod_sub_cat_id:
                    sub_category,

                image_category:
                    category,

                sku_id,

                prompt_id:
                    process.env.CLIPPER_PROMPT_ID ||
                    "prompt_12335",

                project_id,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.SWIGGY_CLIPPER_API_TOKEN}`,

                    enterprise_id:
                        process.env.CLIPPER_ENTERPRISE_ID,

                    sdk_version:
                        "1.0.5-beta",

                    session_id:
                        sessionId,

                    Origin:
                        "https://partner.swiggy.com",

                    Referer:
                        "https://partner.swiggy.com/",
                },
            }
        );

        /**
         * DEBUG
         */
        console.log(
            "Stable Diffusion Response:",
            JSON.stringify(
                stableDiffusionResponse,
                null,
                2
            )
        );

        const imageId = stableDiffusionResponse?.data?.image_id;

        if (!imageId) {
            return NextResponse.json(
                {
                    success: false,
                    stage:
                        "stable-diffusion",
                    message:
                        "No image_list returned from stable-diffusion",

                    stableDiffusionResponse,
                },
                {
                    status: 400,
                }
            );
        }

        const {
            data: markDoneResponse,
        } = await axios.put(
            `${process.env.NEXT_PUBLIC_SWIGGY_CLIPPER_API}/api/fv1/process/mark-done`,
            {
                sku_id,
                project_id,
                image_list:
                    [imageId],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.SWIGGY_CLIPPER_API_TOKEN}`,
                    "Content-Type":
                        "application/json",
                    Origin:
                        "https://partner.swiggy.com",
                    Referer:
                        "https://partner.swiggy.com/",
                },
            }
        );

        return NextResponse.json({
            success: true,
            imagePath,
            file_url,
            project_id,
            sku_id,
            request_id,
            upload:
                uploadResponse,
            classification:
                angleResponse,
            stableDiffusion:
                stableDiffusionResponse,
            markDone:
                markDoneResponse,
        });
    } catch (error) {
        console.error(
            "CLIPPR ERROR:",
            error?.response?.data ||
            error
        );

        return NextResponse.json(
            {
                success: false,

                message:
                    error?.response?.data
                        ?.message ||
                    error?.message ||
                    "Something went wrong",

                error:
                    error?.response?.data,
            },
            {
                status:
                    error?.response
                        ?.status || 500,
            }
        );
    }
}
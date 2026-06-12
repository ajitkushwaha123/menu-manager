"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MenuService } from "@/services/menu";
import { useMenu } from "@/store/hooks/useMenu";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/global/general/image-upload";

export default function CatalogueCard({ item, resId }) {
    const { updateCatalogue, addImage } = useMenu(resId);

    const [uploadStatus, setUploadStatus] = useState("idle");

    const catalogueId = item?.catalogueId || item?.id;

    const updateField = (field, value) => {
        if (!catalogueId) return;

        updateCatalogue({
            catalogueId,
            updates: {
                [field]: value,
            },
        });
    };

    const handleImageUpload = async (file) => {
        try {
            if (!file || !catalogueId) return;

            setUploadStatus("uploading");

            const formData = new FormData();
            formData.append("file", file);
            const res = await MenuService.imageUpload(resId, formData);
            const uploadRes = res?.data

            console.log("res", uploadRes)
            if (uploadRes?.upload_status === "approved") {
                addImage({
                    catalogueId,
                    media: uploadRes?.data
                });

                setUploadStatus("approved");
                return;
            }

            setUploadStatus("rejected");
        } catch (err) {
            console.error("Upload failed:", err);
            setUploadStatus("rejected");
        }
    };

    const handleRemove = () => {
        updateCatalogue({
            catalogueId,
            updates: {
                thumbUrl: "",
                imageUrl: "",
            },
        });

        setUploadStatus("idle");
    };

    return (
        <div
            className={cn(
                "rounded-2xl border bg-card p-5 transition-all",
                "hover:border-primary/40"
            )}
        >
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <ImageUpload
                    value={item?.thumbUrl}
                    onUpload={handleImageUpload}
                    onRemove={handleRemove}
                    status={uploadStatus}
                    className="w-full"
                    height={248}
                />

                <div className="space-y-5">
                    <Input
                        value={item?.name || ""}
                        placeholder="Item Name"
                        className="text-lg font-semibold"
                        onChange={(e) =>
                            updateField("name", e.target.value)
                        }
                    />

                    <Textarea
                        rows={4}
                        value={item?.description || ""}
                        placeholder="Item description..."
                        onChange={(e) =>
                            updateField("description", e.target.value)
                        }
                    />
                </div>
            </div>
        </div>
    );
}

// [
//     {
// "tempReferenceId": "EPD22XW71JQGNBK484H09D2CMQ3LEU1B",
// "mediaId": "6ef5f9ea9c319f0a1841e35dad0319b4.jpg",
// "mediaType": "PHOTO",
// "url": "https://b.zmtcdn.com/data/dish_photos/9b4/6ef5f9ea9c319f0a1841e35dad0319b4.jpg",
// "thumbUrl": "https://b.zmtcdn.com/data/dish_photos/9b4/6ef5f9ea9c319f0a1841e35dad0319b4.jpg?fit=around%7C200%3A200&crop=200%3A200%3B%2A%2C%2A",
// "isNewlyUploaded": true,
// "usageType": "FOODSHOT",
// "mediaTags": [],
// "metadata": {
//     "dimensions": {
//         "width": 1800,
//         "height": 1200
//     }
// },
// "isStockPhoto": false,
// "isZoomed": false,
// "isLowScore": false,
// "isUploading": false,
// "order": 1
//     }
// ]
"use client";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { UploadCloud, ImagePlus, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ImageUpload({
    value,
    onUpload,
    onRemove,
    status = "idle",
    className,
    height = 208,
    onClick,
}) {
    const fileInputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState(value);

    useEffect(() => {
        setPreview(value);
    }, [value]);

    const handleFile = async (file) => {
        if (!file) return;
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        await onUpload?.(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const handleChange = (e) => {
        handleFile(e.target.files?.[0]);
    };

    const handleRemove = () => {
        setPreview("");
        onRemove?.();
    };

    const borderColor = {
        idle: "border-muted",
        uploading: "border-blue-400",
        approved: "border-green-500",
        rejected: "border-red-500",
    }[status];

    return (
        <div className={cn("space-y-3", className)}>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => {
                    if (onClick) {
                        onClick();
                    } else {
                        fileInputRef.current?.click();
                    }
                }}
                className={cn(
                    "group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all",
                    dragging ? "border-primary bg-primary/5" : borderColor
                )}
                style={{ height }}
            >
                {status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2 text-sm">Uploading...</span>
                    </div>
                )}

                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="upload"
                            className="h-full w-full object-cover"
                        />
                        {status === "approved" && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs text-white">
                                <CheckCircle className="h-3 w-3" />
                                Approved
                            </div>
                        )}

                        {status === "rejected" && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs text-white">
                                <XCircle className="h-3 w-3" />
                                Rejected
                            </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="text-center text-white">
                                <UploadCloud className="mx-auto mb-2 h-8 w-8" />
                                <p className="text-sm font-medium">
                                    Change Image
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">Upload Image</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Drag & Drop or Click
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-muted transition"
                >
                    Upload
                </button>

                <button
                    onClick={handleRemove}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-muted transition"
                >
                    <Trash2 className="mr-1 inline h-4 w-4" />
                    Remove
                </button>
            </div>
        </div>
    );
}
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MenuService } from "@/services/menu";
import { useMenu } from "@/store/hooks/useMenu";
import { useDispatch } from "react-redux";
import { openImageSidebar } from "@/store/slices/menuSlice";
import ImageUpload from "@/components/global/general/image-upload";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, GripVertical, ChevronDown, ChevronUp, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CatalogueCard({ item, resId }) {
    const dispatch = useDispatch();
    const { updateCatalogue, addImage, deleteItem } = useMenu(resId);
    const [uploadStatus, setUploadStatus] = useState("idle");
    const [showVariants, setShowVariants] = useState(false);

    const catalogueId = item?.id;

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
            const uploadRes = res?.data;

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

    const handleRemoveImage = () => {
        updateCatalogue({
            catalogueId,
            updates: {
                image: null,
                thumbUrl: "",
                imageUrl: "",
            },
        });
        setUploadStatus("idle");
    };

    const addVariantGroup = () => {
        const variants = [...(item?.variants || [])];
        variants.push({
            id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
            property_name: "",
            options: []
        });
        updateField("variants", variants);
        setShowVariants(true);
    };

    const updateVariantGroup = (groupId, field, value) => {
        const variants = (item?.variants || []).map(v => 
            v.id === groupId ? { ...v, [field]: value } : v
        );
        updateField("variants", variants);
    };

    const removeVariantGroup = (groupId) => {
        const variants = (item?.variants || []).filter(v => v.id !== groupId);
        updateField("variants", variants);
    };

    const addVariantOption = (groupId) => {
        const variants = (item?.variants || []).map(v => {
            if (v.id === groupId) {
                return {
                    ...v,
                    options: [...(v.options || []), { 
                        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
                        option_name: "", 
                        price: 0 
                    }]
                };
            }
            return v;
        });
        updateField("variants", variants);
    };

    const updateVariantOption = (groupId, optionId, field, value) => {
        const variants = (item?.variants || []).map(v => {
            if (v.id === groupId) {
                return {
                    ...v,
                    options: (v.options || []).map(opt => 
                        opt.id === optionId ? { ...opt, [field]: value } : opt
                    )
                };
            }
            return v;
        });
        updateField("variants", variants);
    };

    const removeVariantOption = (groupId, optionId) => {
        const variants = (item?.variants || []).map(v => {
            if (v.id === groupId) {
                return {
                    ...v,
                    options: (v.options || []).filter(opt => opt.id !== optionId)
                };
            }
            return v;
        });
        updateField("variants", variants);
    };

    const hasVariants = item?.variants && item.variants.length > 0;

    return (
        <div className={cn("rounded-2xl border border-border/50 bg-white p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group")}>
            {/* ULTRA COMPACT ROW LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-start">
                
                {/* 48x48 Icon Thumbnail */}
                <div className="w-[48px] shrink-0">
                    <ImageUpload
                        value={item?.image?.url || item?.image?.utl || item?.thumbUrl || item?.imageUrl}
                        onUpload={handleImageUpload}
                        onRemove={handleRemoveImage}
                        onClick={() => dispatch(openImageSidebar(item))}
                        status={uploadStatus}
                        className="w-[48px] h-[48px] rounded-xl overflow-hidden shadow-sm"
                        height={48}
                    />
                </div>

                {/* Form Fields: Stacked tightly */}
                <div className="flex flex-col gap-1 min-w-0">
                    {/* Top Row: Name, Price, Type */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                        <Input
                            value={item?.name || ""}
                            placeholder="Menu Item Name"
                            className="h-8 flex-1 text-sm font-bold tracking-tight border-transparent hover:border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-transparent hover:bg-slate-50 focus:bg-white transition-all rounded-lg px-2 min-w-[140px]"
                            onChange={(e) => updateField("name", e.target.value)}
                        />
                        
                        <div className="relative w-[100px] shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">₹</span>
                            <Input
                                type="number"
                                value={item?.price || ""}
                                placeholder="0.00"
                                className="h-8 pl-6 text-sm font-bold border-transparent hover:border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all rounded-lg"
                                onChange={(e) => updateField("price", parseFloat(e.target.value) || null)}
                            />
                        </div>
                        
                        <div className="w-[110px] shrink-0">
                            <Select value={item?.is_veg || "UNKNOWN"} onValueChange={(val) => updateField("is_veg", val)}>
                                <SelectTrigger className="h-8 text-xs font-medium border-transparent hover:border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all rounded-lg">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="VEG" className="text-xs font-medium rounded-md">Veg</SelectItem>
                                    <SelectItem value="NON_VEG" className="text-xs font-medium rounded-md">Non-Veg</SelectItem>
                                    <SelectItem value="EGG" className="text-xs font-medium rounded-md">Egg</SelectItem>
                                    <SelectItem value="UNKNOWN" className="text-xs font-medium rounded-md text-muted-foreground">Unknown</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Bottom Row: Description */}
                    <Input
                        value={item?.description || ""}
                        placeholder="Add a brief description..."
                        className="h-7 text-xs font-medium text-muted-foreground border-transparent hover:border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-transparent hover:bg-slate-50 focus:bg-white transition-all rounded-md px-2"
                        onChange={(e) => updateField("description", e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 items-center shrink-0 justify-end">
                    <Button 
                        variant={hasVariants ? "secondary" : "ghost"} 
                        size="sm" 
                        className={cn(
                            "h-8 rounded-lg px-3 text-xs font-semibold transition-all active:scale-95",
                            hasVariants ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground hover:bg-slate-100"
                        )}
                        onClick={() => setShowVariants(!showVariants)}
                    >
                        Variants {hasVariants && `(${item.variants.length})`}
                        {showVariants ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => deleteItem({ itemId: catalogueId })}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* COLLAPSIBLE PILL-BASED VARIANTS EDITOR */}
            {showVariants && (
                <div className="mt-3 border-t border-border/50 bg-slate-50/50 -mx-3 -mb-3 px-4 py-3 rounded-b-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-foreground">Variants & Options</h4>
                        <Button variant="outline" size="sm" onClick={addVariantGroup} className="h-7 rounded-md text-xs font-semibold bg-white shadow-sm hover:shadow active:scale-95 transition-all px-2">
                            <Plus className="mr-1 h-3 w-3" /> Add Group
                        </Button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {(item?.variants || []).map((variant) => (
                            <div key={variant.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 border border-border/60 rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                {/* Group Name */}
                                <div className="flex items-center shrink-0 w-[140px]">
                                    <GripVertical className="h-3 w-3 text-muted-foreground/40 mr-1" />
                                    <Input 
                                        value={variant.property_name || ""} 
                                        onChange={(e) => updateVariantGroup(variant.id, 'property_name', e.target.value)}
                                        className="h-7 text-xs font-bold border-transparent hover:border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-transparent px-1.5"
                                        placeholder="Group (e.g. Size)"
                                    />
                                    <button 
                                        onClick={() => removeVariantGroup(variant.id)}
                                        className="h-6 w-6 ml-1 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                                
                                {/* Options Inline Strip */}
                                <div className="flex-1 flex flex-wrap gap-1.5 pl-2 sm:pl-0 border-l sm:border-l-0 border-border/50 ml-2 sm:ml-0">
                                    {(variant.options || []).map((option) => (
                                        <div key={option.id} className="flex items-center bg-slate-100 hover:bg-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 border border-border/50 transition-colors rounded-full h-7 pl-2 pr-1">
                                            <Input 
                                                value={option.option_name || ""}
                                                onChange={(e) => updateVariantOption(variant.id, option.id, 'option_name', e.target.value)}
                                                placeholder="Name"
                                                className="h-5 w-[60px] text-xs font-medium border-0 focus-visible:ring-0 p-0 bg-transparent shadow-none"
                                            />
                                            <span className="text-muted-foreground/60 text-[10px] mx-0.5">₹</span>
                                            <Input 
                                                type="number"
                                                value={option.price}
                                                onChange={(e) => updateVariantOption(variant.id, option.id, 'price', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="h-5 w-[36px] text-xs font-bold border-0 focus-visible:ring-0 p-0 bg-transparent shadow-none"
                                            />
                                            <button 
                                                onClick={() => removeVariantOption(variant.id, option.id)}
                                                className="h-5 w-5 ml-0.5 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-white transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addVariantOption(variant.id)}
                                        className="flex items-center justify-center h-7 px-2 rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/5 text-xs font-medium transition-colors"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!item?.variants || item.variants.length === 0) && (
                            <p className="text-xs text-muted-foreground italic pl-1 py-1">No variants configured.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
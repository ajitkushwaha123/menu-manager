import { Trash2, Plus, ImageIcon, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { useState } from "react";

export default function MenuItemRow({
    item,
    onChange,
    onDelete,
    onImageChange,
}) {
    const [variantsExpanded, setVariantsExpanded] = useState(false);

    const updateField = (field, value) => {
        onChange?.({
            [field]: value,
        });
    };

    // --- Variants Logic ---
    const variants = item?.variants || [];

    const addVariantGroup = () => {
        const newGroup = {
            property_name: "New Group",
            property_id: Date.now().toString(),
            options: []
        };
        updateField("variants", [...variants, newGroup]);
        setVariantsExpanded(true);
    };

    const updateVariantGroup = (groupIndex, field, value) => {
        const newVariants = [...variants];
        newVariants[groupIndex] = { ...newVariants[groupIndex], [field]: value };
        updateField("variants", newVariants);
    };

    const deleteVariantGroup = (groupIndex) => {
        const newVariants = variants.filter((_, idx) => idx !== groupIndex);
        updateField("variants", newVariants);
    };

    const addVariantOption = (groupIndex) => {
        const newVariants = [...variants];
        const group = { ...newVariants[groupIndex] };
        group.options = [
            ...(group.options || []),
            { option_name: "New Option", price: 0, is_default: false, option_id: Date.now().toString() }
        ];
        newVariants[groupIndex] = group;
        updateField("variants", newVariants);
    };

    const updateVariantOption = (groupIndex, optionIndex, field, value) => {
        const newVariants = [...variants];
        const group = { ...newVariants[groupIndex] };
        const newOptions = [...(group.options || [])];
        newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
        
        group.options = newOptions;
        newVariants[groupIndex] = group;
        updateField("variants", newVariants);
    };

    const deleteVariantOption = (groupIndex, optionIndex) => {
        const newVariants = [...variants];
        const group = { ...newVariants[groupIndex] };
        group.options = (group.options || []).filter((_, idx) => idx !== optionIndex);
        newVariants[groupIndex] = group;
        updateField("variants", newVariants);
    };

    return (
        <div className="group bg-white border rounded-xl p-3 hover:border-orange-300 transition-all mb-3">
            <div className="flex gap-3">
                <div className="relative shrink-0">
                    <img
                        src={
                            item?.image_url ||
                            item?.image ||
                            "https://placehold.co/200x200?text=Food"
                        }
                        alt={item?.name || "Item"}
                        className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <button
                        onClick={() => onImageChange?.(item)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] rounded-lg"
                        title="Change Image"
                    >
                        <ImageIcon className="text-white" size={24} />
                    </button>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 flex items-center gap-3">
                                <select
                                    value={item?.is_veg || "UNKNOWN"}
                                    onChange={(e) => updateField("is_veg", e.target.value)}
                                    className={`text-xs font-medium px-2 py-1 rounded-md border outline-none cursor-pointer ${
                                        (!item?.is_veg || item?.is_veg === "UNKNOWN") ? "border-red-500 text-red-500" : "border-gray-200"
                                    }`}
                                >
                                    <option value="UNKNOWN" disabled>Select</option>
                                    <option value="VEG">VEG</option>
                                    <option value="NONVEG">NONVEG</option>
                                    <option value="EGG">EGG</option>
                                </select>
                                <input
                                    type="text"
                                    value={item?.name || ""}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    placeholder="Item name"
                                    className={`flex-1 font-semibold placeholder:text-gray-400 outline-none bg-transparent ${
                                        !item?.name?.trim() ? "border-b border-red-500 text-red-500" : "text-gray-800"
                                    }`}
                                />
                            </div>
                            <div className="flex items-center gap-1 font-semibold">
                                <span className="text-gray-500">₹</span>
                                <input
                                    type="number"
                                    value={item?.price ?? ""}
                                    onChange={(e) => updateField("price", e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="0"
                                    className={`w-20 text-right outline-none bg-transparent ${
                                        item?.price === "" || item?.price === null || item?.price === undefined ? "border-b border-red-500 text-red-500" : "text-gray-800"
                                    }`}
                                />
                            </div>
                        </div>

                        <input
                            type="text"
                            value={item?.description || ""}
                            onChange={(e) => updateField("description", e.target.value)}
                            placeholder="Description"
                            className={`w-full text-sm placeholder:text-gray-400 outline-none bg-transparent ${
                                !item?.description?.trim() ? "border-b border-red-500 text-red-500" : "text-gray-500"
                            }`}
                        />
                    </div>
                </div>
                {/* DELETE */}
                <div className="shrink-0 flex items-center">
                    <button
                        onClick={() => onDelete?.(item)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* VARIANTS SECTION */}
            <div className="mt-2 border-t pt-2">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setVariantsExpanded(!variantsExpanded)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
                    >
                        {variantsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Variants ({variants.length})
                    </button>
                    <button
                        onClick={addVariantGroup}
                        className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                        <Plus size={14} /> Add Variant Group
                    </button>
                </div>

                {variantsExpanded && variants.length > 0 && (
                    <div className="mt-3 space-y-4">
                        {variants.map((group, gIdx) => (
                            <div key={gIdx} className="bg-slate-50 border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <input
                                        type="text"
                                        value={group.property_name || ""}
                                        onChange={(e) => updateVariantGroup(gIdx, "property_name", e.target.value)}
                                        placeholder="Group Name (e.g., Size, Add-ons)"
                                        className="font-semibold text-sm bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-primary px-1 w-1/2"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => addVariantOption(gIdx)}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Add Option
                                        </button>
                                        <button
                                            onClick={() => deleteVariantGroup(gIdx)}
                                            className="text-xs text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {(group.options || []).map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2 bg-white border rounded px-2 py-1">
                                            <input
                                                type="text"
                                                value={opt.option_name || ""}
                                                onChange={(e) => updateVariantOption(gIdx, oIdx, "option_name", e.target.value)}
                                                placeholder="Option name"
                                                className="text-sm bg-transparent outline-none flex-1 min-w-0"
                                            />
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <span className="text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={opt.price || ""}
                                                    onChange={(e) => updateVariantOption(gIdx, oIdx, "price", Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-16 text-right bg-transparent outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => deleteVariantOption(gIdx, oIdx)}
                                                className="text-red-400 hover:text-red-600 p-1 shrink-0 ml-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!group.options || group.options.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">No options added yet.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

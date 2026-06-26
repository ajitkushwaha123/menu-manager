"use client";
import { Button } from "@/components/ui/button";
import { useMenu } from "@/store/hooks/useMenu";
import { useMemo, useState, useEffect } from "react";
import InlineInput from "@/components/ui/inline-input";
import { Plus, Layers, Ticket } from "lucide-react";
import CategoryCard from "./CategoryCard";

export default function CategorySidebar({
    resId,
    platform,
    activeView,
    setActiveView,
}) {
    const {
        menu,
        restaurantName,
        activeCategory,
        activeSubCategory,
        addCategory,
        addSubCategory,
        updateCategory,
        updateSubCategory,
        deleteCategory,
        deleteSubCategory,
        setActiveCategory,
        setActiveSubCategory,
        queueAll,
        queueCategory
    } = useMenu(resId, platform);

    const handleSetActiveCategory = (catId) => {
        if (setActiveView) {
            setActiveView("MENU");
        }
        setActiveCategory(catId);
    };

    const handleSetActiveSubCategory = (subId) => {
        if (setActiveView) {
            setActiveView("MENU");
        }
        setActiveSubCategory(subId);
    };

    const [search, setSearch] = useState("");
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [addingSubCategoryFor, setAddingSubCategoryFor] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSubCategory, setEditingSubCategory] = useState(null);

    useEffect(() => {
        if (activeCategory && activeCategory !== expandedCategory) {
            setExpandedCategory(activeCategory);
        }
    }, [activeCategory]);

    const categories = useMemo(() => {
        if (!Array.isArray(menu)) return [];
        return menu.map((cat) => ({
            id: cat.id,
            name: cat.name,
            temp_id: cat.temp_id,
            raw: cat,
            subcategories: (cat.sub_category || [])
                .map((sub) => ({
                    id: sub.id,
                    name: sub.name,
                    temp_id: sub.temp_id,
                    raw: sub,
                }))
                .sort((a, b) => a.name?.localeCompare(b.name || "")),
        })).sort((a, b) => a.name?.localeCompare(b.name || ""));
    }, [menu]);

    useEffect(() => {
        if (categories.length > 0 && !expandedCategory && !activeCategory) {
            setExpandedCategory(categories[0].id);
        }
    }, [categories, expandedCategory, activeCategory]);

    const filteredCategories = useMemo(() => {
        if (!search.trim()) {
            return categories;
        }

        const query = search.toLowerCase();

        return categories
            .map((category) => ({
                ...category,
                subcategories: category.subcategories.filter(
                    (sub) => sub.name.toLowerCase().includes(query)
                ),
            }))
            .filter(
                (category) =>
                    category.name.toLowerCase().includes(query) ||
                    category.subcategories.length > 0
            );
    }, [categories, search]);

    return (
        <aside className="flex h-full w-[300px] flex-col border-r bg-white/60 backdrop-blur-xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 shrink-0">
            <div className="border-b border-border/50 px-5 py-2 bg-white/40 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[200px]" title={restaurantName || "Menu Structure"}>
                            {restaurantName || "Menu Structure"}
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {categories.length} Categories
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 shadow-sm active:scale-95 transition-transform text-xs"
                            onClick={() => queueAll()}
                            title="Queue entire menu"
                        >
                            Queue All
                        </Button>
                        <Button
                            size="icon"
                            className="rounded-full h-8 w-8 shadow-sm active:scale-95 transition-transform"
                            onClick={() => setAddingCategory(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {addingCategory && (
                    <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <InlineInput
                            placeholder="Category name"
                            onSubmit={(name) => {
                                addCategory(name);
                                setAddingCategory(false);
                            }}
                            onCancel={() => setAddingCategory(false)}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {setActiveView && (
                <div className="px-5 py-3 border-b border-border/50 bg-slate-50/30 shrink-0">
                    <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setActiveView("MENU")}
                            className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                activeView === "MENU"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-950"
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Menu Editor
                        </button>
                        <button
                            onClick={() => setActiveView("TICKETS")}
                            className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                activeView === "TICKETS"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-950"
                            }`}
                        >
                            <Ticket className="w-3.5 h-3.5" />
                            Swiggy Tickets
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto w-full">
                <div className="space-y-2 p-3 pb-8">
                    {filteredCategories.map((category, index) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            index={index}
                            isExpanded={expandedCategory === category.id}
                            isCategoryActive={activeCategory === category.id}
                            activeSubCategory={activeSubCategory}
                            editingCategory={editingCategory}
                            editingSubCategory={editingSubCategory}
                            addingSubCategoryFor={addingSubCategoryFor}
                            setEditingCategory={setEditingCategory}
                            setEditingSubCategory={setEditingSubCategory}
                            setAddingSubCategoryFor={setAddingSubCategoryFor}
                            setExpandedCategory={setExpandedCategory}
                            setActiveCategory={handleSetActiveCategory}
                            setActiveSubCategory={handleSetActiveSubCategory}
                            updateCategory={updateCategory}
                            deleteCategory={deleteCategory}
                            addSubCategory={addSubCategory}
                            updateSubCategory={updateSubCategory}
                            deleteSubCategory={deleteSubCategory}
                            queueCategory={queueCategory}
                        />
                    ))}
                </div>
            </div>
        </aside>
    );
}

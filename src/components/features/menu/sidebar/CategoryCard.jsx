"use client";

import { ChevronDown, ChevronRight, FolderKanban, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import InlineInput from "@/components/ui/inline-input";
import SubCategoryList from "./sub-category-list";
import ActionMenu from "./ActionMenu";

export default function CategoryCard({
    category,
    index,
    isExpanded,
    isCategoryActive,
    activeSubCategory,
    editingCategory,
    editingSubCategory,
    addingSubCategoryFor,
    setEditingCategory,
    setEditingSubCategory,
    setAddingSubCategoryFor,
    setExpandedCategory,
    setActiveCategory,
    setActiveSubCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    queueCategory,
}) {
    const handleCategorySelect = () => {
        setActiveCategory(category.id);
        setExpandedCategory(category.id);

        if (category.subcategories?.length) {
            setActiveSubCategory(category.subcategories[0].id);
        }
    };

    const toggleExpand = () => {
        setExpandedCategory((prev) =>
            prev === category.id ? null : category.id
        );
    };

    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in",
                isCategoryActive
                    ? "border-primary/30 shadow-sm bg-primary/[0.02]"
                    : "bg-white/80 border-border/50 hover:border-border"
            )}
            style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: "both",
            }}
        >
            {/* Header */}
            <div
                className={cn(
                    "group flex items-center gap-1.5 p-2 transition-colors",
                    isCategoryActive &&
                    "bg-gradient-to-r from-primary/10 to-transparent"
                )}
            >
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 rounded-lg hover:bg-black/5"
                    onClick={toggleExpand}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </Button>

                {editingCategory === category.id ? (
                    <div className="flex-1 pr-1 text-sm">
                        <InlineInput
                            defaultValue={category.name}
                            onSubmit={(name) => {
                                updateCategory(category.id, { name });
                                setEditingCategory(null);
                            }}
                            onCancel={() => setEditingCategory(null)}
                        />
                    </div>
                ) : (
                    <>
                        <button
                            className="flex flex-1 items-center gap-2.5 text-left overflow-hidden min-w-0"
                            onClick={handleCategorySelect}
                        >
                            <div
                                className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    isCategoryActive
                                        ? "bg-primary shadow-sm"
                                        : "bg-primary/10"
                                )}
                            >
                                <FolderKanban
                                    className={cn(
                                        "h-4 w-4",
                                        isCategoryActive
                                            ? "text-primary-foreground"
                                            : "text-primary"
                                    )}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn(
                                        "truncate text-sm font-semibold",
                                        isCategoryActive
                                            ? "text-primary"
                                            : "text-foreground"
                                    )}
                                >
                                    {category.name}
                                </p>

                                <p className="text-[10px] text-muted-foreground">
                                    {category.subcategories.length} subcategories
                                </p>
                            </div>
                        </button>

                        <ActionMenu
                            triggerClassName="h-7 w-7 shrink-0 rounded-lg opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                            onRename={() =>
                                setEditingCategory(category.id)
                            }
                            onDelete={() =>
                                deleteCategory(category.id)
                            }
                            onQueue={() => queueCategory(category.id)}
                        />
                    </>
                )}
            </div>

            {/* Body */}
            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-border/50 px-2.5 py-2.5 bg-white/40">
                        <SubCategoryList
                            category={category}
                            activeSubCategory={activeSubCategory}
                            editingSubCategory={editingSubCategory}
                            setEditingSubCategory={
                                setEditingSubCategory
                            }
                            updateSubCategory={updateSubCategory}
                            deleteSubCategory={deleteSubCategory}
                            setActiveCategory={setActiveCategory}
                            setActiveSubCategory={
                                setActiveSubCategory
                            }
                        />

                        {addingSubCategoryFor === category.id ? (
                            <div className="mt-1.5 px-1 text-sm">
                                <InlineInput
                                    placeholder="Subcategory name"
                                    onSubmit={(name) => {
                                        addSubCategory(
                                            category.id,
                                            name
                                        );

                                        setAddingSubCategoryFor(
                                            null
                                        );
                                    }}
                                    onCancel={() =>
                                        setAddingSubCategoryFor(
                                            null
                                        )
                                    }
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 w-full justify-start"
                                onClick={() =>
                                    setAddingSubCategoryFor(
                                        category.id
                                    )
                                }
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add Subcategory
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

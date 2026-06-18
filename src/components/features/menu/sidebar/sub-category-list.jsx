import { cn } from "@/lib/utils";
import ActionMenu from "./ActionMenu";
import InlineInput from "@/components/ui/inline-input";

export default function SubCategoryList({
    category,
    activeSubCategory,
    editingSubCategory,
    setEditingSubCategory,
    updateSubCategory,
    deleteSubCategory,
    setActiveCategory,
    setActiveSubCategory,
}) {
    const subcategories = category?.subcategories ?? [];
    if (!subcategories.length) return null;

    return (
        <div className="space-y-1">
            {subcategories.map((sub) => {
                const isActive = activeSubCategory === sub.id;
                const isEditing = editingSubCategory === sub.id;
                return (
                    <div
                        key={sub.id}
                        className={cn(
                            "group flex items-center gap-1 rounded-lg transition-all",
                            isActive
                                ? "bg-primary/10"
                                : "hover:bg-muted/60"
                        )}
                    >
                        {isEditing ? (
                            <div className="flex-1 px-2 py-1">
                                <InlineInput
                                    autoFocus
                                    defaultValue={sub.name}
                                    onSubmit={(name) => {
                                        updateSubCategory(sub.id, { name });
                                        setEditingSubCategory(null);
                                    }}
                                    onCancel={() =>
                                        setEditingSubCategory(null)
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveCategory(category.id);
                                        setActiveSubCategory(sub.id);
                                    }}
                                    className={cn(
                                        "flex-1 min-w-0 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                                        isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span className="block truncate">
                                        {sub.name}
                                    </span>
                                </button>

                                <ActionMenu
                                    triggerClassName={cn(
                                        "mr-1 h-7 w-7 shrink-0 rounded-md transition-all",
                                        isActive
                                            ? "opacity-100"
                                            : "opacity-0 group-hover:opacity-100",
                                        "text-muted-foreground hover:bg-background hover:text-foreground"
                                    )}
                                    onRename={() =>
                                        setEditingSubCategory(sub.id)
                                    }
                                    onDelete={() =>
                                        deleteSubCategory(sub.id)
                                    }
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
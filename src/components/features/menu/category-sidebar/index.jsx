"use client";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMenu } from "@/store/hooks/useMenu";
import InlineInput from "@/components/ui/inline-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, FolderKanban, MoreHorizontal, Plus, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CategorySidebar({
    resId,
}) {
    const { menu, activeCategory, activeSubCategory, addCategory, addSubCategory, deleteCategory, deleteSubCategory, setActiveCategory, setActiveSubCategory } = useMenu(resId);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState({});
    const [addingCategory, setAddingCategory] = useState(false);
    const [addingSubCategoryFor, setAddingSubCategoryFor] = useState(null);

    const categories = useMemo(() => {
        return (
            menu?.categoryWrappers?.map((wrapper) => ({
                id:
                    wrapper.category.categoryId ||
                    wrapper.category.tempReferenceId,

                name: wrapper.category.name,
                raw: wrapper,
                subcategories:
                    wrapper.subCategoryWrappers?.map(
                        (subWrapper) => ({
                            id:
                                subWrapper.subCategory
                                    .subCategoryId ||
                                subWrapper.subCategory
                                    .tempReferenceId,

                            name:
                                subWrapper.subCategory.name,

                            raw: subWrapper,
                        })
                    ) || [],
            })) || []
        );
    }, [menu]);

    const filteredCategories = useMemo(() => {
        if (!search.trim()) {
            return categories;
        }

        const query =
            search.toLowerCase();

        return categories
            .map((category) => ({
                ...category,

                subcategories:
                    category.subcategories.filter(
                        (sub) =>
                            sub.name
                                .toLowerCase()
                                .includes(query)
                    ),
            }))
            .filter(
                (category) =>
                    category.name
                        .toLowerCase()
                        .includes(query) ||
                    category.subcategories.length > 0
            );
    }, [categories, search]);

    const toggleExpand = (id) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <aside className="flex h-full w-[340px] flex-col border-r bg-background">
            <div className="border-b px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Menu Structure
                        </h2>

                        <p className="text-xs text-muted-foreground">
                            {categories.length} Categories
                        </p>
                    </div>

                    <Button
                        size="icon"
                        onClick={() =>
                            setAddingCategory(true)
                        }
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="relative mt-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                    <Input
                        value={search}
                        placeholder="Search..."
                        className="pl-9"
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>

                {addingCategory && (
                    <div className="mt-3">
                        <InlineInput
                            placeholder="Category name"
                            onSubmit={(name) => {
                                addCategory(name);
                                setAddingCategory(false);
                            }}
                            onCancel={() =>
                                setAddingCategory(false)
                            }
                        />
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 p-3">
                    {filteredCategories.map(
                        (category) => {
                            const isExpanded =
                                expanded[
                                category.id
                                ] ?? true;

                            const isCategoryActive =
                                activeCategory ===
                                category.id;

                            return (
                                <div
                                    key={category.id}
                                    className="overflow-hidden rounded-xl border bg-card"
                                >
                                    <div
                                        className={cn(
                                            "group flex items-center gap-2 p-3",
                                            isCategoryActive &&
                                            "bg-primary/10"
                                        )}
                                    >
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() =>
                                                toggleExpand(
                                                    category.id
                                                )
                                            }
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <button
                                            className="flex flex-1 items-center gap-3 text-left"
                                            onClick={() =>
                                                setActiveCategory(
                                                    category.id
                                                )
                                            }
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <FolderKanban className="h-4 w-4 text-primary" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {category.name}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        category
                                                            .subcategories
                                                            .length
                                                    }{" "}
                                                    subcategories
                                                </p>
                                            </div>
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                asChild
                                            >
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        deleteCategory(
                                                            category.id
                                                        )
                                                    }
                                                >
                                                    Delete Category
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t px-3 py-2">
                                            <div className="space-y-1">
                                                {category.subcategories.map(
                                                    (sub) => (
                                                        <div
                                                            key={sub.id}
                                                            className="group flex items-center gap-1"
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    setActiveSubCategory(
                                                                        sub.id
                                                                    )
                                                                }
                                                                className={cn(
                                                                    "flex-1 rounded-lg px-3 py-2 text-left text-sm",
                                                                    activeSubCategory ===
                                                                        sub.id
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "hover:bg-muted"
                                                                )}
                                                            >
                                                                {sub.name}
                                                            </button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>

                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() =>
                                                                            deleteSubCategory(
                                                                                sub.id
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {addingSubCategoryFor ===
                                                category.id ? (
                                                <div className="mt-2">
                                                    <InlineInput
                                                        placeholder="Subcategory name"
                                                        onSubmit={(
                                                            name
                                                        ) => {
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
                                                    />
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="mt-2 w-full justify-start"
                                                    onClick={() =>
                                                        setAddingSubCategoryFor(
                                                            category.id
                                                        )
                                                    }
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Subcategory
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
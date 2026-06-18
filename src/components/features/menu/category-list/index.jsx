"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CatalogueCard from "../catalogue-card";

export default function CatalogueList({
    onAddItem,
    resId,
}) {
    return (
        <div className="flex h-full flex-col relative">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-white/60 backdrop-blur-xl px-6 py-3 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Menu Items
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                </div>

                <Button
                    size="sm"
                    onClick={onAddItem}
                    className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 rounded-full px-4 h-8 text-xs"
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Item
                </Button>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
                {items.length === 0 ? (
                    <div className="flex h-full items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4 ring-1 ring-border shadow-sm">
                                <Plus className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                No Items Yet
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground max-w-[200px] mx-auto">
                                Click "Add Item" above to create your first delicious entry.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 max-w-5xl mx-auto pb-20">
                        {items.map((item, index) => (
                            <div
                                key={item.id || item._id}
                                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                style={{ animationDelay: `${Math.min(index * 75, 500)}ms` }}
                            >
                                <CatalogueCard
                                    item={item}
                                    resId={resId}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
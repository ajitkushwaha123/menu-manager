"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CatalogueCard from "../catalogue-card";

export default function CatalogueList({
    items = [], // ✅ safe default
    onSelect,
    onAddItem,
    resId,
}) {
    console.log("items", items);
    return (
        <div className="flex h-full flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h2 className="font-semibold">Menu Items</h2>

                    <p className="text-sm text-muted-foreground">
                        {items.length} items
                    </p>
                </div>

                <Button onClick={onAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-auto p-4">
                {items.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <h3 className="font-medium">
                                No Items Found
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Add your first menu item
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {items.map((item) => (
                            <CatalogueCard
                                key={item.id || item._id}
                                item={item}
                                resId={resId} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
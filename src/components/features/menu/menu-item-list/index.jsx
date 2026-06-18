"use client";

import { useDispatch } from "react-redux";
import { openImageSidebar } from "@/store/slices/menuSlice";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import MenuItemRow from "@/components/features/menu/menu-item-card";

export default function MenuItemList({
  activeSubCategoryData,
  addItem,
  updateCatalogue,
  deleteItem,
}) {
  const dispatch = useDispatch();

  const handleAddItem = () => {
    if (!activeSubCategoryData?.id) return;
    addItem({
      subCategoryId: activeSubCategoryData.id,
      item: {
        name: "New Item",
        price: 0,
        description: "",
        is_veg: "VEG",
        is_available: true,
        variants: []
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-xl border-x">
      {activeSubCategoryData && (
        <div className="p-4 border-b bg-white/50 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeSubCategoryData.name || "Items"}
          </h2>
          <Button onClick={handleAddItem} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <UtensilsCrossed size={16} />
            Add Item
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {!activeSubCategoryData ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select a subcategory to view items
          </div>
        ) : activeSubCategoryData.items?.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No items in this subcategory. Click "Add Item" to create one.
          </div>
        ) : (
          activeSubCategoryData.items?.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              onChange={(updatedItem) => updateCatalogue({ catalogueId: item.id, updates: updatedItem })}
              onDelete={() => deleteItem({ itemId: item.id })}
              onImageChange={() => dispatch(openImageSidebar(item))}
            />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";
import { openImageSidebar, setCopiedItem } from "@/store/slices/menuSlice";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import MenuItemRow from "@/components/features/menu/menu-item-card";

export default function MenuItemList({
  activeSubCategoryData,
  addItem,
  updateCatalogue,
  deleteItem,
}) {
  const dispatch = useDispatch();
  const reduxCopiedItem = useSelector((state) => state.menu.copiedItem);
  const [localCopiedItem, setLocalCopiedItem] = useState(null);

  useEffect(() => {
    const syncClipboard = () => {
      try {
        const stored = localStorage.getItem("magicscale_clipboard");
        if (stored) {
          setLocalCopiedItem(JSON.parse(stored));
        }
      } catch (e) {}
    };

    // Load initially and when redux state changes
    syncClipboard();

    // Listen for changes from other tabs and from within the same tab
    window.addEventListener("storage", syncClipboard);
    window.addEventListener("magicscale_clipboard_changed", syncClipboard);
    return () => {
      window.removeEventListener("storage", syncClipboard);
      window.removeEventListener("magicscale_clipboard_changed", syncClipboard);
    };
  }, [reduxCopiedItem]);

  const copiedItem = reduxCopiedItem || localCopiedItem;

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

  const handlePasteItem = useCallback(() => {
    let itemToPaste = copiedItem;
    // Just-in-time read for maximum cross-tab reliability
    try {
      const stored = localStorage.getItem("magicscale_clipboard");
      if (stored) {
        itemToPaste = JSON.parse(stored);
      }
    } catch (e) {}

    if (!activeSubCategoryData?.id || !itemToPaste) return;
    
    addItem({
      subCategoryId: activeSubCategoryData.id,
      item: {
        ...itemToPaste,
        name: `${itemToPaste.name} (Copy)`
      }
    });
    toast.success("Item pasted!");
  }, [activeSubCategoryData?.id, copiedItem, addItem]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'b')) {
        if (copiedItem && activeSubCategoryData?.id) {
          e.preventDefault();
          handlePasteItem();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [copiedItem, activeSubCategoryData?.id, handlePasteItem]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-xl border-x">
      {activeSubCategoryData && (
        <div className="p-4 border-b bg-white/50 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeSubCategoryData.name || "Items"}
          </h2>
          <div className="flex items-center gap-2">
            {copiedItem && (
              <Button onClick={handlePasteItem} variant="outline" className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200">
                <ClipboardPaste size={16} />
                Paste Item
              </Button>
            )}
            <Button onClick={handleAddItem} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <UtensilsCrossed size={16} />
              Add Item
            </Button>
          </div>
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
          [...activeSubCategoryData.items]
            .sort((a, b) => a.name?.localeCompare(b.name || ""))
            .map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              onChange={(updatedItem) => updateCatalogue({ catalogueId: item.id, updates: updatedItem })}
              onDelete={() => deleteItem({ itemId: item.id })}
              onImageChange={() => dispatch(openImageSidebar(item))}
              onCopy={(item) => {
                dispatch(setCopiedItem(item));
                try {
                  localStorage.setItem("magicscale_clipboard", JSON.stringify(item));
                  window.dispatchEvent(new Event("magicscale_clipboard_changed"));
                } catch (e) {}
                toast.success("Item copied to clipboard!");
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

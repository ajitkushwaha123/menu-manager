"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { useMenu } from "@/store/hooks/useMenu";
import { openImageSidebar } from "@/store/slices/menuSlice";
import ImageSidebar from "@/components/features/menu/image-sidebar";
import CategorySidebar from "@/components/features/menu/sidebar/CategorySidebar";
import Loading from "@/components/global/general/states/Loading";
import Error from "@/components/global/general/states/Error";
import MenuItemList from "@/components/features/menu/menu-item-list";
import SwiggyTicketsViewer from "@/components/features/menu/tickets/SwiggyTicketsViewer";

export default function Page() {
  const { resId } = useParams();
  const dispatch = useDispatch();
  const [activeView, setActiveView] = useState("MENU"); // "MENU" | "TICKETS"

  const {
    fetchMenu,
    loading,
    error,
    activeSubCategoryData,
    updateCatalogue,
    deleteItem,
    addItem,
  } = useMenu(resId);

  useEffect(() => {
    if (resId) {
      fetchMenu();
    }
  }, [resId, fetchMenu]);

  if (loading) {
    return (
      <Loading message="" />
    );
  }

  if (error) {
    return (
      <Error error={error} retry={fetchMenu} />
    );
  }
  return (
    <div className="flex h-screen bg-slate-50/50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      <div className="relative z-10 flex h-full w-full">
        <CategorySidebar
          resId={resId}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {activeView === "TICKETS" ? (
          <SwiggyTicketsViewer resId={resId} />
        ) : (
          <MenuItemList
            activeSubCategoryData={activeSubCategoryData}
            addItem={addItem}
            updateCatalogue={updateCatalogue}
            deleteItem={deleteItem}
          />
        )}

        <ImageSidebar resId={resId} />
      </div>
    </div>
  );
}


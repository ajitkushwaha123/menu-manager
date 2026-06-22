"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Provider } from "react-redux";
import { createMenuStore } from "@/store";
import { useMenu } from "@/store/hooks/useMenu";
import CategorySidebar from "@/components/features/menu/sidebar/CategorySidebar";
import MenuItemList from "@/components/features/menu/menu-item-list";
import ImageSidebar from "@/components/features/menu/image-sidebar";
import Loading from "@/components/global/general/states/Loading";
import Error from "@/components/global/general/states/Error";
import { Copy, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AiDescriptionButton from "@/components/features/menu/ai-description-button";
import AiPriceAdjustButton from "@/components/features/menu/ai-price-adjust-button";
import MenuImportButtons from "@/components/features/menu/menu-import-buttons";
import MenuSaveButton from "@/components/features/menu/menu-save-button";
function MenuContent({ resId, platform }) {
  const {
    fetchMenu,
    loading,
    error,
    activeSubCategoryData,
    updateCatalogue,
    deleteItem,
    addItem,
  } = useMenu(resId, platform);

  useEffect(() => {
    if (resId && platform) {
      fetchMenu();
    }
  }, [resId, platform, fetchMenu]);

  if (loading) {
    return <Loading message={`Loading ${platform} menu...`} />;
  }

  if (error) {
    return <Error error={error} retry={fetchMenu} />;
  }

  return (
    <div className="flex h-full w-full relative">
      <CategorySidebar resId={resId} platform={platform} />
      <MenuItemList
        activeSubCategoryData={activeSubCategoryData}
        addItem={addItem}
        updateCatalogue={updateCatalogue}
        deleteItem={deleteItem}
      />
      <ImageSidebar resId={resId} />
    </div>
  );
}

function MenuSide({ resId, platform, onResIdChange, onPlatformChange, sideLabel }) {
  // Create an independent Redux store for this side
  const store = useMemo(() => createMenuStore(), []);

  return (
    <Provider store={store}>
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center gap-2 p-2 border-b bg-slate-100 shrink-0">
        <span className="font-semibold text-sm w-12">{sideLabel}</span>
        <Input
          placeholder="Restaurant ID"
          value={resId || ""}
          onChange={(e) => onResIdChange(e.target.value)}
          className="h-8 text-sm w-32"
        />
        <Select value={platform || "swiggy"} onValueChange={onPlatformChange}>
          <SelectTrigger className="h-8 text-sm w-28 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="swiggy">Swiggy</SelectItem>
            <SelectItem value="zomato">Zomato</SelectItem>
          </SelectContent>
        </Select>
        {resId && platform && (
          <div className="flex items-center gap-2 ml-auto">
            <MenuImportButtons key={`import-${resId}-${platform}`} resId={resId} currentPlatform={platform} />
            <AiDescriptionButton key={`ai-desc-${resId}-${platform}`} explicitResId={resId} explicitPlatform={platform} />
            <AiPriceAdjustButton key={`ai-price-${resId}-${platform}`} explicitResId={resId} explicitPlatform={platform} />
            <MenuSaveButton key={`save-${resId}-${platform}`} resId={resId} currentPlatform={platform} />
          </div>
        )}
      </div>

        {!resId || !platform ? (
          <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4 bg-slate-50/50">
            <PlusCircle className="h-12 w-12 text-slate-300" />
            <p>Enter a Restaurant ID above</p>
          </div>
        ) : (
          <MenuContent resId={resId} platform={platform} />
        )}
      </div>
    </Provider>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const resId1 = searchParams?.get("resId1") || "";
  const platform1 = searchParams?.get("platform1") || "swiggy";

  const resId2 = searchParams?.get("resId2") || "";
  const platform2 = searchParams?.get("platform2") || "zomato";

  const updateUrl = (r1, p1, r2, p2) => {
    const params = new URLSearchParams();
    if (r1) params.set("resId1", r1);
    params.set("platform1", p1);
    if (r2) params.set("resId2", r2);
    params.set("platform2", p2);
    router.replace(`/menu/compare?${params.toString()}`);
  };

  const [formResId1, setFormResId1] = useState(resId1 || "");
  const [formPlatform1, setFormPlatform1] = useState(platform1 || "swiggy");
  const [formResId2, setFormResId2] = useState(resId2 || "");
  const [formPlatform2, setFormPlatform2] = useState(platform2 || "zomato");

  if (!resId1 && !resId2) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50/50">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-border/50 p-8">
          <div className="flex flex-col items-center mb-8">
            <Copy className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold">Outlet Compare Setup</h2>
            <p className="text-muted-foreground text-center mt-2">
              Select two outlets to compare their menus side-by-side.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Left Outlet</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Restaurant ID</label>
                <Input placeholder="e.g. 1312345" value={formResId1} onChange={(e) => setFormResId1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={formPlatform1} onValueChange={setFormPlatform1}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swiggy">Swiggy</SelectItem>
                    <SelectItem value="zomato">Zomato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Right Outlet</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Restaurant ID</label>
                <Input placeholder="e.g. 234567" value={formResId2} onChange={(e) => setFormResId2(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={formPlatform2} onValueChange={setFormPlatform2}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swiggy">Swiggy</SelectItem>
                    <SelectItem value="zomato">Zomato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="w-full max-w-sm"
              onClick={() => updateUrl(formResId1, formPlatform1, formResId2, formPlatform2)}
              disabled={!formResId1 && !formResId2}
            >
              Start Comparison
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-slate-50/50 relative overflow-scroll">
      <div className="w-1/2 border-r overflow-scroll border-gray-300 relative bg-white shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
        <MenuSide
          resId={resId1}
          platform={platform1}
          sideLabel="Left"
          onResIdChange={(val) => updateUrl(val, platform1, resId2, platform2)}
          onPlatformChange={(val) => updateUrl(resId1, val, resId2, platform2)}
        />
      </div>
      <div className="w-1/2 overflow-scroll relative bg-white">
        <MenuSide
          resId={resId2}
          platform={platform2}
          sideLabel="Right"
          onResIdChange={(val) => updateUrl(resId1, platform1, val, platform2)}
          onPlatformChange={(val) => updateUrl(resId1, platform1, resId2, val)}
        />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-slate-50/50">
        <Loading message="Loading Compare View..." />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}

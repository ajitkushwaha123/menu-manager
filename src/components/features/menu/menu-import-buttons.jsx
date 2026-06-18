"use client";

import { Button } from "@/components/ui/button";
import { DownloadCloud, Loader2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { fetchMenu } from "@/store/slices/menuSlice";

export default function MenuImportButtons({ resId, currentPlatform }) {
  const [loading, setLoading] = useState(null);
  const dispatch = useDispatch();

  if (!resId) return null;

  const handleImport = async (platform) => {
    setLoading(platform);
    try {
      const { data } = await axios.get(`/api/menu/${resId}/${platform}/import`);
      if (data.success) {
        toast.success(`Menu imported from ${platform} successfully!`);

        if (platform === currentPlatform) {
          dispatch(fetchMenu({ resId, platform }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to import from ${platform}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2 mr-2">
      {(currentPlatform === 'swiggy' || currentPlatform === 'auto') && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleImport('swiggy')}
          className="gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
        >
          {loading === 'swiggy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          Import Swiggy
        </Button>
      )}
      {(currentPlatform === 'zomato' || currentPlatform === 'auto') && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleImport('zomato')}
          className="gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
        >
          {loading === 'zomato' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          Import Zomato
        </Button>
      )}
    </div>
  );
}

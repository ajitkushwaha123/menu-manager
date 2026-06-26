"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BrainCircuit, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { fetchMenu, queueSpecificItems } from "@/store/slices/menuSlice";
import { useSearchParams, usePathname } from "next/navigation";

export default function AiModifyPriceButton({ explicitResId, explicitPlatform }) {
  const params = useParams();
  const resId = explicitResId || params.resId;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const platform = explicitPlatform || searchParams?.get("platform") || (pathname?.includes("/zomato") ? "zomato" : "swiggy");
  
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  if (!resId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a reference file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(`/api/menu/${resId}/ai/price/modify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        if (data.updated_items === 0) {
          toast.info("No prices were modified by the AI.");
        } else {
          toast.success(`Updated ${data.updated_items} item prices.`);
          // Refetch menu so state has the new prices, then explicitly queue only the updated items
          await dispatch(fetchMenu({ resId, platform })).unwrap();
          
          if (data.updated_items_data && data.updated_items_data.length > 0) {
            dispatch(queueSpecificItems(data.updated_items_data));
            toast.success(`Queued ${data.updated_items} items for Swiggy price sync.`, { id: "price-queue" });
          }
        }
        setOpen(false);
        setFile(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process prices");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200">
          <BrainCircuit className="h-4 w-4" />
          AI Modify Price
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>AI Modify Prices</DialogTitle>
            <DialogDescription>
              Upload a reference file (PDF or Image) containing your new prices. Our AI will automatically find and update the matching items in your menu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referenceFile" className="text-right">
                File
              </Label>
              <Input
                id="referenceFile"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="col-span-3"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Processing with AI..." : "Process"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

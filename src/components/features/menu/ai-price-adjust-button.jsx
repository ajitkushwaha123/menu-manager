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
import { Wand2, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { fetchMenu, queuePriceUpdates } from "@/store/slices/menuSlice";
import { useSearchParams, usePathname } from "next/navigation";

export default function AiPriceAdjustButton({ explicitResId, explicitPlatform }) {
  const params = useParams();
  const resId = explicitResId || params.resId;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const platform = explicitPlatform || searchParams?.get("platform") || (pathname?.includes("/zomato") ? "zomato" : "swiggy");
  
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  if (!resId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`/api/menu/${resId}/ai/price`, {
        value: value.trim(),
      });

      if (data.success) {
        toast.success(`Updated ${data.updated_items} item prices.`);
        setOpen(false);
        setValue("");

        // Refetch menu so state has the new prices, then queue all synced items for Swiggy update
        await dispatch(fetchMenu({ resId, platform })).unwrap();
        dispatch(queuePriceUpdates());
        toast.success(`Queued ${data.updated_items} items for Swiggy price sync.`, { id: "price-queue" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to adjust prices");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200">
          <Wand2 className="h-4 w-4" />
          Adjust Prices
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>AI Price Adjustment</DialogTitle>
            <DialogDescription>
              Adjust all menu item prices by a percentage or absolute value.
              <br />
              <span className="font-semibold text-muted-foreground">Examples:</span> 10%, -10%, 20, -20
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustmentValue" className="text-right">
                Value
              </Label>
              <Input
                id="adjustmentValue"
                placeholder="e.g. 10%"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="col-span-3"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !value.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

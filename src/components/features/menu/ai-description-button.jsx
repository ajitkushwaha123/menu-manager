"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { fetchMenu } from "@/store/slices/menuSlice";
import { useSearchParams, usePathname } from "next/navigation";

export default function AiDescriptionButton({ explicitResId, explicitPlatform }) {
  const params = useParams();
  const resId = explicitResId || params.resId;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const platform = explicitPlatform || searchParams?.get("platform") || (pathname?.includes("/zomato") ? "zomato" : "swiggy");
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  if (!resId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const { data } = await axios.post(`/api/menu/${resId}/ai/description`);

      if (data.success) {
        toast.success(`Successfully generated descriptions for ${data.updated_items} items.`);
        setOpen(false);
        // Refetch menu to reflect updated descriptions
        dispatch(fetchMenu({ resId, platform }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate descriptions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200">
          <Sparkles className="h-4 w-4" />
          AI Descriptions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate AI Descriptions</DialogTitle>
            <DialogDescription>
              This will automatically generate AI descriptions for all menu items that don't have one or need improvement.
              This process might take a few moments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

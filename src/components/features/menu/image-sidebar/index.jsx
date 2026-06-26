"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useSearchParams } from "next/navigation";
import { X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  closeImageSidebar,
  addImage,
  setTicketImage,
} from "@/store/slices/menuSlice";
import { toast } from "sonner";
import axios from "axios";

export default function ImageSidebar({ resId }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isImageSidebarOpen, activeImageSearchItem } = useSelector(
    (state) => state.menu,
  );

  // Detect platform from URL path or search params
  const platform =
    searchParams?.get("platform") ||
    (pathname?.includes("/zomato") ? "zomato" : "swiggy");

  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync search query when sidebar opens with an item
  useEffect(() => {
    if (isImageSidebarOpen && activeImageSearchItem?.name) {
      setSearchQuery(activeImageSearchItem.name);
      fetchImages(activeImageSearchItem.name, 1);
    }
  }, [isImageSidebarOpen, activeImageSearchItem]);

  const fetchImages = async (query, pageNum = 1) => {
    if (!query.trim()) {
      setImages([]);
      setHasMore(false);
      return;
    }

    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const res = await axios.get(
        `/api/images/search?q=${encodeURIComponent(query)}&page=${pageNum}&limit=12&platform=${platform}`,
      );

      if (res.data.success) {
        if (pageNum === 1) {
          setImages(res.data.data);
        } else {
          setImages((prev) => {
            // Filter out duplicates just in case
            const existingIds = new Set(prev.map((img) => img._id));
            const newImages = res.data.data.filter(
              (img) => !existingIds.has(img._id),
            );
            return [...prev, ...newImages];
          });
        }
        setHasMore(res.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to search images:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Debounce simple version:
    if (query.trim().length > 2) {
      fetchImages(query, 1);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop <= clientHeight * 1.5 &&
      hasMore &&
      !loading &&
      !isLoadingMore
    ) {
      fetchImages(searchQuery, page + 1);
    }
  };

  const handleSelectImage = async (imageDoc) => {
    if (!activeImageSearchItem || !imageDoc.image_url) return;

    try {
      if (activeImageSearchItem.isTicket) {
        dispatch(
          setTicketImage({
            ticketId: activeImageSearchItem.ticketId,
            url: imageDoc.image_url,
          }),
        );
      } else {
        // Update Redux state immediately with the image URL
        dispatch(
          addImage({
            itemId: activeImageSearchItem.id,
            media: {
              url: imageDoc.image_url,
            },
          }),
        );
      }

      toast.success("Image applied successfully");

      // Close sidebar
      dispatch(closeImageSidebar());
    } catch (error) {
      console.error("Failed to apply selected image:", error);
      toast.error("Failed to apply image. Please try again.");
    }
  };

  if (!isImageSidebarOpen) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-[380px] bg-white/80 backdrop-blur-2xl shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.1)] border-l z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
      <div className="flex items-center justify-between p-5 border-b border-border/50 bg-white/50">
        <div>
          <h3 className="font-bold text-lg tracking-tight">
            Image Suggestions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            For{" "}
            <span className="font-semibold text-primary">
              {activeImageSearchItem?.name}
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(closeImageSidebar())}
          className="rounded-full hover:bg-black/5"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 border-b border-border/50 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search dataset..."
            className="pl-9 bg-white border-border/50 rounded-xl"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground">
              Searching dataset...
            </p>
          </div>
        ) : images.length > 0 ? (
          <div className="pb-6">
            <div className="grid grid-cols-2 gap-3">
              {images.map((img) => (
                <div
                  key={img._id}
                  onClick={() => handleSelectImage(img)}
                  className={cn(
                    "group relative rounded-xl overflow-hidden border border-border/50 cursor-pointer bg-white transition-all hover:border-primary/40 hover:shadow-md",
                    uploadingId === img._id &&
                      "opacity-70 pointer-events-none ring-2 ring-primary",
                  )}
                >
                  <div className="aspect-square w-full bg-slate-100 relative">
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {uploadingId === img._id && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate text-foreground">
                      {img.title}
                    </p>
                    {img.category && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {img.category}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isLoadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No matches found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try modifying your search query above.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

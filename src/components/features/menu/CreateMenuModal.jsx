"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateMenuModal({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [resId, setResId] = useState("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resId.trim() || !platform) return;

    try {
      setLoading(true);
      const { data } = await axios.post("/api/menu", {
        resId,
        platform,
        name,
      });

      if (data.success) {
        toast.success("Menu created successfully!");
        setOpen(false);
        setResId("");
        setName("");
        setPlatform("");
        if (onCreated) {
          onCreated(data.data);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create menu"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Menu</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Menu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resId">Restaurant ID (Required)</Label>
            <Input
              id="resId"
              placeholder="e.g. 182390"
              value={resId}
              onChange={(e) => setResId(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name (Optional)</Label>
            <Input
              id="name"
              placeholder="e.g. Magic Scale Cafe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform (Required)</Label>
            <Select value={platform} onValueChange={setPlatform} disabled={loading} required>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swiggy">Swiggy</SelectItem>
                <SelectItem value="zomato">Zomato</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !resId.trim() || !platform}>
              {loading ? "Creating..." : "Save Menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

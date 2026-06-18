"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import Link from "next/link";
import { CreateMenuModal } from "@/components/features/menu/CreateMenuModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Map, Store, Calendar, ArrowRight } from "lucide-react";

export default function MenusPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMenus = async () => {
    try {
      const { data } = await axios.get("/api/menu");
      if (data.success) {
        setMenus(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleMenuCreated = (newMenu) => {
    setMenus((prev) => [newMenu, ...prev]);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menus</h2>
          <p className="text-muted-foreground">
            Manage all your menus across platforms.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateMenuModal onCreated={handleMenuCreated} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <Map className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No menus found
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Click the button above to create your first menu.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.map((menuItem) => (
            <Link
              key={menuItem._id}
              href={`/menu/${menuItem.resId}?platform=${menuItem.platform || 'swiggy'}`}
              className="transition-all hover:scale-[1.02]"
            >
              <Card className="hover:border-primary cursor-pointer h-full bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg uppercase text-sm">
                      {menuItem.platform}
                    </div>
                    {menuItem.name || `Restaurant ${menuItem.resId}`}
                  </CardTitle>
                  <CardDescription>Res ID: {menuItem.resId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(menuItem.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      Manage <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

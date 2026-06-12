"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Plus,
  FolderOpen,
  Trash,
  Loader2,
  Folder,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 animate-pulse">
      <Skeleton className="h-6 w-6 rounded-md" />
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-2 w-16 rounded" />
      </div>
    </div>
  );
}

function renderLogo(project) {
  if (project?.icon) {
    const Icon = project.icon;
    return <Icon className="size-3.5 shrink-0" />;
  }
  return <Folder className="size-3.5 shrink-0 text-muted-foreground" />;
}

export function ProjectSwitcher() {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {renderLogo("MAGICSCALE MANAGER")}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-medium max-w-[120px]">
                  MENU MANAGER
                </span>
                <span className="truncate text-xs text-muted-foreground max-w-[140px]">
                  {"Project Workspace"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-50 shrink-0" />
            </>
          </SidebarMenuButton>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

"use client";

import React from "react";
import { Provider } from "react-redux";
import { ClerkProvider } from "@clerk/nextjs";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { store } from "@/store";
import { SiteHeader } from "@/components/site-header";

const AppShell = ({ children }) => {
  return (
    <ClerkProvider>
      <Provider store={store}>
        <SidebarProvider
          style={{
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          }}
        >
          <div className="flex min-h-screen w-full">
            <AppSidebar variant="inset" />

            <SidebarInset className="flex flex-1 flex-col min-w-0">
              <React.Suspense fallback={null}>
                <SiteHeader />
              </React.Suspense>
              <main className="flex-1 min-w-0">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </Provider>
    </ClerkProvider>
  );
};

export default AppShell;

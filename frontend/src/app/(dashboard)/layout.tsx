"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg text-text-main flex flex-col">
      {/* Top Header Frame */}
      <TopHeader
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onOpenSearch={() => {
          // Future: open search modal
        }}
        onOpenUpload={() => {
          // Future: open upload modal
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 pt-16">
        {/* Left Sidebar Frame */}
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 md:pl-64 min-h-[calc(100vh-4rem)] bg-app-bg pb-28 md:pb-12">
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenSearch={() => {
          // Future: open search modal
        }}
        onOpenUpload={() => {
          // Future: open upload modal
        }}
      />
    </div>
  );
}

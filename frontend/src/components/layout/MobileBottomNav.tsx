"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationTab } from "@/types/navigation.types";
import { TAB_TO_PATH, PATH_TO_TAB } from "@/lib/routes";
import {
  MdOutlineHome,
  MdHome,
  MdOutlineFolder,
  MdFolder,
  MdAdd,
  MdSearch,
  MdOutlinePerson,
  MdPerson,
} from "react-icons/md";

interface MobileBottomNavProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenSearch?: () => void;
  onOpenUpload?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenUpload,
}) => {
  const pathname = usePathname();
  const activeTab = currentTab || PATH_TO_TAB[pathname] || "home";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border-subtle z-40 px-2 flex items-center justify-around shadow-lg select-none">
      {/* Home */}
      <Link
        href={TAB_TO_PATH["home"]}
        onClick={() => onNavigate?.("home")}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
          activeTab === "home"
            ? "text-primary font-semibold"
            : "text-text-muted hover:text-text-main"
        }`}
      >
        {activeTab === "home" ? (
          <MdHome className="text-2xl" />
        ) : (
          <MdOutlineHome className="text-2xl" />
        )}
        <span className="text-[10px] mt-0.5">Home</span>
      </Link>

      {/* Files */}
      <Link
        href={TAB_TO_PATH["all-files"]}
        onClick={() => onNavigate?.("all-files")}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
          activeTab === "all-files"
            ? "text-primary font-semibold"
            : "text-text-muted hover:text-text-main"
        }`}
      >
        {activeTab === "all-files" ? (
          <MdFolder className="text-2xl" />
        ) : (
          <MdOutlineFolder className="text-2xl" />
        )}
        <span className="text-[10px] mt-0.5">Files</span>
      </Link>

      {/* Center Action: Upload Button */}
      <button
        type="button"
        onClick={onOpenUpload}
        className="flex flex-col items-center justify-center -mt-5 cursor-pointer"
        aria-label="Upload files"
      >
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-primary/90">
          <MdAdd className="text-2xl" />
        </div>
        <span className="text-[10px] text-text-muted font-medium mt-1">
          Upload
        </span>
      </button>

      {/* Search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
      >
        <MdSearch className="text-2xl" />
        <span className="text-[10px] mt-0.5">Search</span>
      </button>

      {/* Accounts / Profile */}
      <Link
        href={TAB_TO_PATH["settings-profile"]}
        onClick={() => onNavigate?.("settings-profile")}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
          ["settings-profile", "connected-accounts", "storage"].includes(
            activeTab,
          )
            ? "text-primary font-semibold"
            : "text-text-muted hover:text-text-main"
        }`}
      >
        {["settings-profile", "connected-accounts", "storage"].includes(
          activeTab,
        ) ? (
          <MdPerson className="text-2xl" />
        ) : (
          <MdOutlinePerson className="text-2xl" />
        )}
        <span className="text-[10px] mt-0.5">Profile</span>
      </Link>
    </div>
  );
};

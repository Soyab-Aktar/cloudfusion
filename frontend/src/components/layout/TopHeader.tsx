"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationTab } from "@/types/navigation.types";
import { TAB_TO_PATH, PATH_TO_TAB } from "@/lib/routes";
import { useAuthContext } from "@/store/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MdMenu,
  MdOutlineCloudSync,
  MdSearch,
  MdAdd,
  MdExpandMore,
  MdManageAccounts,
  MdOutlineCloud,
  MdPublic,
  MdLogout,
} from "react-icons/md";
import Image from "next/image";

interface TopHeaderProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenSearch?: () => void;
  onOpenUpload?: () => void;
  onToggleMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenUpload,
  onToggleMobileMenu,
}) => {
  const pathname = usePathname();
  const activeTab = currentTab || PATH_TO_TAB[pathname] || "home";
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuthContext();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border-subtle z-40 flex items-center justify-between px-3 sm:px-6 md:px-8">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-1 rounded-lg text-text-muted hover:text-text-main hover:bg-app-bg transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <MdMenu className="text-2xl" />
        </button>

        <Link
          href={TAB_TO_PATH["home"]}
          onClick={() => onNavigate?.("home")}
          className="flex items-center gap-2 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-xs group-hover:bg-primary-hover transition-colors shrink-0">
            <MdOutlineCloudSync className="text-xl sm:text-2xl" />
          </div>
          <span className="font-semibold text-base sm:text-lg tracking-tight text-text-main group-hover:text-primary transition-colors hidden xs:inline sm:inline">
            CloudFusion
          </span>
        </Link>
      </div>

      {/* Global Search Bar (Center / Fluid) */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-6 min-w-0">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenSearch}
          className="w-full h-9 sm:h-11 px-3 sm:pl-4 sm:pr-4 bg-app-bg hover:bg-surface border border-border-subtle hover:border-slate-300 rounded-lg text-xs sm:text-sm font-normal text-left flex items-center justify-between text-text-muted transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 truncate">
            <MdSearch className="text-lg sm:text-xl text-text-muted group-hover:text-primary transition-colors shrink-0" />
            <span className="truncate">Search files...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-surface border border-border-subtle text-[11px] font-mono text-text-muted shadow-xs shrink-0">
            <span>⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Primary Actions & Profile (Right) */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <Button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          title="Upload file"
        >
          <MdAdd className="text-lg" />
          <span className="hidden sm:inline">Upload</span>
        </Button>

        {/* User Profile Pill & Dropdown */}
        <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
          <DropdownMenuTrigger
            className="flex items-center gap-1 p-1 rounded-full hover:bg-app-bg border border-transparent hover:border-border-subtle transition-colors focus:outline-none cursor-pointer"
            aria-label="User profile options"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                className="w-8 h-8 rounded-full object-cover border border-border-subtle"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs border border-border-subtle">
                {userInitial}
              </div>
            )}
            <MdExpandMore className="text-text-muted text-base hidden sm:inline" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 max-w-[calc(100vw-1.5rem)] bg-surface rounded-2xl border-border-subtle shadow-2xl p-2 z-50 flex flex-col gap-1"
          >
            {/* Profile Card Header */}
            <div className="p-2.5 rounded-xl bg-app-bg flex items-center gap-3">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm border border-border-subtle shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-text-main truncate">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-text-muted truncate">
                  {user?.email || ""}
                </span>
                <span className="text-[11px] font-medium text-primary mt-0.5">
                  {user?.role || "Standard Plan"}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator className="my-1 bg-border-subtle" />

            {/* Navigation Options */}
            <DropdownMenuItem className="p-0 cursor-pointer">
              <Link
                href={TAB_TO_PATH["settings-profile"]}
                onClick={() => onNavigate?.("settings-profile")}
                className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === "settings-profile"
                    ? "bg-primary-subtle text-primary font-semibold"
                    : "text-text-main hover:bg-app-bg"
                }`}
              >
                <MdManageAccounts className="text-lg text-text-muted" />
                <span>My Profile & Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="p-0 cursor-pointer">
              <Link
                href={TAB_TO_PATH["connected-accounts"]}
                onClick={() => onNavigate?.("connected-accounts")}
                className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === "connected-accounts"
                    ? "bg-primary-subtle text-primary font-semibold"
                    : "text-text-main hover:bg-app-bg"
                }`}
              >
                <MdOutlineCloudSync className="text-lg text-text-muted" />
                <span>Connected Clouds</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="p-0 cursor-pointer">
              <Link
                href={TAB_TO_PATH["storage"]}
                onClick={() => onNavigate?.("storage")}
                className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === "storage"
                    ? "bg-primary-subtle text-primary font-semibold"
                    : "text-text-main hover:bg-app-bg"
                }`}
              >
                <MdOutlineCloud className="text-lg text-text-muted" />
                <span>Storage Overview</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="p-0 cursor-pointer">
              <Link
                href={TAB_TO_PATH["landing"]}
                onClick={() => onNavigate?.("landing")}
                className="w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center gap-2.5 text-text-main hover:bg-app-bg transition-colors cursor-pointer"
              >
                <MdPublic className="text-lg text-text-muted" />
                <span>Public Landing Page</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border-subtle" />

            {/* Real Logout */}
            <DropdownMenuItem
              onClick={() => logout()}
              className="w-full text-left px-3 py-2 text-xs sm:text-sm text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
            >
              <MdLogout className="text-lg" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

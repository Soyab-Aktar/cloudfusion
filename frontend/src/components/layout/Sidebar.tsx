"use client";
import { PATH_TO_TAB, TAB_TO_PATH } from "@/lib/routes";
import { NavigationTab } from "@/types/navigation.types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";
import {
  MdClose,
  MdOutlineCloud,
  MdOutlineCloudSync,
  MdOutlineDelete,
  MdOutlineFolder,
  MdOutlineGroup,
  MdOutlineHome,
  MdOutlineSchedule,
  MdOutlineSettings,
  MdOutlineStar,
  MdStar,
} from "react-icons/md";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

interface SidebarProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  storageUsedGB?: number;
  storageTotalGB?: number;
}

const Sidebar: FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  mobileMenuOpen,
  onCloseMobileMenu,
  storageUsedGB = 42,
  storageTotalGB = 100,
}) => {
  const pathname = usePathname();
  const activeTab = currentTab || PATH_TO_TAB[pathname] || "home";
  const percentage = Math.round((storageUsedGB / storageTotalGB) * 100);

  const navItems = [
    { id: "home" as NavigationTab, label: "Home", icon: MdOutlineHome },
    {
      id: "all-files" as NavigationTab,
      label: "All Files",
      icon: MdOutlineFolder,
    },
    { id: "recent" as NavigationTab, label: "Recent", icon: MdOutlineSchedule },
    {
      id: "starred" as NavigationTab,
      label: "Starred",
      icon: MdOutlineStar,
      activeIcon: MdStar,
    },
    { id: "shared" as NavigationTab, label: "Shared", icon: MdOutlineGroup },
    { id: "trash" as NavigationTab, label: "Trash", icon: MdOutlineDelete },
  ];
  const secondaryNavItems = [
    {
      id: "connected-accounts" as NavigationTab,
      label: "Connected Accounts",
      icon: MdOutlineCloudSync,
      badge: "3",
    },
    { id: "storage" as NavigationTab, label: "Storage", icon: MdOutlineCloud },
  ];
  const tertiaryNavItems = [
    {
      id: "settings-profile" as NavigationTab,
      label: "Settings / Profile",
      icon: MdOutlineSettings,
    },
  ];

  const renderNavContent = () => (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="flex flex-col gap-6">
        {/* Main Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon =
              isActive && item.activeIcon ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.id}
                href={TAB_TO_PATH[item.id]}
                onClick={() => {
                  onNavigate?.(item.id);
                  onCloseMobileMenu();
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                  isActive
                    ? "bg-primary-subtle text-primary font-semibold"
                    : "text-text-muted hover:text-text-main hover:bg-app-bg"
                }`}
              >
                <Icon
                  className={`text-xl ${isActive ? "text-primary" : "text-text-muted"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="h-px bg-border-subtle my-2" />
          {/* Connected Services */}
          {secondaryNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={TAB_TO_PATH[item.id]}
                onClick={() => {
                  onNavigate?.(item.id);
                  onCloseMobileMenu();
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                  isActive
                    ? "bg-primary-subtle text-primary font-semibold"
                    : "text-text-muted hover:text-text-main hover:bg-app-bg"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`text-xl ${isActive ? "text-primary" : "text-text-muted"}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          <div className="h-px bg-border-subtle my-2" />
          {/* Tertiary / Settings */}
          {tertiaryNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={TAB_TO_PATH[item.id]}
                onClick={() => {
                  onNavigate?.(item.id);
                  onCloseMobileMenu();
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                  isActive
                    ? "bg-primary-subtle text-primary font-semibold"
                    : "text-text-muted hover:text-text-main hover:bg-app-bg"
                }`}
              >
                <Icon
                  className={`text-xl ${isActive ? "text-primary" : "text-text-muted"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Storage Progress Widget */}
      <Link
        href={TAB_TO_PATH["storage"]}
        onClick={() => {
          onNavigate?.("storage");
          onCloseMobileMenu();
        }}
        className="p-3.5 rounded-xl bg-app-bg border border-border-subtle flex flex-col gap-2 cursor-pointer hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between text-xs text-text-muted font-medium">
          <span className="flex items-center gap-1.5">
            <MdOutlineCloud className="text-base text-primary" />
            <span>Storage</span>
          </span>
          <span className="font-semibold text-text-main">{percentage}%</span>
        </div>
        <Progress
          value={percentage}
          className="w-full h-1.5 bg-border-subtle"
        />
        <p className="text-[11px] text-text-muted">
          {storageUsedGB} GB of {storageTotalGB} GB used
        </p>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-surface border-r border-border-subtle z-30 flex-col overflow-y-auto">
        {renderNavContent()}
      </aside>
      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Dimmer backdrop */}
          <div
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
          />
          {/* Off-canvas sidebar */}
          <div className="relative w-72 max-w-[80vw] bg-surface h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 px-4 flex items-center justify-between border-b border-border-subtle">
              <Link
                href={TAB_TO_PATH["home"]}
                onClick={onCloseMobileMenu}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <MdOutlineCloudSync className="text-lg" />
                </div>
                <span className="font-semibold text-base text-text-main">
                  CloudFusion
                </span>
              </Link>
              <button
                onClick={onCloseMobileMenu}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main hover:bg-app-bg transition-colors"
                aria-label="Close menu"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavContent()}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

import { NavigationTab } from "@/types/navigation.types";

export const TAB_TO_PATH: Record<NavigationTab, string> = {
  home: "/dashboard",
  "all-files": "/files",
  recent: "/recent",
  starred: "/starred",
  shared: "/shared",
  trash: "/trash",
  "connected-accounts": "/accounts",
  storage: "/storage",
  "settings-profile": "/profile",
  login: "/login",
  register: "/register",
  "forgot-password": "/forgot-password",
  landing: "/",
};

export const PATH_TO_TAB: Record<string, NavigationTab> = {
  "/dashboard": "home",
  "/files": "all-files",
  "/recent": "recent",
  "/starred": "starred",
  "/shared": "shared",
  "/trash": "trash",
  "/accounts": "connected-accounts",
  "/storage": "storage",
  "/profile": "settings-profile",
  "/login": "login",
  "/register": "register",
  "/forgot-password": "forgot-password",
  "/": "landing",
};

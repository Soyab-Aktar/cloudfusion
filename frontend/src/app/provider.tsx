import { AuthProvider } from "@/store/AuthContext";
import React from "react";

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
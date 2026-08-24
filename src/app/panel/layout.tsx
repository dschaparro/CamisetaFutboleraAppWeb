"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/panel/login" || pathname === "/panel";

  if (isLogin) {
    // El login (Pantalla 08) usa su propio layout de dos columnas, sin sidebar.
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}

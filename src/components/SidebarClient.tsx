"use client";

import dynamic from "next/dynamic";

const SidebarNoSsr = dynamic(() => import("./Sidebar").then((m) => m.Sidebar), {
  ssr: false,
  loading: () => <div className="hidden md:block md:w-64" />,
});

export function SidebarClient() {
  return <SidebarNoSsr />;
}


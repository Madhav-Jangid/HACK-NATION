"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Sparkles, Users, FileText } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/founders", label: "Founders", icon: Users },
  { href: "/thesis", label: "Thesis", icon: FileText },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname?.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(156,90,60,0.18)]"
                : "text-muted-foreground hover:bg-[#f6ebe9] hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

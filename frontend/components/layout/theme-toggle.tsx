"use client";

import { useTheme } from "next-themes";
import { Button } from "@/app/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      Toggle theme
    </Button>
  );
}

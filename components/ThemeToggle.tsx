"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ✅ Fix hydration mismatch (wait until mounted)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or return a skeleton button
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      {resolvedTheme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </Button>
  );
}

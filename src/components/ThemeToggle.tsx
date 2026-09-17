import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Switch appearance"
      className={`tap rounded-full ${className ?? ""}`}
    >
      {theme === "dark" ? <Sun className="size-5 text-gold" /> : <Moon className="size-5" />}
    </Button>
  );
}

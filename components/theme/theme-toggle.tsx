"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button isIconOnly variant="light" size="sm" className="opacity-50">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    // Disabled: theme switching is locked to dark mode
    // if (theme === 'light') {
    //   setTheme('dark')
    // } else if (theme === 'dark') {
    //   setTheme('system')
    // } else {
    //   setTheme('light')
    // }
  };

  const getIcon = () => {
    // Fixed to dark theme icon
    return <Moon className="h-4 w-4" />;
    // Original theme switching logic (disabled):
    // switch (theme) {
    //   case 'light':
    //     return <Sun className="h-4 w-4" />
    //   case 'dark':
    //     return <Moon className="h-4 w-4" />
    //   default:
    //     return <Monitor className="h-4 w-4" />
    // }
  };

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      onPress={cycleTheme}
      className="transition-all duration-200"
      title="Dark theme (locked)"
    >
      {getIcon()}
    </Button>
  );
}

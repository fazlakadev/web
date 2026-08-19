"use client";

import * as React from "react";
import { cn } from "@/lib/format";

export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 min-w-44 rounded-2xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-lifted backdrop-blur-xl",
            align === "end" ? "end-0" : "start-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

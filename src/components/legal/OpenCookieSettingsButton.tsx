"use client";

import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

export function OpenCookieSettingsButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      {children ?? "Küpsiste seaded"}
    </button>
  );
}


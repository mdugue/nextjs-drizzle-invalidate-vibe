"use client";

import { History } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

type VersionBadgeProps = {
  count: number;
  onClick: () => void;
};

export function VersionBadge({ count, onClick }: VersionBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div
      className="flex h-auto gap-1 px-2 py-1"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.stopPropagation();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Badge className="h-5 px-1.5 text-xs" variant="secondary">
        <History />
        {count}
      </Badge>
    </div>
  );
}

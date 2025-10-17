"use client";

import { History } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

type VersionBadgeProps = {
  count: number;
  onClick: () => void;
};

export function VersionBadge({ count, onClick }: VersionBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Button
      className="h-auto gap-1 px-2 py-1"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      size="sm"
      type="button"
      variant="ghost"
    >
      <History className="h-3 w-3" />
      <Badge className="h-5 px-1.5 text-xs" variant="secondary">
        {count}
      </Badge>
    </Button>
  );
}

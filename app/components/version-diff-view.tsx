"use client";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import type { VersionDiff } from "@/lib/versioning";

type VersionDiffViewProps = {
  diff: VersionDiff;
};

const CAPITAL_LETTER_REGEX = /([A-Z])/g;
const FIRST_CHAR_REGEX = /^./;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
}

function formatFieldName(field: string): string {
  return field
    .replace(CAPITAL_LETTER_REGEX, " $1")
    .replace(FIRST_CHAR_REGEX, (str) => str.toUpperCase())
    .trim();
}

export function VersionDiffView({ diff }: VersionDiffViewProps) {
  const { changes } = diff;

  if (changes.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No changes detected</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-3">
        {changes.map((change) => (
          <div className="rounded-lg border p-4" key={change.field}>
            <div className="mb-2">
              <Badge variant="secondary">{formatFieldName(change.field)}</Badge>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <p className="text-muted-foreground text-xs">Old Value</p>
                <div className="rounded bg-red-50 px-3 py-2 text-red-900 dark:bg-red-950 dark:text-red-100">
                  <code className="break-all text-sm">
                    {formatValue(change.oldValue)}
                  </code>
                </div>
              </div>
              <div className="flex items-center pt-6">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-muted-foreground text-xs">New Value</p>
                <div className="rounded bg-green-50 px-3 py-2 text-green-900 dark:bg-green-950 dark:text-green-100">
                  <code className="break-all text-sm">
                    {formatValue(change.newValue)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

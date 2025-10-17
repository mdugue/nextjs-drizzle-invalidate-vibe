"use client";

import { Clock, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { VersionDiffView } from "@/app/components/version-diff-view";
import { VersionRestoreConfirm } from "@/app/components/version-restore-confirm";
import { formatDate } from "@/lib/format";
import type {
  MemberHistory,
  ProjectHistory,
  TicketHistory,
} from "@/lib/schema";
import type { VersionDiff } from "@/lib/versioning";

type VersionHistoryItem = ProjectHistory | TicketHistory | MemberHistory;

type VersionHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  versions: VersionHistoryItem[];
  onRestore: (versionNumber: number) => Promise<void>;
  onGetDiff: (v1: number, v2: number) => Promise<VersionDiff | null>;
};

export function VersionHistoryDialog({
  open,
  onOpenChange,
  title,
  versions,
  onRestore,
  onGetDiff,
}: VersionHistoryDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareVersions, setCompareVersions] = useState<
    [number, number] | null
  >(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCompare = (versionNumber: number) => {
    if (!selectedVersion) {
      setSelectedVersion(versionNumber);
      return;
    }

    const from = Math.min(selectedVersion, versionNumber);
    const to = Math.max(selectedVersion, versionNumber);

    startTransition(async () => {
      try {
        const result = await onGetDiff(from, to);
        setDiff(result);
        setCompareVersions([from, to]);
        setSelectedVersion(null);
      } catch {
        toast.error("Failed to compare versions");
      }
    });
  };

  const handleRestore = () => {
    if (!restoreVersion) {
      return;
    }

    startTransition(async () => {
      try {
        await onRestore(restoreVersion);
        toast.success("Version restored successfully");
        setRestoreVersion(null);
        onOpenChange(false);
      } catch {
        toast.error("Failed to restore version");
      }
    });
  };

  const clearDiff = () => {
    setDiff(null);
    setCompareVersions(null);
  };

  if (diff && compareVersions) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Compare Versions {compareVersions[0]} → {compareVersions[1]}
            </DialogTitle>
            <DialogDescription>
              Showing changes between versions
            </DialogDescription>
          </DialogHeader>
          <VersionDiffView diff={diff} />
          <div className="flex justify-end">
            <Button onClick={clearDiff} type="button" variant="outline">
              Back to History
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (restoreVersion) {
    return (
      <VersionRestoreConfirm
        isPending={isPending}
        onCancel={() => setRestoreVersion(null)}
        onConfirm={handleRestore}
        onOpenChange={onOpenChange}
        open={open}
        versionNumber={restoreVersion}
      />
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History: {title}</DialogTitle>
          <DialogDescription>
            {selectedVersion
              ? `Select another version to compare with v${selectedVersion}`
              : "View and restore previous versions"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {versions.map((version) => {
              let displayText = "";
              if ("title" in version) {
                displayText = version.title;
              } else if ("name" in version) {
                displayText = version.name;
              }

              return (
                <div
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                  key={version.id}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.versionNumber}</Badge>
                      <span className="text-muted-foreground text-sm">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDate(version.changedAt)}
                      </span>
                    </div>
                    <p className="text-sm">{displayText}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={isPending}
                      onClick={() => handleCompare(version.versionNumber)}
                      size="sm"
                      type="button"
                      variant={
                        selectedVersion === version.versionNumber
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedVersion === version.versionNumber
                        ? "Selected"
                        : "Compare"}
                    </Button>
                    <Button
                      disabled={isPending}
                      onClick={() => setRestoreVersion(version.versionNumber)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                </div>
              );
            })}
            {versions.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No version history available
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

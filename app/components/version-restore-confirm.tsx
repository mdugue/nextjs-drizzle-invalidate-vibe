"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

type VersionRestoreConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
};

export function VersionRestoreConfirm({
  open,
  onOpenChange,
  versionNumber,
  onConfirm,
  onCancel,
  isPending,
}: VersionRestoreConfirmProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Restore Version {versionNumber}?
          </DialogTitle>
          <DialogDescription>
            This will restore the item to version {versionNumber}. The current
            state will be saved as a new version before restoring.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            This action will overwrite the current state but preserves all
            history. You can always restore to any version later.
          </p>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onConfirm} type="button">
            {isPending ? "Restoring..." : "Restore Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Mail, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useOptimistic, useState, useTransition } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { MemberDialog } from "@/app/members/components/member-dialog";
import { formatDate } from "@/lib/format";
import type { CursorPaginationResult } from "@/lib/pagination";
import type { Member } from "@/lib/schema";

type MemberWithVersion = Member & { versionCount?: number };

type MemberListProps = {
  members: MemberWithVersion[];
  pageInfo: CursorPaginationResult<Member, string>["pageInfo"];
  search?: string;
  sort?: string;
  showDeleted?: boolean;
};

function buildQuery(
  base: { search?: string; sort?: string; showDeleted?: boolean },
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  if (base.search) {
    params.set("search", base.search);
  }
  if (base.sort) {
    params.set("sort", base.sort);
  }
  if (base.showDeleted) {
    params.set("showDeleted", "true");
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function MemberList({
  members,
  pageInfo,
  search,
  sort,
  showDeleted = false,
}: MemberListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<MemberWithVersion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortValue, setSortValue] = useState(sort ?? "createdAt");
  const [showDeletedValue, setShowDeletedValue] = useState(showDeleted);
  const sortSelectId = useId();
  const [optimisticMembers, applyOptimistic] = useOptimistic(
    members,
    (state, action: { type: "delete"; id: number }) => {
      if (action.type === "delete") {
        return state.filter((member) => member.id !== action.id);
      }
      return state;
    }
  );

  const openForCreate = () => {
    setSelected(null);
    setDialogOpen(true);
  };

  const openForMember = (member: MemberWithVersion) => {
    setSelected(member);
    setDialogOpen(true);
  };

  const navigateWithParams = (overrides: {
    search?: string;
    sort?: string;
    showDeleted?: boolean;
  }) => {
    const params = new URLSearchParams();
    const searchVal = overrides.search ?? search;
    const sortVal = overrides.sort ?? sortValue;
    const showDeletedVal = overrides.showDeleted ?? showDeletedValue;

    if (searchVal) {
      params.set("search", searchVal);
    }
    if (sortVal !== "createdAt") {
      params.set("sort", sortVal);
    }
    if (showDeletedVal) {
      params.set("showDeleted", "true");
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/members?${query}` : "/members");
    });
  };

  const handleFilterChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    navigateWithParams({ search: formData.get("search") as string });
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    navigateWithParams({ sort: value });
  };

  const handleShowDeletedChange = (checked: boolean) => {
    setShowDeletedValue(checked);
    navigateWithParams({ showDeleted: checked });
  };

  const baseQuery = { search, sort: sortValue, showDeleted: showDeletedValue };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-3xl">Team members</h1>
        <Button className="gap-2" onClick={openForCreate}>
          <Plus className="h-4 w-4" /> Invite member
        </Button>
      </div>
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={handleFilterChange}
      >
        <Input
          className="w-full max-w-sm"
          defaultValue={search ?? ""}
          name="search"
          placeholder="Search members"
        />
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground" htmlFor={sortSelectId}>
            Sort
          </Label>
          <Select
            disabled={isPending}
            name="sort"
            onValueChange={handleSortChange}
            value={sortValue}
          >
            <SelectTrigger id={sortSelectId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest</SelectItem>
              <SelectItem value="title">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={showDeletedValue}
            disabled={isPending}
            name="showDeleted"
            onCheckedChange={handleShowDeletedChange}
          />
          <span className="text-muted-foreground">Show deleted</span>
        </Label>
        <Button disabled={isPending} type="submit" variant="secondary">
          {isPending ? "Loading..." : "Apply"}
        </Button>
      </form>
      <div
        className={`grid gap-3 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        {optimisticMembers.map((member) => (
          <button
            className={`hover:-translate-y-0.5 flex flex-col gap-2 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:shadow ${member.deletedAt ? "opacity-60" : ""}`}
            key={member.id}
            onClick={() => openForMember(member)}
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{member.name}</span>
              <div className="flex gap-2">
                <Badge variant="secondary">{member.status}</Badge>
                {member.deletedAt ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    Deleted
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="h-4 w-4" />
              <span>{member.email}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Joined {formatDate(member.createdAt)}
            </p>
            {member.role ? (
              <p className="text-sm">Role: {member.role}</p>
            ) : null}
          </button>
        ))}
        {optimisticMembers.length === 0 ? (
          <p className="rounded-lg border bg-card p-6 text-center text-muted-foreground text-sm md:col-span-2 xl:col-span-3">
            No members found
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <Button
          asChild
          disabled={!(pageInfo.hasPrevious && pageInfo.prevCursor)}
          variant="outline"
        >
          <Link
            href={buildQuery(baseQuery, {
              cursor: pageInfo.prevCursor,
              direction: pageInfo.prevCursor ? "backward" : undefined,
            })}
          >
            Previous
          </Link>
        </Button>
        <Button
          asChild
          disabled={!(pageInfo.hasNext && pageInfo.nextCursor)}
          variant="outline"
        >
          <Link
            href={buildQuery(baseQuery, {
              cursor: pageInfo.nextCursor,
              direction: undefined,
            })}
          >
            Next
          </Link>
        </Button>
      </div>
      <MemberDialog
        member={selected}
        onDeleted={(id) => {
          applyOptimistic({ type: "delete", id });
        }}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelected(null);
            router.refresh();
          }
        }}
        open={dialogOpen}
      />
    </div>
  );
}

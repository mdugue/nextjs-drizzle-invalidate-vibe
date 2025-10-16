"use client";

import { Mail, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useOptimistic } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { MemberDialog } from "@/app/members/components/MemberDialog";
import { formatDate } from "@/lib/format";
import type { CursorPaginationResult } from "@/lib/pagination";
import type { Member } from "@/lib/schema";

type MemberListProps = {
  members: Member[];
  pageInfo: CursorPaginationResult<Member, string>["pageInfo"];
  search?: string;
  sort?: string;
};

function buildQuery(
  base: { search?: string; sort?: string },
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  if (base.search) {
    params.set("search", base.search);
  }
  if (base.sort) {
    params.set("sort", base.sort);
  }
  Object.entries(overrides).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function MemberList({
  members,
  pageInfo,
  search,
  sort,
}: MemberListProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Member | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sortValue, setSortValue] = React.useState(sort ?? "createdAt");
  const sortSelectId = React.useId();
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

  const openForMember = (member: Member) => {
    setSelected(member);
    setDialogOpen(true);
  };

  const baseQuery = { search, sort: sortValue };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-3xl">Team members</h1>
        <Button className="gap-2" onClick={openForCreate}>
          <Plus className="h-4 w-4" /> Invite member
        </Button>
      </div>
      <form className="flex flex-wrap items-center gap-3">
        <Input
          className="w-full max-w-sm"
          defaultValue={search ?? ""}
          name="search"
          placeholder="Search members"
        />
        <div className="flex items-center gap-2">
          <label
            className="text-muted-foreground text-sm"
            htmlFor={sortSelectId}
          >
            Sort
          </label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            id={sortSelectId}
            name="sort"
            onChange={(event) => setSortValue(event.target.value)}
            value={sortValue}
          >
            <option value="createdAt">Newest</option>
            <option value="title">Name</option>
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {optimisticMembers.map((member) => (
          <button
            className="hover:-translate-y-0.5 flex flex-col gap-2 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:shadow"
            key={member.id}
            onClick={() => openForMember(member)}
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{member.name}</span>
              <Badge variant="secondary">{member.status}</Badge>
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

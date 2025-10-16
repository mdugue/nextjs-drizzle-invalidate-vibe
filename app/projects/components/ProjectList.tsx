"use client";

import { ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useOptimistic } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ProjectSheet } from "@/app/projects/components/ProjectSheet";
import { formatDate } from "@/lib/format";
import type { CursorPaginationResult } from "@/lib/pagination";
import type { Project } from "@/lib/schema";

type ProjectListProps = {
  projects: Project[];
  pageInfo: CursorPaginationResult<Project, string>["pageInfo"];
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

export function ProjectList({
  projects,
  pageInfo,
  search,
  sort,
}: ProjectListProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Project | null>(null);
  const [sortValue, setSortValue] = React.useState(sort ?? "createdAt");
  const sortSelectId = React.useId();
  const [optimisticProjects, applyOptimistic] = useOptimistic(
    projects,
    (state, action: { type: "delete"; id: number }) => {
      if (action.type === "delete") {
        return state.filter((project) => project.id !== action.id);
      }
      return state;
    }
  );

  const onCreate = () => {
    setSelected(null);
    setSheetOpen(true);
  };

  const onSelect = (project: Project) => {
    setSelected(project);
    setSheetOpen(true);
  };

  const baseQuery = { search, sort: sortValue };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-3xl">Projects</h1>
        <Button className="gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Add project
        </Button>
      </div>
      <form className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            defaultValue={search ?? ""}
            name="search"
            placeholder="Search projects"
          />
        </div>
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
            <option value="title">Title</option>
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>
      <div className="space-y-2 rounded-lg border bg-card">
        {optimisticProjects.map((project) => (
          <button
            className="flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted"
            key={project.id}
            onClick={() => onSelect(project)}
            type="button"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  #{project.slug}
                </span>
                <Badge variant="secondary">{project.status}</Badge>
              </div>
              <p className="font-medium text-lg">{project.title}</p>
              {project.owner ? (
                <p className="text-muted-foreground text-sm">
                  Owned by {project.owner}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{formatDate(project.createdAt)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        ))}
        {optimisticProjects.length === 0 ? (
          <p className="px-4 py-6 text-center text-muted-foreground text-sm">
            No projects found
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
      <ProjectSheet
        onDeleted={(id) => {
          applyOptimistic({ type: "delete", id });
        }}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelected(null);
            router.refresh();
          }
        }}
        open={sheetOpen}
        project={selected}
      />
    </div>
  );
}

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

interface ProjectListProps {
  projects: Project[];
  pageInfo: CursorPaginationResult<Project, string>["pageInfo"];
  search?: string;
  sort?: string;
}

function buildQuery(
  base: { search?: string; sort?: string },
  overrides: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (base.search) params.set("search", base.search);
  if (base.sort) params.set("sort", base.sort);
  Object.entries(overrides).forEach(([key, value]) => {
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
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
    },
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
        <h1 className="text-3xl font-semibold">Projects</h1>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add project
        </Button>
      </div>
      <form className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search projects"
            defaultValue={search ?? ""}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor={sortSelectId}
            className="text-sm text-muted-foreground"
          >
            Sort
          </label>
          <select
            id={sortSelectId}
            name="sort"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
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
            key={project.id}
            className="flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted"
            onClick={() => onSelect(project)}
            type="button"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  #{project.slug}
                </span>
                <Badge variant="secondary">{project.status}</Badge>
              </div>
              <p className="text-lg font-medium">{project.title}</p>
              {project.owner ? (
                <p className="text-sm text-muted-foreground">
                  Owned by {project.owner}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatDate(project.createdAt)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        ))}
        {optimisticProjects.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No projects found
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={!pageInfo.hasPrevious || !pageInfo.prevCursor}
          asChild
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
          variant="outline"
          disabled={!pageInfo.hasNext || !pageInfo.nextCursor}
          asChild
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
        project={selected}
        open={sheetOpen}
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
      />
    </div>
  );
}

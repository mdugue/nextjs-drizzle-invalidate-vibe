"use client";

import { ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useOptimistic,
  useState,
  useTransition,
} from "react";
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
import { VersionBadge } from "@/app/components/version-badge";
import { VersionHistoryDialog } from "@/app/components/version-history-dialog";
import {
  getProjectVersionDiff,
  getProjectVersionHistory,
  restoreProject,
} from "@/app/projects/actions";
import { ProjectSheet } from "@/app/projects/components/project-sheet";
import { formatDate } from "@/lib/format";
import type { CursorPaginationResult } from "@/lib/pagination";
import type { Project, ProjectHistory } from "@/lib/schema";

type ProjectWithVersion = Project & { versionCount?: number };

type ProjectListProps = {
  projects: ProjectWithVersion[];
  pageInfo: CursorPaginationResult<Project, string>["pageInfo"];
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

export function ProjectList({
  projects,
  pageInfo,
  search,
  sort,
  showDeleted = false,
}: ProjectListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectWithVersion | null>(null);
  const [sortValue, setSortValue] = useState(sort ?? "createdAt");
  const [showDeletedValue, setShowDeletedValue] = useState(showDeleted);
  const sortSelectId = useId();
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryProject, setVersionHistoryProject] =
    useState<ProjectWithVersion | null>(null);
  const [versions, setVersions] = useState<ProjectHistory[]>([]);
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

  const onSelect = (project: ProjectWithVersion) => {
    setSelected(project);
    setSheetOpen(true);
  };

  const onVersionHistory = (project: ProjectWithVersion) => {
    setVersionHistoryProject(project);
    setVersionHistoryOpen(true);
  };

  useEffect(() => {
    if (versionHistoryProject && versionHistoryOpen) {
      getProjectVersionHistory(versionHistoryProject.id).then(setVersions);
    }
  }, [versionHistoryProject, versionHistoryOpen]);

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
      router.push(query ? `/projects?${query}` : "/projects");
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
        <h1 className="font-semibold text-3xl">Projects</h1>
        <Button className="gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Add project
        </Button>
      </div>
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={handleFilterChange}
      >
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
              <SelectItem value="title">Title</SelectItem>
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
        className={`space-y-2 rounded-lg border bg-card transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        {optimisticProjects.map((project) => (
          <button
            className={`flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted ${project.deletedAt ? "opacity-60" : ""}`}
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
                {project.deletedAt ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    Deleted
                  </Badge>
                ) : null}
                {project.versionCount ? (
                  <VersionBadge
                    count={project.versionCount}
                    onClick={() => onVersionHistory(project)}
                  />
                ) : null}
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
      {versionHistoryProject ? (
        <VersionHistoryDialog
          onGetDiff={async (v1, v2) =>
            getProjectVersionDiff(versionHistoryProject.id, v1, v2)
          }
          onOpenChange={(open) => {
            setVersionHistoryOpen(open);
            if (!open) {
              setVersionHistoryProject(null);
              setVersions([]);
              router.refresh();
            }
          }}
          onRestore={async (versionNumber) => {
            await restoreProject(versionHistoryProject.id, versionNumber);
            router.refresh();
          }}
          open={versionHistoryOpen}
          title={versionHistoryProject.title}
          versions={versions}
        />
      ) : null}
    </div>
  );
}

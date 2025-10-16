import { ProjectList } from "@/app/projects/components/ProjectList";
import { parsePaginationParams } from "@/lib/pagination";
import { getProjectList } from "@/lib/queries";

interface ProjectsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const sortParam =
    typeof searchParams.sort === "string" ? searchParams.sort : "createdAt";
  const urlParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") urlParams.set(key, value);
  });
  const pagination = parsePaginationParams(urlParams);
  const data = await getProjectList({
    cursor: pagination.cursor,
    direction: pagination.direction,
    limit: 20,
    search,
    sort: sortParam === "title" ? "title" : "createdAt",
  });

  return (
    <ProjectList
      projects={data.items}
      pageInfo={data.pageInfo}
      search={search}
      sort={sortParam}
    />
  );
}

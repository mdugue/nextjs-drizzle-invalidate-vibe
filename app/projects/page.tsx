import { ProjectList } from "@/app/projects/components/ProjectList";
import { parsePaginationParams } from "@/lib/pagination";
import { getProjectList } from "@/lib/queries";

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : "createdAt";
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
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
      pageInfo={data.pageInfo}
      projects={data.items}
      search={search}
      sort={sortParam}
    />
  );
}

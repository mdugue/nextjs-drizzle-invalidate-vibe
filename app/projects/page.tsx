import { ProjectList } from "@/app/projects/components/project-list";
import { parsePaginationParams } from "@/lib/pagination";
import { getProjectList, getProjectVersionCount } from "@/lib/queries";

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : "createdAt";
  const showDeleted = params.showDeleted === "true";
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      urlParams.set(key, value);
    }
  }
  const pagination = parsePaginationParams(urlParams);
  const data = await getProjectList({
    cursor: pagination.cursor,
    direction: pagination.direction,
    limit: 5,
    search,
    sort: sortParam === "title" ? "title" : "createdAt",
    showDeleted,
  });

  const versionCounts = await Promise.all(
    data.items.map((project) => getProjectVersionCount(project.id))
  );

  const projectsWithVersions = data.items.map((project, index) => ({
    ...project,
    versionCount: versionCounts[index],
  }));

  return (
    <ProjectList
      pageInfo={data.pageInfo}
      projects={projectsWithVersions}
      search={search}
      showDeleted={showDeleted}
      sort={sortParam}
    />
  );
}

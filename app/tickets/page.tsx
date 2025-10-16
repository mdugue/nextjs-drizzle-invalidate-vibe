import { TicketList } from "@/app/tickets/components/ticket-list";
import { DEFAULT_PAGE_SIZE, parsePaginationParams } from "@/lib/pagination";
import {
  getMemberOptions,
  getProjectOptions,
  getTicketList,
} from "@/lib/queries";

type TicketsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : "createdAt";
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      urlParams.set(key, value);
    }
  }
  const pagination = parsePaginationParams(urlParams);
  const data = await getTicketList({
    cursor: pagination.cursor,
    direction: pagination.direction,
    limit: DEFAULT_PAGE_SIZE,
    search,
    sort: sortParam === "title" ? "title" : "createdAt",
  });
  const projects = await getProjectOptions();
  const members = await getMemberOptions();

  const projectOptions = projects.map((project) => ({
    id: project.id,
    label: project.title,
  }));
  const memberOptions = members.map((member) => ({
    id: member.id,
    label: member.name,
  }));

  return (
    <TicketList
      memberOptions={memberOptions}
      pageInfo={data.pageInfo}
      projectOptions={projectOptions}
      search={search}
      sort={sortParam}
      tickets={data.items}
    />
  );
}

import { TicketList } from "@/app/tickets/components/TicketList";
import { parsePaginationParams } from "@/lib/pagination";
import {
  getMemberOptions,
  getProjectOptions,
  getTicketList,
} from "@/lib/queries";

interface TicketsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const sortParam =
    typeof searchParams.sort === "string" ? searchParams.sort : "createdAt";
  const urlParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") urlParams.set(key, value);
  });
  const pagination = parsePaginationParams(urlParams);
  const data = await getTicketList({
    cursor: pagination.cursor,
    direction: pagination.direction,
    limit: 20,
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
      tickets={data.items}
      pageInfo={data.pageInfo}
      search={search}
      sort={sortParam}
      projectOptions={projectOptions}
      memberOptions={memberOptions}
    />
  );
}

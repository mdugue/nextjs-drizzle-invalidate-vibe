import { MemberList } from "@/app/members/components/MemberList";
import { parsePaginationParams } from "@/lib/pagination";
import { getMemberList } from "@/lib/queries";

interface MembersPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const sortParam =
    typeof searchParams.sort === "string" ? searchParams.sort : "createdAt";
  const urlParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") urlParams.set(key, value);
  });
  const pagination = parsePaginationParams(urlParams);
  const data = await getMemberList({
    cursor: pagination.cursor,
    direction: pagination.direction,
    limit: 20,
    search,
    sort: sortParam === "title" ? "title" : "createdAt",
  });

  return (
    <MemberList
      members={data.items}
      pageInfo={data.pageInfo}
      search={search}
      sort={sortParam}
    />
  );
}

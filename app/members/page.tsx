import { MemberList } from "@/app/members/components/member-list";
import { parsePaginationParams } from "@/lib/pagination";
import { getMemberList } from "@/lib/queries";

type MembersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
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

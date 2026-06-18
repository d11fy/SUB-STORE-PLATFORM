import { getCustomersAction } from "@/actions/customers";
import { CustomersClient } from "./customers-client";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1") || 1);

  const { data: customers, count, error } = await getCustomersAction({
    search: q,
    page: currentPage,
  });

  return (
    <CustomersClient
      customers={customers}
      totalCount={count}
      currentPage={currentPage}
      search={q ?? ""}
      fetchError={error}
    />
  );
}

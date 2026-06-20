import { getDomainsAction } from "@/actions/domain";
import { DomainClient } from "./domain-client";
import { isVercelConfigured } from "@/lib/domain/vercel-api";

export default async function DomainPage() {
  const { data: domains, error } = await getDomainsAction();
  const vercelConfigured = isVercelConfigured();

  return (
    <DomainClient
      domains={domains}
      fetchError={error}
      vercelConfigured={vercelConfigured}
    />
  );
}

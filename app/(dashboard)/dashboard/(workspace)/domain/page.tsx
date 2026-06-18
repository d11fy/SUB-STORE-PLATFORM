import { getDomainsAction } from "@/actions/domain";
import { DomainClient } from "./domain-client";

export default async function DomainPage() {
  const { data: domains, error } = await getDomainsAction();

  return <DomainClient domains={domains} fetchError={error} />;
}

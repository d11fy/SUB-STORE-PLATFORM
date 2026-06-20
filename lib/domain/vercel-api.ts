// server-only — never imported by client code

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optional

const BASE = "https://api.vercel.com";

function teamParam() {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
}

async function vercelFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  return res;
}

export function isVercelConfigured(): boolean {
  return !!(VERCEL_TOKEN && VERCEL_PROJECT_ID);
}

export interface VercelDomainResult {
  configured: boolean; // false if Vercel not set up
  error?: string;
  data?: unknown;
}

export interface VercelDomainStatus {
  configured: boolean;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  error?: string;
}

// Add domain to Vercel project
export async function vercelAddDomain(domain: string): Promise<VercelDomainResult> {
  if (!isVercelConfigured()) return { configured: false };
  try {
    const res = await vercelFetch(
      `/v10/projects/${VERCEL_PROJECT_ID}/domains${teamParam()}`,
      { method: "POST", body: JSON.stringify({ name: domain }) }
    );
    const data = await res.json();
    if (!res.ok) {
      return { configured: true, error: (data as { error?: { message?: string } }).error?.message ?? "فشل إضافة الدومين إلى Vercel" };
    }
    return { configured: true, data };
  } catch (e) {
    return { configured: true, error: String(e) };
  }
}

// Get domain verification status from Vercel
export async function vercelCheckDomain(domain: string): Promise<VercelDomainStatus> {
  if (!isVercelConfigured()) return { configured: false, verified: false };
  try {
    const res = await vercelFetch(
      `/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam()}`
    );
    if (res.status === 404) return { configured: true, verified: false, error: "الدومين غير مضاف في Vercel" };
    const data = await res.json() as { verified?: boolean; verification?: unknown[] };
    return {
      configured: true,
      verified: data.verified === true,
      verification: data.verification as VercelDomainStatus["verification"],
    };
  } catch (e) {
    return { configured: true, verified: false, error: String(e) };
  }
}

// Remove domain from Vercel project
export async function vercelRemoveDomain(domain: string): Promise<VercelDomainResult> {
  if (!isVercelConfigured()) return { configured: false };
  try {
    const res = await vercelFetch(
      `/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam()}`,
      { method: "DELETE" }
    );
    if (!res.ok && res.status !== 404) {
      const data = await res.json();
      return { configured: true, error: (data as { error?: { message?: string } }).error?.message ?? "فشل حذف الدومين من Vercel" };
    }
    return { configured: true };
  } catch (e) {
    return { configured: true, error: String(e) };
  }
}

// Get required DNS configuration from Vercel
export async function vercelGetDnsConfig(_domain: string): Promise<{
  configured: boolean;
  aRecord?: string;
  cname?: string;
  error?: string;
}> {
  if (!isVercelConfigured()) {
    // Return Vercel's well-known defaults when no API
    return {
      configured: false,
      aRecord: "76.76.21.21",
      cname: "cname.vercel-dns.com",
    };
  }
  // When Vercel API is configured, these values come from the domain check
  return {
    configured: true,
    aRecord: "76.76.21.21",
    cname: "cname.vercel-dns.com",
  };
}

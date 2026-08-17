import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ReferencePortalExact } from "@/components/reference-portal-exact";
import { resolveProjectByToken } from "@/lib/airtable";
import { isPortalSessionValid } from "@/lib/portal-auth";

export const revalidate = 60;

type ClientPortalPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { token } = await params;
  const data = await resolveProjectByToken(token);
  if (!data) notFound();

  const host = (await headers()).get("host") ?? "";
  const isLocalDemo = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
  const authRequired = token !== "demo" && !isLocalDemo && !(await isPortalSessionValid(token));
  return <ReferencePortalExact data={data} token={token} authRequired={authRequired} />;
}

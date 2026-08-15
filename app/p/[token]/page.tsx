import { notFound } from "next/navigation";
import { ClientPortalShell } from "@/components/client-portal-shell";
import { PortalAuthForm } from "@/components/portal-auth-form";
import { resolveProjectByToken } from "@/lib/airtable";
import { isPortalSessionValid } from "@/lib/portal-auth";

export const revalidate = 60;

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (token !== "demo" && !(await isPortalSessionValid(token))) {
    return <PortalAuthForm token={token} />;
  }

  const data = await resolveProjectByToken(token);
  if (!data) notFound();

  return <ClientPortalShell data={data} token={token} />;
}

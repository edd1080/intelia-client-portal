import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ReferencePortalExact } from "@/components/reference-portal-exact";
import { resolveProjectByTokenFromSnapshot } from "@/lib/portal-snapshots";
import { isPortalSessionValid } from "@/lib/portal-auth";

export const revalidate = 60;

type ClientPortalPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: ClientPortalPageProps): Promise<Metadata> {
  const { token } = await params;
  const data = resolveProjectByTokenFromSnapshot(token);
  const projectName = data?.project.name || "Intelia";
  return {
    title: `Portal de Cliente - ${projectName}`,
    description: `Portal privado de estado de proyecto para ${projectName}`,
  };
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { token } = await params;
  const data = resolveProjectByTokenFromSnapshot(token);
  if (!data) notFound();

  const host = (await headers()).get("host") ?? "";
  const isLocalDemo = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
  const authRequired = token !== "demo" && !isLocalDemo && !(await isPortalSessionValid(token));
  if (authRequired) return <ReferencePortalExact token={token} authRequired />;
  return <ReferencePortalExact data={data} token={token} authRequired={authRequired} />;
}

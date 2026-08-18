import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ReferencePortalExact } from "@/components/reference-portal-exact";
import { resolveProjectByPublicSlugFromSnapshot } from "@/lib/portal-snapshots";
import { isPortalSessionValid } from "@/lib/portal-auth";

export const revalidate = 60;

type FriendlyProjectPageProps = {
  params: Promise<{ projectSlug: string }>;
};

const RESERVED_SLUGS = new Set(["api", "p", "_next", "favicon.ico"]);

export async function generateMetadata({ params }: FriendlyProjectPageProps): Promise<Metadata> {
  const { projectSlug } = await params;
  const data = resolveProjectByPublicSlugFromSnapshot(projectSlug);
  const projectName = data?.project.name || "Intelia";
  return {
    title: `Portal de Cliente - ${projectName}`,
    description: `Portal privado de estado de proyecto para ${projectName}`,
  };
}

export default async function FriendlyProjectPage({ params }: FriendlyProjectPageProps) {
  const { projectSlug } = await params;
  if (RESERVED_SLUGS.has(projectSlug)) notFound();

  const data = resolveProjectByPublicSlugFromSnapshot(projectSlug);
  if (!data) notFound();

  const host = (await headers()).get("host") ?? "";
  const isLocalDemo = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
  const authRequired = !isLocalDemo && !(await isPortalSessionValid(projectSlug));
  if (authRequired) return <ReferencePortalExact token={projectSlug} authRequired />;
  return <ReferencePortalExact data={data} token={projectSlug} authRequired={authRequired} />;
}

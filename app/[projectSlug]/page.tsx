import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ReferencePortalExact } from "@/components/reference-portal-exact";
import { resolveProjectByPublicSlugFromSnapshot } from "@/lib/portal-snapshots";
import { isPortalSessionValid } from "@/lib/portal-auth";

export const revalidate = 60;

type FriendlyProjectPageProps = {
  params: Promise<{ projectSlug: string }>;
};

const RESERVED_SLUGS = new Set(["api", "p", "_next", "favicon.ico"]);

export default async function FriendlyProjectPage({ params }: FriendlyProjectPageProps) {
  const { projectSlug } = await params;
  if (RESERVED_SLUGS.has(projectSlug)) notFound();

  const data = resolveProjectByPublicSlugFromSnapshot(projectSlug);
  if (!data) notFound();

  const host = (await headers()).get("host") ?? "";
  const isLocalDemo = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
  const authRequired = !isLocalDemo && !(await isPortalSessionValid(projectSlug));
  return <ReferencePortalExact data={data} token={projectSlug} authRequired={authRequired} />;
}

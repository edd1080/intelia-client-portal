import { ReferencePortalExact } from "@/components/reference-portal-exact";

export const revalidate = 60;

export default async function ClientPortalPage() {
  return <ReferencePortalExact />;
}

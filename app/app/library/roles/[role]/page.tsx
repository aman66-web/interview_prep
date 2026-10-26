import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { BackLink, CaseList } from "@/components/app/library-parts";
import { Container } from "@/components/ui/layout";
import { libraryAllCases } from "@/lib/app/library";
import { requireUser } from "@/lib/auth/session";
import { findRole, minutesRange, roleCases } from "@/lib/content/roles";

export const metadata: Metadata = { title: "Cases by role", robots: { index: false } };

// Cases browsed by role: every case that suits the role, whichever company it is practised for.
export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  await requireUser();
  const { role: slug } = await params;
  const role = findRole(slug);
  if (!role) notFound();
  const cases = roleCases(role);
  if (cases.length === 0) notFound();
  const paid = await libraryAllCases();

  return (
    <>
      <AppHeader
        eyebrow={<BackLink href="/app/library#cases">All roles</BackLink>}
        title={
          <>
            {role.label} <span className="serif-accent">cases</span>
          </>
        }
        intro={
          <p>
            {role.blurb} {cases.length} {cases.length === 1 ? "case" : "cases"}, {minutesRange(cases)} each.
          </p>
        }
      />
      <Container size="narrow" className="mt-10 pb-10 sm:mt-14 sm:pb-16">
        <CaseList cases={cases} paid={paid} />
      </Container>
    </>
  );
}

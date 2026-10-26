import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { BackLink, CaseList, NotAffiliated } from "@/components/app/library-parts";
import { Container } from "@/components/ui/layout";
import { libraryAllCases } from "@/lib/app/library";
import { requireUser } from "@/lib/auth/session";
import { findPracticeFirm } from "@/lib/content/practice";
import { findRole, firmRoleCases, minutesRange, trackOfFirm } from "@/lib/content/roles";

export const metadata: Metadata = { title: "Choose a case", robots: { index: false } };

// Step 3 of company, role, case: the cases for this company and role. Each opens its start page.
export default async function CompanyRolePage({ params }: { params: Promise<{ firm: string; role: string }> }) {
  await requireUser();
  const { firm: firmSlug, role: roleSlug } = await params;
  const firm = findPracticeFirm(firmSlug);
  const role = findRole(roleSlug);
  if (!firm || !role || role.track !== trackOfFirm(firm)) notFound();
  const cases = firmRoleCases(firm, role);
  if (cases.length === 0) notFound();
  const paid = await libraryAllCases();

  return (
    <>
      <AppHeader
        eyebrow={<BackLink href={`/app/library/${firm.slug}`}>{firm.short_name}-style roles</BackLink>}
        title={
          <>
            {role.label} <span className="serif-accent">cases</span>
          </>
        }
        intro={
          <p>
            {firm.short_name}-style practice for {role.label.toLowerCase()}: {cases.length} {cases.length === 1 ? "case" : "cases"}, {minutesRange(cases)} each. Pick one to start.
          </p>
        }
      />
      <Container size="narrow" className="mt-10 pb-10 sm:mt-14 sm:pb-16">
        <CaseList cases={cases} paid={paid} />
        <NotAffiliated className="mt-8" />
      </Container>
    </>
  );
}

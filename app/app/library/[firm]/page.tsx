import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { BackLink, NotAffiliated, RoleCard } from "@/components/app/library-parts";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";
import { findPracticeFirm } from "@/lib/content/practice";
import { minutesRange, rolesForFirm } from "@/lib/content/roles";

export const metadata: Metadata = { title: "Choose your role", robots: { index: false } };

// Step 2 of company, role, case: what are you applying for at this company?
export default async function CompanyPage({ params }: { params: Promise<{ firm: string }> }) {
  await requireUser();
  const { firm: slug } = await params;
  const firm = findPracticeFirm(slug);
  if (!firm) notFound();
  const roles = rolesForFirm(firm);
  if (roles.length === 0) notFound();

  return (
    <>
      <AppHeader
        eyebrow={<BackLink href="/app/library">All companies</BackLink>}
        title={
          <>
            {firm.short_name}-style <span className="serif-accent">practice</span>
          </>
        }
        intro={<p>What are you applying for? Pick a role to see the practice interviews that suit it.</p>}
      />
      <Container className="mt-10 pb-10 sm:mt-14 sm:pb-16">
        <h2 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">Choose your role</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(({ role, cases }, i) => (
            <li key={role.slug}>
              <RoleCard role={role} index={i} count={cases.length} minutes={minutesRange(cases)} href={`/app/library/${firm.slug}/${role.slug}`} />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href={`/practice/${firm.slug}`} variant="secondary" arrow>
            What {firm.short_name} says about its interviews
          </ButtonLink>
        </div>
        <NotAffiliated className="mt-8" />
        <p className="mt-3 text-sm text-subtle">
          Roles are our own way of grouping practice cases.{" "}
          <Link href="/practice" className="underline underline-offset-4 hover:text-ink">
            More on practice by firm
          </Link>
        </p>
      </Container>
    </>
  );
}

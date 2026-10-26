import type { Metadata } from "next";
import { AppHeader } from "@/components/app/app-header";
import { LibrarySections } from "@/components/app/library-parts";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Interview library",
  robots: { index: false },
};

// The signed-in interview library: Companies (company, then role, then case) and Cases
// (browse by role). The same two sections are on the dashboard.
export default async function LibraryPage() {
  await requireUser();
  return (
    <>
      <AppHeader
        eyebrow="Your practice"
        title={
          <>
            The interview <span className="serif-accent">library</span>
          </>
        }
        intro={<p>Browse by company, or by the role you are going for. Every case has its length and difficulty on it.</p>}
      />
      <LibrarySections className="mt-12 pb-10 sm:mt-16 sm:pb-16" />
    </>
  );
}

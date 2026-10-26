import type { Metadata } from "next";
import { AppHeader } from "@/components/app/app-header";
import { FirmLibraryApp } from "@/components/marketing/firm-library";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Interview library",
  robots: { index: false },
};

// The signed-in interview library: every firm and bank, with its practice interviews.
// Tapping an interview opens its start page. The same section is on the dashboard.
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
        intro={<p>Choose the firm you are preparing for, then pick an interview. Each one has its length and difficulty on it.</p>}
      />
      <FirmLibraryApp className="mt-12 pb-10 sm:mt-16 sm:pb-16" />
    </>
  );
}

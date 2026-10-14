import { siteConfig } from "@/site.config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted">
        <p>{siteConfig.disclaimer}</p>
        {siteConfig.supportEmail ? (
          <p className="mt-2">
            Questions?{" "}
            <a
              className="underline"
              href={`mailto:${siteConfig.supportEmail}`}
            >
              {siteConfig.supportEmail}
            </a>
          </p>
        ) : null}
        <p className="mt-2">
          &copy; {new Date().getFullYear()} {siteConfig.brandName}
        </p>
      </div>
    </footer>
  );
}

// Tells search engines (through IndexNow) which of our pages are new or changed, so they are
// crawled sooner. Run it only after a deploy that adds pages to the PUBLIC site.
// Usage: node scripts/indexnow.mjs            (sends every address in the live sitemap)
//        node scripts/indexnow.mjs /guides/x  (sends just those paths)
// The key below is not a secret: IndexNow requires it to be published at /891d648cf77600298d13406372f69d40.txt.
const KEY = "891d648cf77600298d13406372f69d40";
const SITE = process.env.INDEXNOW_SITE ?? "https://casespar.app";

const paths = process.argv.slice(2);
let urls;
if (paths.length) {
  urls = paths.map((p) => new URL(p, SITE).toString());
} else {
  const res = await fetch(new URL("/sitemap.xml", SITE));
  if (!res.ok) throw new Error(`sitemap.xml answered ${res.status}`);
  urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
if (!urls.length) throw new Error("No addresses to send");

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow answered ${res.status} for ${urls.length} addresses`);
if (res.status >= 400) process.exit(1);

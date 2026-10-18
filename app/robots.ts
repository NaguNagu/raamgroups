export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: "https://raamgroups.vercel.app/sitemap.xml",
  };
}

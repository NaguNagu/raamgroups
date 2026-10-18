export default function sitemap() {
  return ["", "/about", "/products", "/contact"].map((path) => ({
    url: `https://raamgroups.vercel.app${path}`,
    lastModified: new Date(),
  }));
}

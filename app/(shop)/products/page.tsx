import { Suspense } from "react";
import { Catalogue } from "@/components/catalogue";
export const metadata = { title: "Our products" };
export default function Products() {
  return (
    <Suspense
      fallback={
        <div className="shell page-intro">
          <h1>Our products</h1>
          <p>Loading the collection…</p>
        </div>
      }
    >
      <Catalogue />
    </Suspense>
  );
}

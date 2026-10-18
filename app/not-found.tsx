import Link from "next/link";
export default function NotFound() {
  return (
    <main className="shell page-intro">
      <h1>This page isn’t here.</h1>
      <p>Let’s get you back to the store.</p>
      <Link href="/" className="btn primary">
        Back to home →
      </Link>
    </main>
  );
}

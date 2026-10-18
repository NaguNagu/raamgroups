import Link from "next/link";
export default function Credits() {
  return (
    <main className="shell" style={{ paddingBlock: 80 }}>
      <Link href="/products">← Back to products</Link>
      <h1>Product photograph credits</h1>
      <p>
        Reference photographs illustrate a product type. Actual colour,
        construction and specification may vary. Please confirm with the shop
        before ordering.
      </p>
      <ul>
        <li>
          <a href="https://commons.wikimedia.org/wiki/File:Coir_rolls_in_Salem.jpg">
            Coir rolls in Salem
          </a>{" "}
          — Thamizhpparithi Maari,{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">
            CC BY-SA 4.0
          </a>
          .
        </li>
        <li>
          <a href="https://commons.wikimedia.org/wiki/File:Polypropeen_(Gripolene).jpg">
            Polypropeen (Gripolene)
          </a>{" "}
          — Rasbak,{" "}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/">
            CC BY-SA 3.0
          </a>
          .
        </li>
        <li>
          <a href="https://commons.wikimedia.org/wiki/File:A_aesthetic_Bell_for_cattle.JPG">
            A aesthetic Bell for cattle
          </a>{" "}
          — Thamizhpparithi Maari,{" "}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/">
            CC BY-SA 3.0
          </a>
          .
        </li>
      </ul>
      <p>
        Original photographs are provided unchanged; the website may crop them
        within its display frames. The business logo and poster were supplied by
        the owner.
      </p>
    </main>
  );
}

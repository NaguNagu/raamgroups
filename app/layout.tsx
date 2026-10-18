import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://raamgroups.vercel.app"),
  title: {
    default:
      "Sri Raam Rope Merchants | Ropes, Cattle Essentials & Brassware in Salem",
    template: "%s | Sri Raam Rope Merchants",
  },
  description:
    "Explore ropes, cattle bells, brass pooja items and cot tape rolls at Sri Raam Rope Merchants, Shevapet, Salem. Wholesale and retail enquiries on WhatsApp.",
  icons: { icon: "/raam-logo.png" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";
import "./charts.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pathfinder-sa-zeta.vercel.app"),
  title: "Pathfinder SA | Career, degree and university guidance",
  description: "Explore career directions, compare qualification routes and research South African universities with sourced costs and earning evidence.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "Pathfinder SA | Career, degree and university guidance", description: "From career direction to qualification and university fit, built for South Africa." },
  twitter: { card: "summary", title: "Pathfinder SA | Career, degree and university guidance", description: "From career direction to qualification and university fit, built for South Africa." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

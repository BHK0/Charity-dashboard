import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Organization Management",
  description: "Control panel for managing organizations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cairo.className}>
      <body>{children}</body>
    </html>
  );
}

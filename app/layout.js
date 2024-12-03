import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  display: "swap",
});

export const metadata = {
  title: "إدارة الجهات",
  description: "لوحة التحكم لإدارة الجهات",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cairo.className}>
      <body>{children}</body>
    </html>
  );
}

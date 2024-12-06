import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

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
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

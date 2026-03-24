import type { Metadata } from "next";
import "./globals.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSearch, faShoppingBag, faTimes, faMagic, faBars } from '@fortawesome/free-solid-svg-icons';

library.add(faSearch, faShoppingBag, faTimes, faMagic, faBars);

export const metadata: Metadata = {
  title: "SkinTalk | Clean & Elegant Skincare",
  description: "Premium Skincare - Experience the perfect blend of minimalist design and pure ingredients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
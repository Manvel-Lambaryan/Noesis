import type { ReactNode } from "react";

export const metadata = {
  title: "NOESIS",
  description: "Developer marketplace foundation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

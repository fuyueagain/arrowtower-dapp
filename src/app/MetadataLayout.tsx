// app/MetadataLayout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arrowtower",
  description: "Arrowtower",
};

export default function MetadataLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
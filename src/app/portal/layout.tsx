import type { ReactNode } from "react";

// Login and password-recovery pages are public. Authenticated portal routes
// use the sibling (protected) route-group layout instead.
export default function PortalRootLayout({ children }: { children: ReactNode }) {
  return children;
}

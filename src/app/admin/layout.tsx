import type { ReactNode } from "react";

// The login page lives under /admin but must not be wrapped by the protected
// control-center layout. Authentication for the other pages is applied by the
// sibling (protected) route-group layout and the request proxy.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}

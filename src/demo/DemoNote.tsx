import type { ReactNode } from "react";

/** Small inline disclosure used on pages whose data is sample or simulated. */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <div className="demo-note" role="note">
      <span className="demo-note-tag">Demo</span>
      <span>{children}</span>
    </div>
  );
}

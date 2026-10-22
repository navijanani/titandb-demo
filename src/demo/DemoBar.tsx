import { useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import { LINKS } from "./links";
import { ArchitectureModal } from "./ArchitectureModal";

export function DemoBar() {
  const [archOpen, setArchOpen] = useState(false);
  return (
    <>
      <div className="demo-bar">
        <span className="demo-badge" title="You are viewing a static demo with sample data">
          <span className="demo-badge-dot" aria-hidden="true" />
          Demo Mode
        </span>
        <span className="demo-bar-text">Sample data · no backend</span>
        <nav className="demo-bar-links" aria-label="Project links">
          <a href={LINKS.liveApp} target="_blank" rel="noopener noreferrer">Live app <IconExternalLink size={13} strokeWidth={2} /></a>
          <a href={LINKS.frontendRepo} target="_blank" rel="noopener noreferrer">GitHub <IconExternalLink size={13} strokeWidth={2} /></a>
          <button type="button" onClick={() => setArchOpen(true)}>Architecture</button>
        </nav>
      </div>
      {archOpen && <ArchitectureModal onClose={() => setArchOpen(false)} />}
    </>
  );
}

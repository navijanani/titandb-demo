import { useRef, useEffect, useCallback, useState } from "react";

type GraphNode = {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type GraphEdge = {
  source: number;
  target: number;
  type: string;
};

type ForceGraphProps = {
  nodes: { id: number; name: string; type: string }[];
  edges: { source: number; target: number; type: string }[];
  onNodeClick?: (nodeId: number) => void;
  selectedNodeId?: number | null;
};

const TYPES: Record<string, { color: string; label: string }> = {
  concept: { color: "#6366f1", label: "Concept" },
  person: { color: "#ec4899", label: "Person" },
  organization: { color: "#f59e0b", label: "Organization" },
  location: { color: "#10b981", label: "Location" },
  event: { color: "#ef4444", label: "Event" },
  technology: { color: "#06b6d4", label: "Tech" },
};

function getTypeColor(type: string): string {
  return TYPES[type.toLowerCase()]?.color ?? "#6b7280";
}

function getTypeLabel(type: string): string {
  return TYPES[type.toLowerCase()]?.label ?? type;
}

export function ForceGraph({ nodes: rawNodes, edges: rawEdges, onNodeClick, selectedNodeId }: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const dragRef = useRef<{ node: GraphNode | null; ox: number; oy: number }>({ node: null, ox: 0, oy: 0 });
  const hoverRef = useRef<{ node: GraphNode | null }>({ node: null });
  const sizeRef = useRef({ w: 800, h: 500 });
  const pointerDownRef = useRef<{ x: number; y: number; moved: boolean }>({ x: 0, y: 0, moved: false });

  const [, setTick] = useState(0);

  // Build initial node positions
  useEffect(() => {
    const w = sizeRef.current.w;
    const h = sizeRef.current.h;
    const centerX = w / 2;
    const centerY = h / 2;

    const gNodes: GraphNode[] = rawNodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / rawNodes.length;
      const radius = Math.min(w, h) * 0.3;
      return {
        id: n.id,
        name: n.name,
        type: n.type,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });

    const gEdges: GraphEdge[] = rawEdges.map((e) => ({
      source: typeof e.source === "number" ? e.source : (e.source as any).id ?? e.source,
      target: typeof e.target === "number" ? e.target : (e.target as any).id ?? e.target,
      type: e.type,
    }));

    nodesRef.current = gNodes;
    edgesRef.current = gEdges;
  }, [rawNodes, rawEdges]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(Math.max(300, rect.height));
    const prev = sizeRef.current;

    if (w <= 0 || h <= 0) return;
    if (prev.w === w && prev.h === h && canvas.width === w && canvas.height === h) return;

    const scaleX = prev.w > 0 ? w / prev.w : 1;
    const scaleY = prev.h > 0 ? h / prev.h : 1;
    if (Number.isFinite(scaleX) && Number.isFinite(scaleY)) {
      for (const node of nodesRef.current) {
        node.x *= scaleX;
        node.y *= scaleY;
      }
    }

    sizeRef.current = { w, h };
    canvas.width = w;
    canvas.height = h;
  }, []);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    resizeCanvas();

    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  const getNode = useCallback((id: number) => nodesRef.current.find((n) => n.id === id), []);

  const connectedEdges = useCallback((nodeId: number) => {
    return edgesRef.current.filter((e) => e.source === nodeId || e.target === nodeId);
  }, []);

  const connectedNodes = useCallback((nodeId: number) => {
    const ids = new Set<number>();
    for (const e of edgesRef.current) {
      if (e.source === nodeId) ids.add(e.target);
      if (e.target === nodeId) ids.add(e.source);
    }
    return ids;
  }, []);

  // Force simulation loop
  useEffect(() => {
    let running = true;
    const sim = () => {
      if (!running) return;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const w = sizeRef.current.w;
      const h = sizeRef.current.h;
      if (nodes.length === 0) return;

      const repulsion = 8000;
      const attraction = 0.005;
      const centerForce = 0.01;
      const damping = 0.85;
      const minDist = 30;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) dist = minDist;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const s = getNode(edge.source);
        const t = getNode(edge.target);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = dist * attraction;
        const fx = (dx / (dist || 1)) * force;
        const fy = (dy / (dist || 1)) * force;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      }

      // Center gravity + damping + position update
      for (const n of nodes) {
        if (dragRef.current.node === n) continue;
        n.vx += (w / 2 - n.x) * centerForce;
        n.vy += (h / 2 - n.y) * centerForce;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(10, Math.min(w - 10, n.x));
        n.y = Math.max(10, Math.min(h - 10, n.y));
      }

      // Render
      render(nodes, edges, w, h);

      animRef.current = requestAnimationFrame(sim);
    };

    animRef.current = requestAnimationFrame(sim);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [getNode]);

  function render(nodes: GraphNode[], edges: GraphEdge[], w: number, h: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    const selected = selectedNodeId;
    const selectedConn = selected ? connectedNodes(selected) : new Set<number>();
    const hovered = hoverRef.current.node;

    // Edges
    for (const edge of edges) {
      const s = getNode(edge.source);
      const t = getNode(edge.target);
      if (!s || !t) continue;

      const isConnected =
        selected !== null &&
        edge.source === selected || edge.target === selected;
      const isHovered =
        hovered &&
        (edge.source === hovered.id || edge.target === hovered.id);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isConnected || isHovered) {
        ctx.strokeStyle = isConnected ? "#2563eb" : "#6366f1";
        ctx.lineWidth = 2;
      } else if (selected) {
        ctx.strokeStyle = "rgba(156, 163, 175, 0.15)";
        ctx.lineWidth = 0.5;
      } else {
        ctx.strokeStyle = "rgba(156, 163, 175, 0.4)";
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Edge label (only if connected to selected or hovered)
      if (isConnected || isHovered) {
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(edge.type, mx, my - 4);
      }
    }

    // Nodes
    for (const n of nodes) {
      const isSelected = selected === n.id;
      const isConnected = selected !== null && selectedConn.has(n.id);
      const isHovered = hovered?.id === n.id;
      const radius = isSelected ? 10 : isConnected ? 8 : isHovered ? 8 : 6;

      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);

      if (isSelected) {
        ctx.fillStyle = "#2563eb";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
      } else if (isConnected) {
        ctx.fillStyle = "#6366f1";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
      } else if (isHovered) {
        ctx.fillStyle = getTypeColor(n.type);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
      } else if (selected) {
        ctx.fillStyle = "#d1d5db";
        ctx.strokeStyle = "transparent";
        ctx.lineWidth = 0;
      } else {
        ctx.fillStyle = getTypeColor(n.type);
        ctx.strokeStyle = "transparent";
        ctx.lineWidth = 0;
      }

      ctx.fill();
      if (isSelected || isConnected || isHovered) ctx.stroke();

      // Label (selected, hovered, or connected)
      if (isSelected || isHovered) {
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillStyle = "#1a1d23";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(n.name, n.x, n.y - radius - 4);
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(getTypeLabel(n.type), n.x, n.y - radius - 18);
      } else if (isConnected) {
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#374151";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(n.name, n.x, n.y - radius - 4);
      }
    }

    // Legend
    const legendY = h - 40;
    const typeKeys = Object.keys(TYPES).filter((k) => nodes.some((n) => n.type.toLowerCase() === k));
    let lx = 20;
    ctx.font = "10px Inter, sans-serif";
    for (const key of typeKeys) {
      const color = TYPES[key].color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx, legendY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(TYPES[key].label, lx + 10, legendY);
      lx += ctx.measureText(TYPES[key].label + "  ").width + 30;
    }
  }

  // Mouse events
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const findNode = useCallback((x: number, y: number) => {
    return nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return dx * dx + dy * dy < 400;
    }) ?? null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    pointerDownRef.current = { x: pos.x, y: pos.y, moved: false };
    const node = findNode(pos.x, pos.y);
    if (node) {
      dragRef.current = { node, ox: node.x - pos.x, oy: node.y - pos.y };
    }
  }, [getMousePos, findNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const drag = dragRef.current;
    if (
      !pointerDownRef.current.moved &&
      (Math.abs(pos.x - pointerDownRef.current.x) > 4 || Math.abs(pos.y - pointerDownRef.current.y) > 4)
    ) {
      pointerDownRef.current.moved = true;
    }
    if (drag.node) {
      drag.node.x = pos.x + drag.ox;
      drag.node.y = pos.y + drag.oy;
      return;
    }
    const node = findNode(pos.x, pos.y);
    if (node !== hoverRef.current.node) {
      hoverRef.current.node = node;
      setTick((t) => t + 1);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = node ? "pointer" : "default";
    }
  }, [getMousePos, findNode]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.node = null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pointerDownRef.current.moved) {
      pointerDownRef.current.moved = false;
      return;
    }
    const pos = getMousePos(e);
    const node = findNode(pos.x, pos.y);
    if (node && onNodeClick) {
      onNodeClick(node.id);
    }
  }, [getMousePos, findNode, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    />
  );
}

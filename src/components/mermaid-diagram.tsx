"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { v4 as uuidv4 } from "uuid";

export const MermaidDiagram = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    });

    const renderChart = async () => {
      try {
        const id = `mermaid-svg-${uuidv4().replace(/-/g, '')}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
      } catch (e) {
        console.error("Mermaid parsing failed", e);
        setSvgContent(`<div class="text-red-500 font-mono text-sm p-4 border border-red-500 rounded">Failed to render diagram</div>`);
      }
    };

    if (chart) {
      renderChart();
    }
  }, [chart, resolvedTheme]);

  if (!svgContent) {
    return <div className="animate-pulse bg-surface-2 rounded-lg h-32 w-full my-4"></div>;
  }

  return (
    <div
      className="my-6 overflow-x-auto bg-surface-1 p-4 rounded-xl border border-white/5 flex justify-center"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

"use client";

import { motion } from "framer-motion";
import useMousePosition from "@/hooks/useMousePosition";

export function GlobalCursor() {
  const { x, y } = useMousePosition();

  // If x and y are 0, we might be on SSR or mouse hasn't moved yet.
  if (x === 0 && y === 0) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-primary/50 pointer-events-none z-[9999] mix-blend-screen"
        animate={{
          x: x - 16,
          y: y - 16,
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.1,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-primary pointer-events-none z-[10000] shadow-glow-primary"
        animate={{
          x: x - 4,
          y: y - 4,
        }}
        transition={{
          type: "tween",
          ease: "backOut",
          duration: 0,
        }}
      />
      
      {/* Optional faint background glow that follows cursor */}
      <motion.div
        className="fixed top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none z-[0]"
        animate={{
          x: x - 128,
          y: y - 128,
        }}
        transition={{
          type: "tween",
          ease: "linear",
          duration: 0.2,
        }}
      />
    </>
  );
}

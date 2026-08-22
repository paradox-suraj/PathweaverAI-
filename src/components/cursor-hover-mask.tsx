"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import useMousePosition from "@/hooks/useMousePosition";

interface CursorHoverMaskProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  maskColor?: string;
}

export function CursorHoverMask({ frontContent, backContent, maskColor = "#8B5CF6" }: CursorHoverMaskProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y } = useMousePosition();
  const size = isHovered ? 400 : 40;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Mask Layer */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-black pointer-events-none z-20"
        style={{
          WebkitMaskImage: "url('/mask.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "40px",
          background: maskColor,
        }}
        animate={{
          WebkitMaskPosition: `${x - size / 2}px ${y - size / 2}px`,
          WebkitMaskSize: `${size}px`,
        } as any}
        transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
      >
        {/* We need pointer-events-auto on the elements inside the mask if they want to trigger hover state */}
        <div 
          className="w-full max-w-3xl px-sp-6 text-center flex flex-col items-center pointer-events-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {frontContent}
        </div>
      </motion.div>

      {/* Base Layer */}
      <div className="w-full max-w-3xl px-sp-6 text-center flex flex-col items-center relative z-10">
        {backContent}
      </div>
    </div>
  );
}

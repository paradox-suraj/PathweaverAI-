"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CloneCourseButton({ courseId, isOwner = false }: { courseId: string, isOwner?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClone = async () => {
    if (isOwner) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/clone`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.courseId) {
          router.push(`/courses/${data.courseId}`);
        }
      } else {
        const errData = await res.json();
        console.error("Failed to clone course", errData);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClone} 
      disabled={isLoading || isOwner} 
      className="bg-primary-gradient text-white hover:scale-105 transition-transform px-8"
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <Copy className="w-5 h-5 mr-2" />
      )}
      {isOwner ? "Already Owned" : isLoading ? "Cloning Course..." : "Clone & Start Learning"}
    </Button>
  );
}

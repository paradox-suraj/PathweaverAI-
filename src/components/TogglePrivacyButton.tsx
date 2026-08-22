"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleCoursePrivacy } from "@/server/actions/course";

export function TogglePrivacyButton({ courseId, initialIsPublic }: { courseId: string; initialIsPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newStatus = !isPublic;
      const res = await toggleCoursePrivacy(courseId, newStatus);
      if (res.success) {
        setIsPublic(newStatus);
        router.refresh();
      } else {
        console.error("Failed to toggle privacy");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={`border-white/10 ${isPublic ? 'text-primary' : 'text-neutral-400'}`}
    >
      {isPublic ? <Globe className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
      {isPublic ? "Public" : "Private"}
    </Button>
  );
}

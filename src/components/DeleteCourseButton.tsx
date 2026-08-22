"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCourse } from "@/server/actions/course";
import { useRouter } from "next/navigation";

export function DeleteCourseButton({ courseId }: { courseId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteCourse(courseId);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert("Failed to delete course: " + result.error);
        setIsDeleting(false);
      }
    } catch (e) {
      alert("An unexpected error occurred.");
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="lg" 
      className="w-full md:w-auto font-medium"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="w-5 h-5 mr-2" />
      {isDeleting ? "Deleting..." : "Delete Course"}
    </Button>
  );
}

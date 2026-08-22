"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Users, Search } from "lucide-react";
import { AnimatedContainer, AnimatedStatCard } from "@/components/dashboard-client";
import { CommunityCoursePublishedEvent } from "@/lib/events";

export function CommunityFeedClient({ initialCourses }: { initialCourses: any[] }) {
  const [courses, setCourses] = useState(initialCourses);

  useEffect(() => {
    const eventSource = new EventSource("/api/sse/community");
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "connected" && data.type !== "ping") {
        const newCourse = data as CommunityCoursePublishedEvent;
        // Prepend new course if it doesn't already exist
        setCourses(prev => {
          if (prev.some(c => c.id === newCourse.id)) return prev;
          return [newCourse, ...prev];
        });
      }
    };

    eventSource.onerror = () => {
      console.debug("SSE community feed disconnected, attempting native reconnect...");
      // Note: We do NOT call eventSource.close() here so the browser will automatically 
      // attempt to reconnect via its native retry logic.
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (courses.length === 0) {
    return (
      <div className="text-center py-24 glass-panel rounded-xl">
        <Search className="w-12 h-12 mx-auto text-surface-bright mb-4" />
        <h3 className="text-xl font-headline-md text-text-primary mb-2">No courses found</h3>
        <p className="text-text-secondary">Be the first to publish a course to the community!</p>
      </div>
    );
  }

  return (
    <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
      {courses.map((course) => (
        <Link key={course.id} href={`/community/${course.id}`}>
          <AnimatedStatCard className="h-full flex flex-col justify-between group cursor-pointer hover:border-primary/50 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="font-headline-md text-headline-md text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
              </div>
              <p className="font-body-sm text-body-sm text-text-secondary line-clamp-3 mb-6">
                {course.description}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {course.user.image ? (
                  <Image src={course.user.image} alt={course.user.name || "User"} width={24} height={24} className="w-6 h-6 rounded-full" loading="lazy" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] text-text-muted font-label-mono">
                    {course.user.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="font-label-mono text-xs text-text-muted">by {course.user.name}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-border pt-4">
                <div className="flex items-center text-accent-amber font-label-mono text-xs">
                  <Star className="w-4 h-4 mr-1 fill-accent-amber" />
                  {course.rating > 0 ? course.rating.toFixed(1) : "New"}
                  <span className="text-text-muted ml-1">({course.ratingCount})</span>
                </div>
                <div className="flex items-center text-primary font-label-mono text-xs">
                  <Users className="w-4 h-4 mr-1" />
                  {course.enrollmentCount}
                </div>
              </div>
            </div>
          </AnimatedStatCard>
        </Link>
      ))}
    </AnimatedContainer>
  );
}

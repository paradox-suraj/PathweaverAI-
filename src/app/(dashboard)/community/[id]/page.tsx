import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { courseService } from "@/server/services/course.service";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Users, BookOpen, Clock } from "lucide-react";
import { AnimatedContainer, AnimatedStatCard } from "@/components/dashboard-client";
import { CloneCourseButton } from "@/components/CloneCourseButton";
import { ReportCourseButton } from "@/components/ReportCourseButton";
import { CourseReviewSection } from "@/components/CourseReviewSection";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await courseService.getCommunityCourseDetails(id);
  if (!course) return { title: "Course Not Found | PathWeaver AI Community" };
  return { title: `${course.title} | PathWeaver AI Community` };
}

export default async function CommunityCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;
  const course = await courseService.getCommunityCourseDetails(id);
  if (!course) {
    redirect("/community");
  }

  let canReview = false;
  if (session?.user?.id && course.userId !== session.user.id) {
    const takenCourse = await prisma.course.findFirst({
      where: { userId: session.user.id, clonedFromId: course.id }
    });
    canReview = !!takenCourse;
  }

  const totalTopics = course.modules.reduce((acc, mod) => acc + mod.topics.length, 0);
  const totalMins = course.modules.reduce(
    (acc, mod) => acc + mod.topics.reduce((tAcc, top) => tAcc + top.estimatedMins, 0),
    0
  );
  const hours = Math.floor(totalMins / 60);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/community"
          className="inline-flex items-center text-sm font-label-mono text-text-secondary hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {course.title}
        </h1>
        <p className="text-text-secondary mt-4 text-lg leading-relaxed">
          {course.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            {course.user.image ? (
              <Image src={course.user.image} alt={course.user.name || "User"} width={32} height={32} className="w-8 h-8 rounded-full" loading="lazy" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-xs text-text-muted font-label-mono">
                {course.user.name?.charAt(0) || "U"}
              </div>
            )}
            <span className="font-label-mono text-sm text-text-primary">by {course.user.name}</span>
          </div>
          
          <div className="flex items-center text-accent-amber font-label-mono text-sm">
            <Star className="w-5 h-5 mr-1 fill-accent-amber" />
            {course.rating > 0 ? course.rating.toFixed(1) : "New"}
            <span className="text-text-muted ml-1">({course.ratingCount} reviews)</span>
          </div>
          
          <div className="flex items-center text-primary font-label-mono text-sm">
            <Users className="w-5 h-5 mr-1" />
            {course.enrollmentCount} learners
          </div>
        </div>
      </div>

      {/* Action Card */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-primary/20">
        <div className="flex gap-8">
          <div className="flex items-center gap-2 text-text-primary">
            <BookOpen className="w-5 h-5 text-secondary" />
            <span className="font-label-mono">{totalTopics} Lessons</span>
          </div>
          <div className="flex items-center gap-2 text-text-primary">
            <Clock className="w-5 h-5 text-info" />
            <span className="font-label-mono">~{hours > 0 ? `${hours}h ` : ""}{totalMins % 60}m</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ReportCourseButton courseId={course.id} isOwner={course.userId === session?.user?.id} />
          <CloneCourseButton courseId={course.id} isOwner={course.userId === session?.user?.id} />
        </div>
      </div>

      {/* Curriculum Preview */}
      <div className="space-y-6">
        <h2 className="text-2xl font-headline-md text-text-primary">Curriculum Preview</h2>
        
        <div className="space-y-4">
          {course.modules.map((module, mIdx) => (
            <div key={module.id} className="glass-panel p-6">
              <h3 className="font-headline-md text-lg text-text-primary mb-4">
                Module {mIdx + 1}: {module.title}
              </h3>
              <div className="space-y-3">
                {module.topics.map((topic, tIdx) => (
                  <div key={topic.id} className="flex gap-4 items-start p-3 rounded-lg bg-surface-1/50 border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="font-label-mono text-xs text-text-muted">{tIdx + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-body-base text-text-primary font-medium">{topic.title}</h4>
                      {topic.description && (
                        <p className="font-body-sm text-text-muted mt-1">{topic.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CourseReviewSection 
        courseId={course.id} 
        reviews={course.courseReviews} 
        canReview={canReview} 
      />
    </div>
  );
}

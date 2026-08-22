import { prisma } from "@/lib/prisma";
import { aiService } from "./ai.service";
import { searchYouTubeVideo, fetchVideoTranscript } from "./youtube";
import { scheduleService } from "./schedule.service";
import { emitCommunityCourse } from "@/lib/events";
import { redis } from "@/lib/redis";
import * as cheerio from "cheerio";

export class CourseService {
  async getCourseWithTopics(courseId: string, userId: string) {
    return prisma.course.findUnique({
      where: {
        id: courseId,
        userId: userId,
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              include: {
                resources: {
                  include: {
                    videoResource: true,
                    articleResource: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getAllCoursesForUser(userId: string) {
    return prisma.course.findMany({
      where: { userId: userId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              include: {
                resources: {
                  include: {
                    videoResource: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getTopicWithCourse(topicId: string, userId: string) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        resources: {
          include: {
            videoResource: true,
          },
        },
      },
    });

    // Enforce ownership
    if (!topic || topic.module.course.userId !== userId) {
      return null;
    }

    return topic;
  }

  async createInitialCourse(userId: string, topic: string, isPublic: boolean = true) {
    return prisma.course.create({
      data: {
        title: `Generating course on ${topic}...`,
        description: "",
        promptGoal: topic,
        userId: userId,
        status: "GENERATING",
        isPublic: isPublic,
      },
    });
  }

  async populateCourseFromAI(courseId: string, userId: string, topic: string, level: string, hoursPerDay: number, deadlineDate?: string, sourceType?: string, sourceContent?: string) {
    const updateStatus = async (msg: string) => {
      await prisma.course.update({ where: { id: courseId }, data: { statusMessage: msg } }).catch(() => {});
    };

    try {
      let finalContext = "";
      if (sourceType === "url" && sourceContent) {
        await updateStatus("Fetching source material from URL...");
        try {
          const res = await fetch(sourceContent);
          const html = await res.text();
          const $ = cheerio.load(html);
          finalContext = $("body").text().replace(/\s+/g, " ").trim().substring(0, 30000); // limit to 30k chars
        } catch (e) {
          console.error("Failed to fetch URL", e);
        }
      } else if ((sourceType === "pdf" || sourceType === "text") && sourceContent) {
        finalContext = sourceContent.substring(0, 30000); // limit to 30k chars
      }

      await updateStatus("Analyzing your preferences & Mapping knowledge nodes...");
      const curriculum = await aiService.generateCurriculum(topic, level, hoursPerDay, finalContext, userId);

      await updateStatus("Sourcing premium resources...");

      // Pre-fetch all YouTube videos OUTSIDE the transaction to avoid holding
      // the DB connection open during network I/O
      const modulesWithVideos = await Promise.all(
        curriculum.modules.map(async (mod) => ({
          ...mod,
          lessons: await Promise.all(
            mod.lessons.map(async (lesson) => {
              let videoResult = null;
              try {
                videoResult = await searchYouTubeVideo(lesson.searchQuery, lesson.title);
              } catch (e) {
                console.error(`Failed to fetch video for lesson: ${lesson.title}`, e);
              }
              return {
                ...lesson,
                videoResult,
              };
            })
          ),
        }))
      );

      const transactionPromise = prisma.$transaction(async (tx) => {
        await tx.course.update({
          where: { id: courseId },
          data: {
            title: curriculum.title,
            description: curriculum.description,
            // Keep as GENERATING until everything is fully complete
          },
        });

        for (const mod of modulesWithVideos) {
          const createdModule = await tx.courseModule.create({
            data: {
              title: mod.title,
              order: mod.order,
              courseId: courseId,
            },
          });

          for (const lesson of mod.lessons) {
            let finalEstimatedMins = lesson.estimatedMins;
            if (lesson.videoResult?.durationSeconds) {
              // Actual video length in minutes + 10 mins buffer for deep dive/quiz
              finalEstimatedMins = Math.ceil(lesson.videoResult.durationSeconds / 60) + 10;
            }

            const createdTopic = await tx.topic.create({
              data: {
                title: lesson.title,
                description: lesson.description,
                estimatedMins: finalEstimatedMins,
                order: 0,
                moduleId: createdModule.id,
              },
            });
            
            if (lesson.videoResult) {
              const resource = await tx.learningResource.create({
                data: {
                  title: lesson.title,
                  type: "VIDEO",
                  topicId: createdTopic.id,
                }
              });
              
              await tx.videoResource.create({
                data: {
                  learningResourceId: resource.id,
                  youtubeVideoId: lesson.videoResult.videoId,
                  durationSeconds: lesson.videoResult.durationSeconds,
                  thumbnailUrl: lesson.videoResult.thumbnailUrl,
                  channelName: lesson.videoResult.channelName
                }
              });
            }
          }
        }
      }, {
        maxWait: 10000,
        timeout: 30000,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database transaction timed out")), 35000)
      );

      await Promise.race([transactionPromise, timeoutPromise]);

      console.log(`Successfully generated and saved course: ${courseId}`);

      await updateStatus("Finalizing your curriculum & Study Plan...");
      // Generate Study Plan and tasks
      try {
        await scheduleService.generateStudyPlan(courseId, userId, hoursPerDay, deadlineDate);
        console.log(`Successfully generated study plan for course: ${courseId}`);
      } catch (scheduleError) {
        console.error("Failed to generate study plan:", scheduleError);
      }

      // Generate AI Deep Dive Articles for each topic
      console.log(`Generating AI Deep Dive Articles for course: ${courseId}`);
      await updateStatus("Generating AI Deep Dive Articles...");
      const courseWithTopics = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            include: { 
              topics: {
                include: {
                  resources: {
                    include: { videoResource: true }
                  }
                }
              }
            }
          }
        }
      });

      if (courseWithTopics) {
        const allTopics = courseWithTopics.modules.flatMap(mod => mod.topics);
        
        // Execute all Deep Dive generations concurrently across the Multi-API Key pool
        await Promise.all(allTopics.map(async (topic) => {
          try {
            let transcript = undefined;
            const videoResource = topic.resources?.find((r: any) => r.type === "VIDEO")?.videoResource;
            if (videoResource?.youtubeVideoId) {
              const fetched = await fetchVideoTranscript(videoResource.youtubeVideoId);
              if (fetched && fetched.length > 0) {
                transcript = fetched;
              }
            }
            const articleContent = await aiService.generateArticle(topic.title, topic.description || "", userId, transcript);
            
            const articleResource = await prisma.learningResource.create({
              data: {
                title: `${topic.title} - Deep Dive`,
                type: "ARTICLE",
                topicId: topic.id,
              }
            });

            await prisma.articleResource.create({
              data: {
                learningResourceId: articleResource.id,
                content: articleContent,
              }
            });
            console.log(`Generated article for topic: ${topic.title}`);
          } catch (articleError) {
            console.error(`Failed to generate article for topic: ${topic.title}`, articleError);
          }
        }));
      }

      // Finally, set to ACTIVE
      await prisma.course.update({
        where: { id: courseId },
        data: { status: "ACTIVE", statusMessage: "Curriculum Ready. Redirecting..." },
      });

    } catch (error) {
      console.error("Background generation failed:", error);
      await prisma.course.update({
        where: { id: courseId },
        data: { status: "FAILED", statusMessage: "Generation failed. Please try again." },
      }).catch(()=>{});
      throw error;
    }
  }

  async generateMissingArticle(topicId: string, userId: string) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    });

    if (!topic || topic.module.course.userId !== userId) {
      throw new Error("Topic not found or unauthorized");
    }

    // Check if it already has an article with content
    const existing = await prisma.learningResource.findFirst({
      where: { topicId, type: "ARTICLE" },
      include: { articleResource: true }
    });

    if (existing?.articleResource?.content) {
      return { success: true };
    }

    console.log(`Generating missing article for topic: ${topic.title}`);
    
    // Check if there is a video resource to fetch the transcript
    const videoResource = await prisma.learningResource.findFirst({
      where: { topicId, type: "VIDEO" },
      include: { videoResource: true }
    });
    
    let transcript: string | undefined = undefined;
    if (videoResource?.videoResource?.youtubeVideoId) {
      const fetched = await fetchVideoTranscript(videoResource.videoResource.youtubeVideoId);
      if (fetched) transcript = fetched;
    }

    const content = await aiService.generateArticle(topic.title, topic.description || "", userId, transcript);

    if (!existing) {
      const resource = await prisma.learningResource.create({
        data: { title: `${topic.title} - Deep Dive`, type: "ARTICLE", topicId }
      });
      await prisma.articleResource.create({
        data: { learningResourceId: resource.id, content }
      });
    } else {
      if (!existing.articleResource) {
        await prisma.articleResource.create({
          data: { learningResourceId: existing.id, content }
        });
      } else {
        await prisma.articleResource.update({
          where: { learningResourceId: existing.id },
          data: { content }
        });
      }
    }

    return { success: true };
  }

  // --- COMMUNITY & SOCIAL LEARNING ---

  async publishCourse(courseId: string, userId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
    });
    if (!course || course.status !== "ACTIVE") throw new Error("Course not eligible for publishing");

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
      include: {
        user: { select: { name: true, image: true } }
      }
    });

    emitCommunityCourse({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      rating: updated.rating,
      ratingCount: updated.ratingCount,
      enrollmentCount: updated.enrollmentCount,
      user: {
        name: updated.user.name,
        image: updated.user.image,
      }
    });

    // Invalidate Redis caches for community feeds
    try {
      const keys = await redis.keys("community:courses:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.warn("Failed to invalidate Redis cache:", e);
    }

    return updated;
  }

  async getCommunityCourses(sortBy: 'trending' | 'topRated' = 'trending', query?: string) {
    const q = query ? query.trim().toLowerCase() : "";
    const redisKey = `community:courses:${sortBy}:${q}`;

    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        console.log(`Redis Cache Hit for community feed: ${redisKey}`);
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Redis community cache check failed:", e);
    }

    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        isPublic: true,
        ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
      },
      include: {
        user: {
          select: { name: true, image: true }
        },
        _count: {
          select: { modules: true, courseReviews: true }
        }
      },
      orderBy: sortBy === 'trending' ? { enrollmentCount: 'desc' } : { rating: 'desc' },
      take: 20,
    });

    // Cache the result for 5 minutes
    try {
      await redis.setex(redisKey, 300, JSON.stringify(courses));
    } catch (e) {
      console.warn("Failed to set Redis cache for community feed:", e);
    }

    return courses;
  }

  async getCommunityCourseDetails(courseId: string) {
    return prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      include: {
        user: { select: { name: true, image: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
            }
          }
        },
        courseReviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });
  }

  async cloneCourse(originalCourseId: string, newUserId: string) {
    const original = await prisma.course.findFirst({
      where: { id: originalCourseId, isPublished: true },
      include: {
        modules: {
          include: {
            topics: {
              include: {
                resources: {
                  include: {
                    videoResource: true,
                    articleResource: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!original) throw new Error("Course not found or not published");
    if (original.userId === newUserId) throw new Error("Cannot clone your own course");

    // Check if already cloned
    const existingClone = await prisma.course.findFirst({
      where: { userId: newUserId, clonedFromId: original.id }
    });
    if (existingClone) return existingClone;

    // Use transaction to clone everything
    const clonedCourse = await prisma.$transaction(async (tx) => {
      // 1. Create new Course
      const newCourse = await tx.course.create({
        data: {
          userId: newUserId,
          title: original.title,
          description: original.description,
          status: "ACTIVE",
          statusMessage: "Cloned from Community",
          clonedFromId: original.id,
        }
      });

      // 2. Clone modules, topics, resources
      for (const mod of original.modules) {
        const newMod = await tx.courseModule.create({
          data: { courseId: newCourse.id, title: mod.title, order: mod.order }
        });
        
        for (const topic of mod.topics) {
          const newTopic = await tx.topic.create({
            data: {
              moduleId: newMod.id,
              title: topic.title,
              description: topic.description,
              order: topic.order,
              estimatedMins: topic.estimatedMins
            }
          });

          for (const res of topic.resources) {
            const newRes = await tx.learningResource.create({
              data: { topicId: newTopic.id, type: res.type, title: res.title }
            });

            if (res.videoResource) {
              await tx.videoResource.create({
                data: {
                  learningResourceId: newRes.id,
                  youtubeVideoId: res.videoResource.youtubeVideoId,
                  durationSeconds: res.videoResource.durationSeconds,
                  thumbnailUrl: res.videoResource.thumbnailUrl,
                  channelName: res.videoResource.channelName,
                }
              });
            }
            if (res.articleResource) {
              await tx.articleResource.create({
                data: {
                  learningResourceId: newRes.id,
                  content: res.articleResource.content,
                }
              });
            }
          }
        }
      }

      // 3. Increment enrollment count on original course
      await tx.course.update({
        where: { id: original.id },
        data: { enrollmentCount: { increment: 1 } }
      });
      
      // Award Gamification XP to publisher
      const originalUserId = original.userId;
      const stat = await tx.userStat.findUnique({ where: { userId: originalUserId } });
      if (stat) {
        await tx.userStat.update({
          where: { userId: originalUserId },
          data: { xp: { increment: 50 } }
        });
      } else {
         await tx.userStat.create({
            data: { userId: originalUserId, xp: 50 }
         });
      }

      return newCourse;
    }, {
      timeout: 20000,
    });

    // 3. Generate Study Plan (runs after transaction commits so the course exists)
    await scheduleService.generateStudyPlan(clonedCourse.id, newUserId, 2);

    return clonedCourse;
  }

  async rateCourse(courseId: string, userId: string, rating: number, reviewText?: string) {
    if (rating < 1 || rating > 5) throw new Error("Invalid rating");
    
    // Check if user has cloned it or taken it
    const hasTaken = await prisma.course.findFirst({
      where: { userId, clonedFromId: courseId }
    });
    const originalCourse = await prisma.course.findUnique({ where: { id: courseId }});

    if (!hasTaken && originalCourse?.userId !== userId) {
      throw new Error("You must take the course before reviewing it");
    }

    return prisma.$transaction(async (tx) => {
      await tx.courseReview.upsert({
        where: { courseId_userId: { courseId, userId } },
        create: { courseId, userId, rating, review: reviewText },
        update: { rating, review: reviewText },
      });

      const allReviews = await tx.courseReview.findMany({
        where: { courseId },
        select: { rating: true }
      });
      const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

      return tx.course.update({
        where: { id: courseId },
        data: { rating: avg, ratingCount: allReviews.length }
      });
    });
  }
}

export const courseService = new CourseService();

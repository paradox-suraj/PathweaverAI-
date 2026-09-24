import { prisma } from "@/lib/prisma";
import { aiService } from "./ai.service";
import { searchYouTubeVideo, fetchVideoTranscript, fetchPlaylistVideos, truncateTranscriptSmart, PlaylistVideo } from "./youtube";
import { gatherAndPreFilterCandidates, VideoCandidate } from "./video-filter.service";
import { scoreAndRankCandidates } from "./video-scorer.service";
import { fetchAndFilterTranscript } from "./transcript-filter.service";
import { aiEvaluatorService } from "./ai-evaluator.service";
import { TOP_CANDIDATES_FOR_TRANSCRIPT } from "../config/generation.config";
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
                    codeResource: true,
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
      // Playlist videos fetched upfront for matching later
      let playlistVideos: PlaylistVideo[] = [];

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
      } else if (sourceType === "playlist" && sourceContent) {
        await updateStatus("Fetching YouTube playlist metadata...");
        playlistVideos = await fetchPlaylistVideos(sourceContent);

        if (playlistVideos.length > 0) {
          // Build a compact context from video titles + descriptions (no transcripts = zero token cost)
          const videoListText = playlistVideos
            .map(
              (v, i) =>
                `Video ${i + 1}: "${v.title}"\n${v.description ? `Description: ${v.description.substring(0, 200)}` : ""}`
            )
            .join("\n\n");
          finalContext =
            `This course is based on the following YouTube playlist of ${playlistVideos.length} videos. ` +
            `Structure the curriculum to follow the playlist's natural progression. Map each module/lesson to the corresponding video(s) in order:\n\n` +
            videoListText.substring(0, 30000);
        } else {
          console.warn("[Playlist] No videos found — falling back to prompt-only generation.");
        }
      }

      await updateStatus("Analyzing your preferences & Mapping knowledge nodes...");
      const curriculum = await aiService.generateCurriculum(topic, level, hoursPerDay, finalContext, userId);

      await updateStatus("Sourcing premium resources...");

      // Helper: fuzzy-match a lesson title against playlist videos by word overlap
      const matchPlaylistVideo = (lessonTitle: string): PlaylistVideo | null => {
        if (playlistVideos.length === 0) return null;
        const targetWords = lessonTitle
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2);
        let bestMatch: PlaylistVideo | null = null;
        let highestScore = -1;
        for (const video of playlistVideos) {
          const videoTitleLower = video.title.toLowerCase();
          let score = 0;
          for (const word of targetWords) {
            if (videoTitleLower.includes(word)) score++;
          }
          if (score > highestScore) {
            highestScore = score;
            bestMatch = video;
          }
        }
        // Require at least 1 matching word to consider it a real match
        return highestScore >= 1 ? bestMatch : null;
      };

      // ── Pass 1 (parallel): Candidate discovery fan-out for every LESSON
      // Runs concurrently — the expensive YouTube network I/O.
      // Playlist-matched lessons are resolved immediately.
      const modulesWithCandidates = await Promise.all(
        curriculum.modules.map(async (mod) => ({
          ...mod,
          lessons: await Promise.all(
            mod.lessons.map(async (lesson) => {
              let playlistVideoResult: { videoId: string; durationSeconds?: number; thumbnailUrl?: string; channelName?: string; } | null = null;
              let phaseCandidates: VideoCandidate[] = [];
              let alternateQuery: typeof lesson.searchQueries[0] | undefined = undefined;

              if (lesson.type === 'STANDARD' || lesson.type === 'REVIEW' || lesson.type === 'PROJECT') {
                try {
                  const playlistMatch = matchPlaylistVideo(lesson.title);
                  if (playlistMatch) {
                    playlistVideoResult = {
                      videoId: playlistMatch.videoId,
                      durationSeconds: playlistMatch.durationSeconds,
                      thumbnailUrl: playlistMatch.thumbnailUrl,
                      channelName: playlistMatch.channelName,
                    };
                    // Hold back the last query for the alternate search strategy fallback
                    const queries = lesson.searchQueries ?? [];
                    let initialQueries = queries;
                    if (queries.length > 1) {
                      alternateQuery = queries[queries.length - 1];
                      initialQueries = queries.slice(0, queries.length - 1);
                    }

                    // Multi-candidate discovery + metadata pre-filtering
                    const filterResult = await gatherAndPreFilterCandidates(
                      initialQueries,
                      lesson.title,
                      lesson.estimatedMins,
                      lesson.isVolatileTopic ?? false,
                      lesson.searchQuery
                    );
                    phaseCandidates = filterResult.survivors;
                  }
                } catch (e) {
                  console.error(`[VideoDiscovery] Failed for lesson: ${lesson.title}`, e);
                }
              }

              return { lesson, playlistVideoResult, phaseCandidates, alternateQuery };
            })
          ),
        }))
      );

      // ── Pass 2 (sequential): Multi-factor scoring + transcript verification
      // Sequential so usedChannelIds accurately reflects previous picks,
      // and we don't spam the YouTube API with concurrent transcript requests.
      const usedChannelIds = new Set<string>();

      const modulesWithVideos: any[] = [];
      for (const mod of modulesWithCandidates) {
        const lessons = [];
        for (const { lesson, playlistVideoResult, phaseCandidates, alternateQuery } of mod.lessons) {
          let videoResult: { videoId: string; durationSeconds?: number; thumbnailUrl?: string; channelName?: string; } | null = null;

          if (playlistVideoResult) {
            // Playlist match — skip scoring
            videoResult = playlistVideoResult;
          } else if (phaseCandidates.length > 0) {
            
            // Process candidate batch through ranking, transcript verification, and pedagogical evaluation
            const processCandidates = async (candidatesToProcess: VideoCandidate[]) => {
              const ranked = scoreAndRankCandidates(candidatesToProcess, {
                lessonTitle: lesson.title,
                objectives: lesson.objectives ?? [],
                keyConcepts: lesson.keyConcepts ?? [],
                estimatedMins: lesson.estimatedMins,
                isVolatileTopic: lesson.isVolatileTopic ?? false,
                usedChannelIds,
              });

              // Transcript Quality Verification
              const topCandidates = ranked.slice(0, TOP_CANDIDATES_FOR_TRANSCRIPT);
              for (const candidate of topCandidates) {
                const transcriptResult = await fetchAndFilterTranscript(
                  candidate.videoId,
                  candidate.durationSeconds
                );

                if (transcriptResult) {
                  // Structured pedagogical evaluation
                  const evaluation = await aiEvaluatorService.evaluateTranscript({
                    lessonTitle: lesson.title,
                    lessonDescription: lesson.description,
                    objectives: lesson.objectives ?? [],
                    keyConcepts: lesson.keyConcepts ?? [],
                    learnerLevel: level,
                    practicalOutcome: lesson.practicalOutcome ?? "",
                    transcript: transcriptResult.transcript,
                    videoTitle: candidate.title,
                  }, userId);

                  if (aiEvaluatorService.passesHardGates(evaluation)) {
                    return {
                      videoId: candidate.videoId,
                      durationSeconds: candidate.durationSeconds,
                      thumbnailUrl: candidate.thumbnailUrl,
                      channelName: candidate.channelName,
                      candidate // so we can extract channelId later
                    };
                  }
                  console.log(`[CurriculumEvaluator] Candidate ${candidate.videoId} unaccepted for lesson "${lesson.title}". Recommendation: ${evaluation.recommendation}`);
                }
              }
              return null;
            };

            const initialWinner = await processCandidates(phaseCandidates);
            
            if (initialWinner) {
              usedChannelIds.add(initialWinner.candidate.channelId);
              videoResult = {
                videoId: initialWinner.videoId,
                durationSeconds: initialWinner.durationSeconds,
                thumbnailUrl: initialWinner.thumbnailUrl,
                channelName: initialWinner.channelName,
              };
            } else if (alternateQuery) {
              console.log(`[CurriculumEvaluator] Initial candidates unaccepted for "${lesson.title}". Triggering alternate search strategy.`);
              try {
                const fallbackResult = await gatherAndPreFilterCandidates(
                  [alternateQuery],
                  lesson.title,
                  lesson.estimatedMins,
                  lesson.isVolatileTopic ?? false,
                  lesson.searchQuery
                );
                
                if (fallbackResult.survivors.length > 0) {
                  const fallbackWinner = await processCandidates(fallbackResult.survivors);
                  if (fallbackWinner) {
                    usedChannelIds.add(fallbackWinner.candidate.channelId);
                    videoResult = {
                      videoId: fallbackWinner.videoId,
                      durationSeconds: fallbackWinner.durationSeconds,
                      thumbnailUrl: fallbackWinner.thumbnailUrl,
                      channelName: fallbackWinner.channelName,
                    };
                    console.log(`[CurriculumEvaluator] Alternate search strategy succeeded! Found video ${fallbackWinner.videoId}`);
                  } else {
                    console.warn(`[CurriculumEvaluator] Alternate search strategy also failed for "${lesson.title}".`);
                  }
                }
              } catch (e) {
                console.error(`[CurriculumEvaluator] Alternate search strategy error:`, e);
              }
            }
          }
          // If no candidates survived and no playlist match, videoResult stays null
          // → lesson gets no video resource (learner reads article only)

          lessons.push({ ...lesson, videoResult });
        }
        modulesWithVideos.push({ ...mod, lessons });
      }

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
                type: lesson.type,
                // Persist structured lesson metadata
                objectives:       lesson.objectives?.length       ? JSON.stringify(lesson.objectives)    : null,
                prerequisites:    lesson.prerequisites?.length    ? JSON.stringify(lesson.prerequisites) : null,
                keyConcepts:      lesson.keyConcepts?.length      ? JSON.stringify(lesson.keyConcepts)   : null,
                practicalOutcome: lesson.practicalOutcome         || null,
                assessmentIntent: lesson.assessmentIntent         || null,
                isVolatileTopic:  lesson.isVolatileTopic          ?? false,
                searchQueries:    lesson.searchQueries?.length    ? JSON.stringify(lesson.searchQueries) : null,
              },
            });
            
            if (lesson.type === 'CODE_CHALLENGE') {
              const resource = await tx.learningResource.create({
                data: {
                  title: lesson.title,
                  type: "CODE",
                  topicId: createdTopic.id,
                }
              });
              
              await tx.codeResource.create({
                data: {
                  learningResourceId: resource.id,
                  language: lesson.codeLanguage || "javascript",
                  initialCode: "// Write your code here\n",
                  instructions: lesson.description
                }
              });
            } else if (lesson.type === 'MODULE_QUIZ') {
              await tx.learningResource.create({
                data: {
                  title: lesson.title,
                  type: "QUIZ",
                  topicId: createdTopic.id,
                }
              });
            } else if (lesson.videoResult) {
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
                    include: { videoResource: true, articleResource: true, codeResource: true }
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
        await Promise.all(allTopics.map(async (topic, index) => {
          try {
            let transcript = undefined;
            const videoItem = topic.resources?.find((r: any) => r.type === "VIDEO");
            const videoResource = videoItem?.videoResource;
            
            if (videoResource?.youtubeVideoId) {
              const fetched = await fetchVideoTranscript(videoResource.youtubeVideoId);
              if (fetched) {
                // Long-video guard: cap transcripts from videos longer than 30 minutes
                const isLongVideo = (videoResource.durationSeconds ?? 0) > 1800;
                transcript = isLongVideo ? truncateTranscriptSmart(fetched) : fetched;
              }
            }

            const previousTopic = index > 0 ? allTopics[index - 1] : undefined;
            const nextTopic = index < allTopics.length - 1 ? allTopics[index + 1] : undefined;

            const articleParams = {
              topicTitle: topic.title,
              topicDescription: topic.description || "",
              lessonType: topic.type || "STANDARD",
              learnerLevel: level,
              objectives: topic.objectives ? JSON.parse(topic.objectives) : [],
              keyConcepts: topic.keyConcepts ? JSON.parse(topic.keyConcepts) : [],
              prerequisites: topic.prerequisites ? JSON.parse(topic.prerequisites) : [],
              practicalOutcome: topic.practicalOutcome || undefined,
              videoTranscript: transcript,
              videoMetadata: videoResource ? { 
                title: videoItem?.title || topic.title, 
                channelName: videoResource.channelName || ""
              } : undefined,
              previousTopicTitle: previousTopic?.title,
              nextTopicTitle: nextTopic?.title,
            };

            let articleContent = await aiService.generateArticle(articleParams, userId);

            // Lesson-Level Quality Validation
            if (articleParams.objectives.length > 0) {
              try {
                const evalResult = await aiEvaluatorService.evaluateArticleCoverage(
                  articleContent,
                  articleParams.objectives,
                  topic.title,
                  userId
                );

                if (!evalResult.approved) {
                  console.log(`[QualityValidation] Article coverage check failed for "${topic.title}". Retrying with missing objectives...`);
                  // Retry once
                  articleContent = await aiService.generateArticle({
                    ...articleParams,
                    missingObjectivesToFix: evalResult.missingObjectives,
                  }, userId);

                  const retryEval = await aiEvaluatorService.evaluateArticleCoverage(
                    articleContent,
                    articleParams.objectives,
                    topic.title,
                    userId
                  );

                  if (!retryEval.approved) {
                    console.log(`[QualityValidation] Article retry check failed. Flagging topic ${topic.id} for remediation.`);
                    await prisma.topic.update({
                      where: { id: topic.id },
                      data: { qualityFlagged: true }
                    });
                  } else {
                    console.log(`[QualityValidation] Article retry passed validation for "${topic.title}".`);
                  }
                } else {
                  console.log(`[QualityValidation] Article passed validation for "${topic.title}".`);
                }
              } catch (evalError) {
                console.error(`[QualityValidation] Lesson evaluation failed for ${topic.title}:`, evalError);
              }
            }
            
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

      // Course-Level Curriculum Evaluation
      try {
        console.log(`[CurriculumEvaluator] Running comprehensive curriculum evaluation for course ${courseId}...`);
        
        // Fetch full course data to pass to evaluator
        const fullCourse = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            modules: {
              include: {
                topics: {
                  include: {
                    resources: {
                      include: { articleResource: true, videoResource: true }
                    }
                  }
                }
              }
            }
          }
        });
        
        if (fullCourse) {
          const courseEval = await aiEvaluatorService.evaluateFullCourse(fullCourse, userId);
          if (!courseEval.approved && courseEval.recommendedFixes.length > 0) {
             console.log(`[CurriculumEvaluator] Flagged ${courseEval.recommendedFixes.length} topics for targeted remediation.`);
             for (const fix of courseEval.recommendedFixes) {
               await prisma.topic.update({
                 where: { id: fix.topicId },
                 data: { qualityFlagged: true }
               });
             }
          } else {
             console.log(`[CurriculumEvaluator] Course evaluator approved curriculum structure.`);
          }
        }
      } catch (evalError) {
        console.error(`[CurriculumEvaluator] Failed to run course-level evaluator:`, evalError);
      }
      
      // Targeted Remediation Pass
      try {
        const flaggedTopics = await prisma.topic.findMany({
          where: { moduleId: { in: courseWithTopics?.modules.map(m => m.id) || [] }, qualityFlagged: true }
        });
        
        if (flaggedTopics.length > 0) {
          console.log(`[CurriculumEvaluator] Starting targeted remediation pass for ${flaggedTopics.length} flagged topics...`);
          for (const flaggedTopic of flaggedTopics) {
            await this.regenerateArticleForTopic(flaggedTopic.id, userId);
            await prisma.topic.update({
              where: { id: flaggedTopic.id },
              data: { qualityFlagged: false }
            });
          }
        }
      } catch (regenError) {
         console.error(`[CurriculumEvaluator] Failed targeted remediation pass:`, regenError);
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

  async regenerateArticleForTopic(topicId: string, userId: string) {
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

    const existing = await prisma.learningResource.findFirst({
      where: { topicId, type: "ARTICLE" },
      include: { articleResource: true }
    });

    console.log(`Regenerating article for topic: ${topic.title}`);
    
    // Check if there is a video resource to fetch the transcript
    const videoResource = await prisma.learningResource.findFirst({
      where: { topicId, type: "VIDEO" },
      include: { videoResource: true }
    });
    
    let transcript: string | undefined = undefined;
    if (videoResource?.videoResource?.youtubeVideoId) {
      const fetched = await fetchVideoTranscript(videoResource.videoResource.youtubeVideoId);
      if (fetched) {
        // Long-video guard: cap transcripts from videos longer than 30 minutes
        const isLongVideo = (videoResource.videoResource.durationSeconds ?? 0) > 1800;
        transcript = isLongVideo ? truncateTranscriptSmart(fetched) : fetched;
      }
    }

    const content = await aiService.generateArticle({
      topicTitle: topic.title,
      topicDescription: topic.description || "",
      lessonType: topic.type || "STANDARD",
      learnerLevel: "intermediate", // default fallback when not in full course generation
      objectives: topic.objectives ? JSON.parse(topic.objectives) : [],
      keyConcepts: topic.keyConcepts ? JSON.parse(topic.keyConcepts) : [],
      prerequisites: topic.prerequisites ? JSON.parse(topic.prerequisites) : [],
      practicalOutcome: topic.practicalOutcome || undefined,
      videoTranscript: transcript,
      videoMetadata: videoResource?.videoResource ? { 
        title: videoResource.title, 
        channelName: videoResource.videoResource.channelName || ""
      } : undefined,
    }, userId);

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

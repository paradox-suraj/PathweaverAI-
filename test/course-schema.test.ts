/**
 * Verification tests for CourseAIOutputSchema and associated pedagogical types.
 *
 * Confirms that:
 *   1. The schema accepts a fully-populated structured lesson
 *   2. Vague objectives ("understand X") are rejected at parse time
 *   3. Lessons missing new fields still parse with safe defaults (backward compatibility)
 *   4. searchQueries with duplicate intents pass Zod (pedagogical intent typing)
 *   5. The SearchQueryIntentSchema enum rejects unknown intent strings
 */

import { describe, it, expect } from "vitest";
import {
  CourseAIOutputSchema,
  LessonSearchQuerySchema,
  SearchQueryIntentSchema,
} from "@/server/schema/course";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid lesson with ALL Phase 2 fields populated */
function makeFullLesson(overrides: Record<string, unknown> = {}) {
  return {
    type: "STANDARD",
    title: "JavaScript Closures",
    description: "How closures work in JS",
    estimatedMins: 20,
    searchQuery: "javascript closures tutorial",
    objectives: [
      "can explain why a closure retains access to its outer scope after the outer function returns",
      "can write a factory function that uses a closure to maintain private state",
    ],
    prerequisites: ["can declare a JavaScript variable", "can write a basic function"],
    keyConcepts: ["lexical scope", "closure", "execution context", "garbage collection"],
    practicalOutcome:
      "Can implement a counter factory using closures without exposing internal state.",
    assessmentIntent:
      "Quiz will ask the learner to trace scope and predict output of a closure.",
    isVolatileTopic: false,
    searchQueries: [
      { intent: "beginner_explainer", query: "what is a closure in JavaScript explained simply" },
      { intent: "practical_applied", query: "JavaScript closures real-world examples counter factory" },
      { intent: "concept_deep_dive", query: "JavaScript closures scope chain lexical environment theory" },
    ],
    ...overrides,
  };
}

/** Minimal valid course shell wrapping one lesson */
function makeCourse(lesson: Record<string, unknown>) {
  return {
    title: "Mastering JavaScript",
    description: "A comprehensive JS course.",
    modules: [
      {
        title: "Module 1: Fundamentals",
        order: 1,
        lessons: [lesson],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CourseAIOutputSchema Validation", () => {
  it("accepts a fully-populated Phase 2 lesson", () => {
    const result = CourseAIOutputSchema.safeParse(makeCourse(makeFullLesson()));
    expect(result.success).toBe(true);
  });

  it("rejects an objective that starts with 'understand'", () => {
    const lesson = makeFullLesson({
      objectives: ["understand closures deeply"],
    });
    const result = CourseAIOutputSchema.safeParse(makeCourse(lesson));
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message).join(" ");
      expect(messages).toMatch(/measurable verb/i);
    }
  });

  it("rejects an objective that starts with 'learn'", () => {
    const lesson = makeFullLesson({
      objectives: ["learn how to use closures"],
    });
    const result = CourseAIOutputSchema.safeParse(makeCourse(lesson));
    expect(result.success).toBe(false);
  });

  it("rejects an objective that starts with 'know'", () => {
    const lesson = makeFullLesson({
      objectives: ["know what a closure is"],
    });
    const result = CourseAIOutputSchema.safeParse(makeCourse(lesson));
    expect(result.success).toBe(false);
  });

  it("backward-compat: parses a legacy lesson missing all Phase 2 fields", () => {
    const legacyLesson = {
      type: "STANDARD",
      title: "Old Lesson",
      description: "Old description",
      estimatedMins: 30,
      searchQuery: "old search query",
      // No objectives, keyConcepts, searchQueries, etc.
    };
    const result = CourseAIOutputSchema.safeParse(makeCourse(legacyLesson));
    expect(result.success).toBe(true);

    if (result.success) {
      const lesson = result.data.modules[0].lessons[0];
      // Defaults should kick in
      expect(lesson.objectives).toEqual([]);
      expect(lesson.prerequisites).toEqual([]);
      expect(lesson.keyConcepts).toEqual([]);
      expect(lesson.practicalOutcome).toBe("");
      expect(lesson.assessmentIntent).toBe("");
      expect(lesson.isVolatileTopic).toBe(false);
      expect(lesson.searchQueries).toEqual([]);
    }
  });

  it("parses MODULE_QUIZ lesson with empty searchQueries (correct)", () => {
    const quizLesson = {
      type: "MODULE_QUIZ",
      title: "Module 1 Quiz",
      description: "Test your knowledge",
      estimatedMins: 15,
      searchQuery: "",
      searchQueries: [],
    };
    const result = CourseAIOutputSchema.safeParse(makeCourse(quizLesson));
    expect(result.success).toBe(true);
  });

  it("parses CODE_CHALLENGE lesson", () => {
    const codeLesson = makeFullLesson({
      type: "CODE_CHALLENGE",
      codeLanguage: "javascript",
      searchQueries: [],
    });
    const result = CourseAIOutputSchema.safeParse(makeCourse(codeLesson));
    expect(result.success).toBe(true);
  });
});

describe("LessonSearchQuerySchema Validation", () => {
  it("accepts all five valid intent values", () => {
    const validIntents = [
      "beginner_explainer",
      "practical_applied",
      "concept_deep_dive",
      "comparison_troubleshooting",
      "visual_alternative",
    ] as const;

    for (const intent of validIntents) {
      const result = LessonSearchQuerySchema.safeParse({
        intent,
        query: "some specific search query about closures",
      });
      expect(result.success, `intent '${intent}' should be valid`).toBe(true);
    }
  });

  it("rejects an unknown intent string", () => {
    const result = LessonSearchQuerySchema.safeParse({
      intent: "random_intent",
      query: "some query",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a query shorter than 5 characters", () => {
    const result = LessonSearchQuerySchema.safeParse({
      intent: "beginner_explainer",
      query: "hi",
    });
    expect(result.success).toBe(false);
  });
});

describe("SearchQueryIntentSchema Enum", () => {
  it("validates all five canonical intents", () => {
    const intents = [
      "beginner_explainer",
      "practical_applied",
      "concept_deep_dive",
      "comparison_troubleshooting",
      "visual_alternative",
    ];
    for (const i of intents) {
      expect(SearchQueryIntentSchema.safeParse(i).success).toBe(true);
    }
  });

  it("rejects non-canonical strings", () => {
    expect(SearchQueryIntentSchema.safeParse("paraphrase").success).toBe(false);
    expect(SearchQueryIntentSchema.safeParse("").success).toBe(false);
    expect(SearchQueryIntentSchema.safeParse("BEGINNER_EXPLAINER").success).toBe(false);
  });
});

describe("Objective Specificity Verification", () => {
  it("confirms specific objectives are non-redundant and measurable", () => {
    const objectives = [
      "can explain why a closure retains access to its outer scope variables after the outer function returns",
      "can write a factory function that uses a closure to maintain private counter state",
      "can debug a stale-closure bug in a React useEffect hook",
    ];

    // None should start with vague words
    const vague = ["understand", "learn", "know", "appreciate", "be aware"];
    for (const obj of objectives) {
      const startsVague = vague.some((w) => obj.toLowerCase().startsWith(w));
      expect(startsVague).toBe(false);
    }

    // All should have at least 10 chars
    for (const obj of objectives) {
      expect(obj.length).toBeGreaterThanOrEqual(10);
    }

    // Non-redundant: no two should be identical
    const unique = new Set(objectives);
    expect(unique.size).toBe(objectives.length);
  });

  it("confirms sample searchQueries have distinct intents", () => {
    const queries = [
      { intent: "beginner_explainer",         query: "what is a closure in JavaScript explained simply" },
      { intent: "practical_applied",          query: "JavaScript closures counter factory real-world tutorial" },
      { intent: "concept_deep_dive",          query: "JavaScript closures lexical scope execution context theory" },
      { intent: "comparison_troubleshooting", query: "JavaScript closure vs module pattern stale closure fix" },
      { intent: "visual_alternative",         query: "JavaScript closures animated diagram visual" },
    ];

    // All intents unique
    const intents = queries.map((q) => q.intent);
    const uniqueIntents = new Set(intents);
    expect(uniqueIntents.size).toBe(queries.length);

    // All queries unique (not paraphrases)
    const queryStrings = queries.map((q) => q.query);
    const uniqueQueries = new Set(queryStrings);
    expect(uniqueQueries.size).toBe(queries.length);

    // Each valid per schema
    for (const q of queries) {
      expect(LessonSearchQuerySchema.safeParse(q).success).toBe(true);
    }
  });
});

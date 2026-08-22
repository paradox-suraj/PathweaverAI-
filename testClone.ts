import { config } from "dotenv";
config({ path: ".env" });
import { prisma } from "./src/lib/prisma";
import { courseService } from "./src/server/services/course.service";

async function main() {
  const originalCourse = await prisma.course.findFirst({
    where: { isPublished: true },
    include: {
      modules: { include: { topics: { include: { resources: { include: { videoResource: true, articleResource: true } } } } } }
    }
  });

  if (!originalCourse) {
    console.log("No published course found.");
    return;
  }

  console.log("Found published course:", originalCourse.id);

  // Pick a user who is not the creator
  const testUser = await prisma.user.findFirst({
    where: { id: { not: originalCourse.userId } }
  });

  if (!testUser) {
    console.log("No test user found.");
    return;
  }

  console.log("Cloning as user:", testUser.id);

  try {
    const cloned = await courseService.cloneCourse(originalCourse.id, testUser.id);
    console.log("Successfully cloned! New ID:", cloned.id);
  } catch (err) {
    console.error("Error during clone:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

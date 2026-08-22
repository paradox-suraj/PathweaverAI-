import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ take: 2 });
  const courses = await prisma.course.findMany({ take: 2, where: { isPublished: true } });
  return NextResponse.json({ users, courses });
}

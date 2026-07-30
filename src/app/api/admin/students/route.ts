import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { listVisibleStudents, createStudent } from "@/lib/students";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await listVisibleStudents(session);
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = (await req.json()) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const student = await createStudent(name.trim(), session.userId);
  return NextResponse.json(student);
}

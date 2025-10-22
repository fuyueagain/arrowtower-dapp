// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getUserById, updateUser, deleteUser } from "@/lib/db/userService";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params; // ✅ 必须 await
  return NextResponse.json(await getUserById(resolvedParams.id));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params; // ✅ 必须 await

  const data = await request.json();
  return NextResponse.json(await updateUser(resolvedParams.id, data));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params; // ✅ 必须 await
  
  return NextResponse.json(await deleteUser(resolvedParams.id));
}
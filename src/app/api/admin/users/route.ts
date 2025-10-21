
// app/api/admin/users/route.ts

import { NextResponse } from "next/server";
import { getUsers } from "@/lib/db/userService"; 
import { createUser } from "@/lib/db/userService"; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const page = Number.isFinite(Number(pageParam)) && Number(pageParam) > 0 ? Number(pageParam) : 1;
  const pageSize = Number.isFinite(Number(pageSizeParam)) && Number(pageSizeParam) > 0 ? Number(pageSizeParam) : 10;

  const result = await getUsers(page, pageSize);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const data = await request.json();
  const result = await createUser(data);
  return NextResponse.json(result);
}
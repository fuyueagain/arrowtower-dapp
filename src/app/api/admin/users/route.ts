
// app/api/admin/users/route.ts

import { NextResponse } from "next/server";
import { getUsers } from "@/lib/db/userService"; 
import { createUser } from "@/lib/db/userService"; 

export async function GET(request: Request) {


  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  return NextResponse.json(await getUsers(page, pageSize));
}

export async function POST(request: Request) {

  const data = await request.json();
  return NextResponse.json(await createUser(data));
}
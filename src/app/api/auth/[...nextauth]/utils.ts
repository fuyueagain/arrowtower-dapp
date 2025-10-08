// app/api/auth/utils.ts

import { getServerSession } from "next-auth";
import { authOptions } from "./route"; // 路径必须正确指向上面的文件

export async function isAuthenticated(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return session.user;
}
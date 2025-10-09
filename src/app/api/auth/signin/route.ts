// /app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { checkUserExists, autoRegisterUser } from "@/lib/db/auth";

// ----------------------------------------------------
// POST 处理函数
// ----------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (e) {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { address, signature } = requestBody;

    if (!address || !signature) {
      return NextResponse.json(
        { status: "error", message: "Missing address or signature" },
        { status: 400 }
      );
    }

    // ✅ 1. 验证签名
    const message = "login arrowtower";
    let isValidSignature = false;

    try {
      isValidSignature = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (e) {
      console.error("Signature verification failed:", e);
      return NextResponse.json(
        { status: "error", message: "Invalid signature format" },
        { status: 401 }
      );
    }

    if (!isValidSignature) {
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 401 }
      );
    }

    // ✅ 2. 检查用户是否存在
    let user = await checkUserExists(address);

    if (user.success === false) {
      console.log("👤 用户不存在，尝试自动注册:", address);

      // ✅ 使用 Prisma 直接注册（不再 fetch API）
      const registeredUser = await autoRegisterUser(address);
      if (!registeredUser) {
        return NextResponse.json(
          { status: "register_failed", message: "Failed to register user" },
          { status: 500 }
        );
      }

      user = registeredUser;
    }

    // ✅ 3. 登录成功
    return NextResponse.json({
      status: "approved",
      token: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
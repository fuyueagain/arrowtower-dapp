// app/api/auth/signin/route.ts 或 route.ts (用于模拟)

import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";

// ----------------------------------------------------
// 1. 定义用户认证结果类型
// ----------------------------------------------------
type UserData = {
  success: true;
  id: string;
  name: string;
  role: "admin" | "user";
};

type UserNotFound = {
  success: false;
};

type UserAuthResult = UserData | UserNotFound;

// **模拟** checkWalletAuth 函数
const MOCK_USERS: Record<string, UserAuthResult> = {
  "0x1AdminAddressExample": {
    success: true,
    id: "admin_user_id",
    name: "Admin User",
    role: "admin",
  },
  "0x2UserAddressExample": {
    success: true,
    id: "user_id",
    name: "Regular User",
    role: "user",
  },
  "0x3NotFoundAddressExample": { success: false },
};

const mockCheckWalletAuth = (address: string): UserAuthResult => {
  const normalizedAddress = address.toLowerCase().slice(0, 10);

  if (normalizedAddress.includes("1admin")) {
    return MOCK_USERS["0x1AdminAddressExample"];
  }
  if (normalizedAddress.includes("2user")) {
    return MOCK_USERS["0x2UserAddressExample"];
  }

  return MOCK_USERS["0x3NotFoundAddressExample"];
};

export async function POST(req: NextRequest) {
  try {
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (e) {
      // JSON 解析失败时，将 requestBody 设为 {}
      requestBody = {};
    }
    
    // **修复点：解构时使用安全变量**
    const { address, signature } = requestBody;

    if (!address || !signature) {
      return NextResponse.json(
        { status: "error", message: "Missing credentials or invalid request body format" },
        { status: 400 }
      );
    }

    // 签名验证
    const message = "login arrowtower";
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 401 }
      );
    }

    const user = mockCheckWalletAuth(address);

    if (user.success === false) {
      return NextResponse.json({ status: "not_found" }); // 需要注册
    }

    // 成功认证，返回 token
    if (user.success === true) {
      return NextResponse.json({ status: "approved", token: true });
    }

    return NextResponse.json({ status: "unknown" });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
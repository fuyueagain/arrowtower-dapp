// ./src/app/page.tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useSession, signIn } from "next-auth/react";


// Define authentication states
type AuthState =
  | "initial"
  | "connecting"
  | "signing"
  | "authenticating"
  | "registered"
  | "pending"
  | "error";

const getTitle = () => process.env.NEXT_PUBLIC_ITEM_TITLE || "Arrowtower";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  // session.user 现在具有 role 属性，依赖于 next-auth.d.ts 的类型扩展
  const { status, data: session } = useSession(); 

  const [authState, setAuthState] = useState<AuthState>("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  
  useEffect(() => {
    setTitle(getTitle());
  }, []);

  useEffect(() => {
    async function checkAuth() {
      if (isConnected && address) {
        try {
          setAuthState("signing");

          const message = "login arrowtower";
          const signature = await signMessageAsync({ message });

          setAuthState("authenticating");

          // 调用自定义的 signin API 路由
          const response = await fetch("/api/auth/signin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ address, signature }), // 确保 address 和 signature 被正确发送
          });

          // 如果响应的 content-type 不是 application/json (例如服务器 500 错误)，
          // 这里的 response.json() 可能会抛出错误，但会被外部 try-catch 捕获。
          const data = await response.json(); 

          if (data.token) {
            // 成功验证，调用 NextAuth 的 signIn
            await signIn("credentials", {
              address,
              signature,
              redirect: false,
            });
            setAuthState("registered");
          } else if (data.status === "not_found") {
            // 用户未找到，需要完成注册流程
            setAuthState("pending");
            router.push("/register");
          } else {
            // Unexpected response or other non-token success
            setAuthState("error");
            setErrorMessage("Unknown authentication status or rejected user.");
          }
        } catch (error) {
          // 捕获签名失败、API调用失败（包括 API 内部的解构错误）等
          setAuthState("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Authentication failed"
          );
          console.error("Auth check failed:", error);
        }
      }
    }

    if (isConnected) {
      setAuthState("connecting");
      checkAuth();
    }
  }, [isConnected, address, router, signMessageAsync]);

  useEffect(() => {
    // 简化的跳转逻辑
    // 只有在 'authenticated' 状态下，且 session 和 user 存在时才进行跳转判断
    if (status === "authenticated" && isConnected && address && session?.user) {
      // session.user 确定存在，可以直接访问 role
      const { role } = session.user;
      
      if (role === "admin") {
        router.push("/admin"); // 管理员跳转到 /admin
      } else {
        // 其他所有已认证用户（user，或您定义的其他非 admin 角色）跳转到 /user
        router.push("/user"); 
      }
    }
  }, [status, router, isConnected, address, session]);

  // Render different UI based on authentication state
  const renderAuthContent = () => {
    switch (authState) {
      case "initial":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="mb-4">
              <Image
                src="/vercel.svg"
                alt="Logo"
                width={100}
                height={100}
                priority
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="mb-6 text-gray-600">请连接钱包以继续</p>
            <ConnectWallet />
          </div>
        );

      case "connecting":
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">钱包连接中...</p>
              <div className="animate-spin w-10 h-10 mx-auto border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );

      case "signing":
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">正在签名认证...</p>
              <div className="animate-pulse text-gray-600">请在钱包中确认签名</div>
            </div>
          </div>
        );

      case "authenticating":
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">认证中...</p>
              <div className="animate-spin w-10 h-10 mx-auto border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">注册处理中</p>
              <p className="text-gray-600">请完成后续注册步骤</p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-red-500">认证失败</p>
              {errorMessage && <p className="text-gray-600">{errorMessage}</p>}
              <button
                onClick={() => {
                  setAuthState("initial");
                  setErrorMessage(null);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重新尝试
              </button>
            </div>
          </div>
        );

      default:
        // 'registered' 状态下会触发 useEffect 进行跳转，因此这里返回 null
        return null;
    }
  };

  return renderAuthContent();
}
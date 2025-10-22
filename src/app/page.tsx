// ./src/app/page.tsx
"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
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

const getTitle = () => process.env.NEXT_PUBLIC_ITEM_TITLE || "Arrow Tower";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const { status, data: session } = useSession();

  const [authState, setAuthState] = useState<AuthState>("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  // signingRef 用于防止重复发起签名请求（锁）
  const signingRef = useRef(false);
  // mountedRef 用于避免在组件卸载后 setState
  const mountedRef = useRef(true);

  useEffect(() => {
    setTitle(getTitle());
  }, []);

  useEffect(() => {
    // 在卸载时标记
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function checkAuth() {
      if (!isConnected || !address) return;

      // 如果已有签名进行中，直接返回，避免重复请求（例如 StrictMode 导致的双触发）
      if (signingRef.current) {
        console.log("签名请求已在进行中，跳过重复发起");
        return;
      }

      try {
        signingRef.current = true; // 上锁
        if (mountedRef.current) setAuthState("signing");
        setErrorMessage(null);

        const message = "login arrowtower";
        // 发起签名
        const signature = await signMessageAsync({ message });

        if (mountedRef.current) setAuthState("authenticating");

        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address, signature }),
        });

        const data = await response.json();

        if (data?.token) {
          // 使用 next-auth 的 credentials 登录（不重定向）
          await signIn("credentials", {
            address,
            signature,
            redirect: false,
          });
          if (mountedRef.current) setAuthState("registered");
        } else if (data?.status === "not_found") {
          if (mountedRef.current) setAuthState("pending");
          // 引导到注册页
          router.push("/register");
        } else {
          if (mountedRef.current) {
            setAuthState("error");
            setErrorMessage("Unknown authentication status or rejected user.");
          }
        }
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error("Auth check failed:", err);

        // 常见钱包提示：already pending / user rejected / denied 等
        if (
          msg.includes("already pending") ||
          msg.includes("Request of type 'personal_sign'") ||
          msg.includes("personal_sign already pending")
        ) {
          // 钱包中已有未完成签名
          if (mountedRef.current) {
            setAuthState("signing");
            setErrorMessage(
              "钱包中已有未完成的签名请求，请在钱包中确认或取消先前的签名请求后重试。"
            );
          }
          // 注意：这里我们仍解除锁（allow retry），如果你想在钱包 pending 状态下阻止重试，可注释下面的逻辑，
          // 并在用户手动取消/确认后由 UI 触发重试。
        } else if (
          msg.toLowerCase().includes("user rejected") ||
          msg.toLowerCase().includes("denied") ||
          msg.toLowerCase().includes("rejected")
        ) {
          if (mountedRef.current) {
            setAuthState("error");
            setErrorMessage("您已拒绝签名。若要继续，请在钱包中允许签名或重新连接钱包后重试。");
          }
        } else {
          if (mountedRef.current) {
            setAuthState("error");
            setErrorMessage(err instanceof Error ? err.message : "Authentication failed");
          }
        }
      } finally {
        // 解锁，允许后续尝试（如果你希望保持锁直到用户在钱包中处理完再解锁，可改为在用户动作后手动清理）
        signingRef.current = false;
      }
    }

    if (isConnected) {
      if (mountedRef.current) setAuthState("connecting");
      checkAuth();
    } else {
      // 如果断开连接，恢复初始态
      if (mountedRef.current) {
        setAuthState("initial");
        setErrorMessage(null);
      }
    }
    // 监听 isConnected 和 address 的变化来触发认证流程
  }, [isConnected, address, router, signMessageAsync]);

  useEffect(() => {
    // 当 session 可用时，根据 role 跳转
    if (session?.user) {
      const { role } = session.user as any;
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    }
  }, [session, router]);

  // Render different UI based on authentication state
  const renderAuthContent = () => {
    switch (authState) {
      case "initial":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 mb-8">
              {title}
            </h1>
            <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-200">
              <Image
                src="/arrowtower.jpg"
                alt="ArrowTower"
                width={400}
                height={400}
                priority
                className="object-cover"
              />
            </div>
            <p className="mb-6 text-gray-600 font-medium text-lg">请连接钱包以继续</p>
            <ConnectWallet />
          </div>
        );

      case "connecting":
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-emerald-700">钱包连接中...</p>
              <div className="animate-spin w-16 h-16 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );

      case "signing":
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-emerald-700">正在签名认证...</p>
              <div className="animate-pulse text-gray-600">请在钱包中确认签名</div>
              {errorMessage && <p className="text-sm text-gray-600 mt-3">{errorMessage}</p>}
            </div>
          </div>
        );

      case "authenticating":
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-emerald-700">认证中...</p>
              <div className="animate-spin w-16 h-16 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-emerald-700">注册处理中</p>
              <p className="text-gray-600">请完成后续注册步骤</p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4 text-red-500">认证失败</p>
              {errorMessage && <p className="text-gray-600 mb-4">{errorMessage}</p>}
              <button
                onClick={() => {
                  setAuthState("initial");
                  setErrorMessage(null);
                }}
                className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold shadow-lg transition-all duration-200"
              >
                重新尝试
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderAuthContent();
}

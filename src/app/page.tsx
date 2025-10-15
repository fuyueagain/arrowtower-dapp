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

const getTitle = () => process.env.NEXT_PUBLIC_ITEM_TITLE || "Arrow Tower";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
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

          const response = await fetch("/api/auth/signin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ address, signature }),
          });

          const data = await response.json(); 

          if (data.token) {
            await signIn("credentials", {
              address,
              signature,
              redirect: false,
            });
            setAuthState("registered");
          } else if (data.status === "not_found") {
            setAuthState("pending");
            router.push("/register");
          } else {
            setAuthState("error");
            setErrorMessage("Unknown authentication status or rejected user.");
          }
        } catch (error) {
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
    if (/* status === "authenticated" && isConnected && address && */ session?.user) {
      const { role } = session.user;
      
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/user"); 
      }
    }
  }, [/* status, router, isConnected, address,  */session]);

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
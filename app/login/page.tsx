"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClickableText from "@/components/ClickableText";
import SketchInput from "@/components/SketchInput";
import SketchButton from "@/components/SketchButton";
import Image from "next/image";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push(redirect);
      }
    };
    checkUser();
  }, [supabase.auth, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push(redirect);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`오류: ${error.message}`);
      } else {
        setMessage("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex-col flex items-center justify-center relative px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Image
            src="/구조(열쇠).png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
        </div>

        <h1 className="text-center">로그인</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-xl lg:text-2xl">이메일</label>
            <SketchInput
              value={email}
              onChange={setEmail}
              placeholder="example@email.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-xl lg:text-2xl">비밀번호</label>
            <SketchInput
              value={password}
              onChange={setPassword}
              placeholder="6자 이상 입력해주세요"
              type="password"
              required
            />
          </div>

          <SketchButton type="submit" disabled={loading} className="w-full">
            {loading ? "처리 중..." : "로그인하기"}
          </SketchButton>
        </form>

        {message && (
          <div className="mt-4 text-center text-xl lg:text-2xl text-neutral-600">
            {message}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-8">
        <ClickableText onClick={() => router.push("/")}>← 뒤로</ClickableText>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          로딩 중...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

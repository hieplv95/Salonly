import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Đăng nhập · Salonly" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="font-serif text-[28px] leading-tight">Đăng nhập</h1>
      <p className="mb-6 mt-1 text-[13px] text-taupe">Chào mừng bạn quay lại</p>
      <AuthForm mode="login" next={typeof next === "string" ? next : "/"} />
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/auth/db";
import { GUEST_EMAIL } from "@/lib/auth/guest";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Đăng ký · Salonly" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;
  const { count } = db().prepare("SELECT COUNT(*) AS count FROM users WHERE email != ?").get(GUEST_EMAIL) as { count: number };
  return (
    <>
      <h1 className="font-serif text-[28px] leading-tight">Tạo tài khoản</h1>
      <p className="mb-6 mt-1 text-[13px] text-taupe">Chỉ cần tên tài khoản, email và mật khẩu</p>
      <AuthForm mode="register" next={typeof next === "string" ? next : "/"} firstUser={count === 0} />
    </>
  );
}

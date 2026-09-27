"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type AuthState } from "./actions";

const inputCls =
  "w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-[15px] outline-none transition placeholder:text-taupe/60 focus:border-gold focus:ring-2 focus:ring-gold/20";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[12px] font-semibold">{label}</span>
      {children}
      {error && <span className="mt-1 block px-1 text-[12px] text-rosegold">{error}</span>}
    </label>
  );
}

function PasswordInput({ name, autoComplete, invalid }: { name: string; autoComplete: string; invalid: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required aria-invalid={invalid} className={`${inputCls} pr-16`} />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-8 rounded-full px-3 text-[12px] text-taupe hover:text-ink">
        {show ? "Ẩn" : "Hiện"}
      </button>
    </span>
  );
}

export function AuthForm({ mode, next, firstUser }: { mode: "login" | "register"; next: string; firstUser?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, undefined);
  const fe = state?.fieldErrors;
  const isLogin = mode === "login";

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {isLogin ? (
        <Field label="Tên tài khoản hoặc email">
          <input name="identifier" defaultValue={state?.values?.identifier} autoComplete="username" required autoFocus className={inputCls} placeholder="VD: hongnhung" />
        </Field>
      ) : (
        <>
          {firstUser && (
            <p className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-[12.5px] leading-relaxed">
              Chưa có tài khoản nào. Tài khoản bạn tạo bây giờ sẽ là <b>quản trị viên (admin)</b> để quản lý hệ thống; người đăng ký sau là <b>thành viên</b> dùng studio.
            </p>
          )}
          <Field label="Tên tài khoản" error={fe?.username}>
            <input name="username" defaultValue={state?.values?.username} autoComplete="username" required autoFocus maxLength={30} aria-invalid={!!fe?.username} className={inputCls} placeholder="VD: hongnhung" />
          </Field>
          <Field label="Email" error={fe?.email}>
            <input name="email" type="email" defaultValue={state?.values?.email} autoComplete="email" required aria-invalid={!!fe?.email} className={inputCls} placeholder="ban@email.com" />
          </Field>
        </>
      )}
      <Field label="Mật khẩu" error={fe?.password}>
        <PasswordInput name="password" autoComplete={isLogin ? "current-password" : "new-password"} invalid={!!fe?.password} />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-rosegold/10 px-4 py-2.5 text-[13px] text-rosegold">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="gold-btn flex h-[50px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-cream active:scale-[0.98] disabled:opacity-60">
        {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />}
        {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
      </button>

      <p className="text-center text-[13px] text-taupe">
        {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <Link href={`${isLogin ? "/register" : "/login"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-gold underline-offset-4 hover:underline">
          {isLogin ? "Đăng ký" : "Đăng nhập"}
        </Link>
      </p>
    </form>
  );
}

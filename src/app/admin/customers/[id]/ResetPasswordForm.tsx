"use client";

import { useActionState } from "react";
import { resetPassword, type FormResult } from "../../actions";

// Admin đặt mật khẩu mới cho khách quên mật khẩu (khách bị đăng xuất khỏi mọi thiết bị).
export function ResetPasswordForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<FormResult, FormData>(resetPassword, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="block text-[12px]">
        <span className="mb-1 block text-taupe">Đặt lại mật khẩu</span>
        <span className="flex gap-2">
          <input
            name="password"
            type="text"
            autoComplete="off"
            minLength={6}
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            className="h-10 min-w-0 flex-1 rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold"
          />
          <button disabled={pending} className="h-10 shrink-0 rounded-full border border-line bg-white/70 px-4 text-[13px] font-medium active:scale-95 disabled:opacity-60">
            {pending ? "Đang lưu…" : "Đặt lại"}
          </button>
        </span>
      </label>
      {state?.error && <p className="mt-2 text-[12px] text-rosegold">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-[12px] text-gold">{state.ok}</p>}
    </form>
  );
}

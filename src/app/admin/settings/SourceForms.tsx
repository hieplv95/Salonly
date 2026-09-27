"use client";

import { useActionState, useState } from "react";
import { addSourceAction, testAllAction, type SourceResult, type TestResult } from "../actions";

const input = "h-10 w-full rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold";

function Results({ state }: { state: SourceResult }) {
  if (!state) return null;
  return (
    <>
      {state.error && <p className="rounded-2xl bg-rosegold/10 px-4 py-2.5 text-[13px] text-rosegold">{state.error}</p>}
      {state.ok && <p className="rounded-2xl bg-gold/10 px-4 py-2.5 text-[13px]">{state.ok}</p>}
      {state.tests && (
        <ul className="space-y-1.5 rounded-2xl border border-line bg-white/60 p-3">
          {state.tests.map((t: TestResult) => (
            <li key={t.id + t.name} className="flex items-start gap-2 text-[12.5px]">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.ok ? "bg-emerald-500" : "bg-rosegold"}`} />
              <span>
                <b>{t.name}</b>: <span className={t.ok ? "text-taupe" : "text-rosegold"}>{t.message}</span>
              </span>
            </li>
          ))}
          <li className="pt-1 text-[11px] text-taupe">Kiểm tra chỉ xác nhận project / key hợp lệ và có quyền; không biết được còn credit hay không.</li>
        </ul>
      )}
    </>
  );
}

// Kiểm tra kết nối mọi nguồn cùng lúc (miễn phí).
export function TestAllForm() {
  const [state, action, pending] = useActionState<SourceResult>(testAllAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <button disabled={pending} className="h-10 w-full rounded-full border border-line bg-white/70 text-[13px] active:scale-[0.98] disabled:opacity-60">
        {pending ? "Đang kiểm tra…" : "Kiểm tra kết nối tất cả nguồn"}
      </button>
      <Results state={state} />
    </form>
  );
}

// Thêm nguồn: project Vertex AI của 1 tài khoản Google Cloud, hoặc 1 API key AI Studio.
export function AddSourceForm() {
  const [state, action, pending] = useActionState<SourceResult, FormData>(addSourceAction, undefined);
  const [kind, setKind] = useState<"vertex" | "studio">("vertex");
  const [auth, setAuth] = useState<"key" | "adc">("key");

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-1 rounded-full bg-line/60 p-1">
        {(
          [
            ["vertex", "Tài khoản Google Cloud"],
            ["studio", "API key AI Studio"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setKind(id)} className={`h-9 rounded-full text-[12.5px] transition ${kind === id ? "gold-btn font-medium text-cream" : "text-taupe"}`}>
            {label}
          </button>
        ))}
      </div>

      <label className="block text-[12px]">
        <span className="mb-1 block px-1 font-semibold">Tên gợi nhớ</span>
        <input name="label" maxLength={40} placeholder={kind === "vertex" ? "VD: Tài khoản phụ 1" : "VD: Key dự phòng 1"} className={input} />
      </label>

      {kind === "vertex" ? (
        <>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["key", "File khoá service account", "Dùng cho tài khoản phụ (mỗi tài khoản 1 file .json)"],
                ["adc", "Đăng nhập gcloud trên máy chủ", "Chỉ dùng được cho 1 tài khoản đang đăng nhập"],
              ] as const
            ).map(([id, label, desc]) => (
              <label key={id} className={`cursor-pointer rounded-2xl border p-3 ${auth === id ? "border-gold bg-gold/10" : "border-line bg-white/60"}`}>
                <span className="flex items-center gap-2 text-[12.5px] font-semibold">
                  <input type="radio" name="auth" value={id} checked={auth === id} onChange={() => setAuth(id)} className="accent-[var(--color-gold)]" />
                  {label}
                </span>
                <span className="mt-0.5 block pl-5 text-[11px] text-taupe">{desc}</span>
              </label>
            ))}
          </fieldset>
          {auth === "key" && (
            <label className="block text-[12px]">
              <span className="mb-1 block px-1 font-semibold">File khoá (.json)</span>
              <input
                name="keyFile"
                type="file"
                accept="application/json,.json"
                className="block w-full rounded-2xl border border-dashed border-line bg-white/60 p-2.5 text-[12.5px] file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-gold"
              />
            </label>
          )}
          <label className="block text-[12px]">
            <span className="mb-1 flex justify-between px-1 font-semibold">
              Project ID <span className="font-normal text-taupe">{auth === "key" ? "Để trống = lấy theo file khoá" : ""}</span>
            </span>
            <input name="project" placeholder="VD: project-9b250232-b388-4a3b-ab0" className={input} />
          </label>
        </>
      ) : (
        <label className="block text-[12px]">
          <span className="mb-1 block px-1 font-semibold">API key</span>
          <input name="apiKey" type="password" autoComplete="off" placeholder="AIza…" className={input} />
        </label>
      )}

      <details className="rounded-2xl border border-line bg-white/50 p-3">
        <summary className="cursor-pointer text-[12.5px] font-medium text-gold">Credit của nguồn này (không bắt buộc)</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-[11.5px]">
            <span className="mb-1 block text-taupe">Số dư hiện tại</span>
            <input name="amount" inputMode="decimal" placeholder="VD: 257" className={input} />
          </label>
          <label className="text-[11.5px]">
            <span className="mb-1 block text-taupe">Đơn vị</span>
            <select name="currency" defaultValue="EUR" className={input}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
          <label className="text-[11.5px]">
            <span className="mb-1 block text-taupe">Hết hạn</span>
            <input name="expires" type="date" className={input} />
          </label>
          <label className="text-[11.5px]">
            <span className="mb-1 block text-taupe">Dừng khi còn dưới</span>
            <input name="reserve" inputMode="decimal" placeholder="Không bắt buộc" className={input} />
          </label>
        </div>
      </details>

      <Results state={state} />

      <div className="grid grid-cols-2 gap-2">
        <button name="intent" value="test" disabled={pending} className="h-11 rounded-full border border-line bg-white/70 text-[13.5px] active:scale-[0.98] disabled:opacity-60">
          {pending ? "Đang kiểm tra…" : "Kiểm tra"}
        </button>
        <button name="intent" value="save" disabled={pending} className="gold-btn h-11 rounded-full text-[13.5px] font-medium text-cream active:scale-[0.98] disabled:opacity-60">
          Thêm nguồn
        </button>
      </div>
    </form>
  );
}

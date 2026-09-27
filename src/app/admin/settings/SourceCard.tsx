import { billingConsoleUrl, type BillingStatus } from "@/lib/billing";
import type { SourceView } from "@/lib/settings";
import type { CreditState } from "@/lib/usage";
import { creditAction, sourceAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { dateTime, money } from "../format";

type Status = { available: boolean; enabled: boolean; exhausted: boolean; retryInSeconds: number } | undefined;

const small = "h-8 rounded-full border border-line bg-white/70 px-3 text-[12px] active:scale-95 disabled:opacity-40";
const field = "h-9 w-full rounded-xl border border-line bg-white/80 px-2.5 text-[13px] outline-none focus:border-gold";
const AUTH_LABEL = { adc: "Đăng nhập gcloud", key: "File khoá service account", file: "File khoá trên máy chủ", apikey: "API key AI Studio" };
const showDate = (d: string) => d.split("-").reverse().join("/");

function Pill({ status, credit }: { status: Status; credit: CreditState | null }) {
  const [cls, text] = !status?.enabled
    ? ["bg-line text-taupe", "Đang tắt"]
    : credit?.exhausted || status?.exhausted
      ? ["bg-rosegold/15 text-rosegold", "Hết credit"]
      : status && !status.available
        ? ["bg-amber-100 text-amber-700", `Tạm nghỉ ${Math.ceil(status.retryInSeconds / 60)} phút`]
        : ["bg-emerald-100 text-emerald-700", "Đang dùng được"];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${cls}`}>{text}</span>;
}

// 1 nguồn AI: tài khoản Google Cloud (project Vertex) hoặc API key, kèm credit ước tính và các nút thao tác.
export function SourceCard({
  s,
  index,
  total,
  status,
  credit,
  billing,
}: {
  s: SourceView;
  index: number;
  total: number;
  status: Status;
  credit: CreditState | null;
  billing?: BillingStatus;
}) {
  const c = s.credit;
  const pct = c && credit ? Math.min(100, Math.max(0, (credit.spent / c.amount) * 100)) : 0;
  const hidden = (intent: string) => (
    <>
      <input type="hidden" name="id" value={s.id} />
      <input type="hidden" name="intent" value={intent} />
    </>
  );

  return (
    <li className={`rounded-3xl border bg-white/60 p-4 ${s.enabled ? "border-line" : "border-dashed border-line opacity-70"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/15 text-[13px] font-semibold text-gold">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-[14.5px] font-semibold">
            <span className="break-all">{s.name}</span>
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-taupe">{s.kind === "vertex" ? "Vertex AI" : "AI Studio"}</span>
            <Pill status={status} credit={credit} />
          </p>
          <p className="mt-0.5 break-all text-[12px] text-taupe">
            {s.kind === "vertex" ? `${s.label ? `${s.project} · ` : ""}${AUTH_LABEL[s.auth]}${s.keyEmail ? ` (${s.keyEmail})` : ""}` : `Key ${s.hint}`}
            {billing?.state === "disabled" && <b className="text-rosegold"> · Google báo thanh toán đã tắt</b>}
          </p>
        </div>
      </div>

      {/* Credit ước tính */}
      <div className="mt-3 rounded-2xl bg-cream/80 p-3">
        {c && credit ? (
          <>
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={`font-serif text-[22px] leading-none ${credit.exhausted ? "text-rosegold" : ""}`}>{money(Math.max(0, credit.remaining), c.currency)}</span>
              <span className="text-[11.5px] text-taupe">
                còn lại / {money(c.amount, c.currency)}
                {credit.daysLeft !== null && (
                  <b className={credit.daysLeft <= 14 ? "text-rosegold" : ""}>
                    {" · "}
                    {credit.daysLeft >= 0 ? `hết hạn ${showDate(c.expires!)} (${credit.daysLeft} ngày)` : "đã hết hạn"}
                  </b>
                )}
              </span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div className={`h-full rounded-full ${pct >= 90 ? "bg-rosegold" : "gold-btn"}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-taupe">
              Đã dùng qua app ~{money(credit.spent, c.currency)} kể từ lúc cập nhật số dư {dateTime(c.since)}
              {c.reserve ? ` · tự dừng khi còn dưới ${money(c.reserve, c.currency)}` : ""}
            </p>
          </>
        ) : (
          <p className="text-[12px] text-taupe">Chưa nhập credit: nguồn này được dùng tới khi Google báo hết tiền.</p>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-[12px] font-medium text-gold">{c ? "Cập nhật số dư" : "Nhập credit"}</summary>
          <form action={creditAction} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {hidden("save")}
            <label className="col-span-2 text-[11.5px] sm:col-span-1">
              <span className="mb-1 block text-taupe">Số dư hiện tại</span>
              <input name="amount" required inputMode="decimal" placeholder="VD: 243,40" className={field} />
            </label>
            <label className="text-[11.5px]">
              <span className="mb-1 block text-taupe">Đơn vị</span>
              <select name="currency" defaultValue={c?.currency ?? "EUR"} className={field}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </label>
            <label className="text-[11.5px]">
              <span className="mb-1 block text-taupe">Hết hạn</span>
              <input name="expires" type="date" defaultValue={c?.expires} className={field} />
            </label>
            <label className="col-span-2 text-[11.5px] sm:col-span-1">
              <span className="mb-1 block text-taupe">Dừng khi còn dưới</span>
              <input name="reserve" inputMode="decimal" defaultValue={c?.reserve ?? ""} placeholder="Không bắt buộc" className={field} />
            </label>
            <p className="col-span-2 text-[11px] text-taupe sm:col-span-3">
              Chép số dư đang hiện trên Google Cloud (VD: “€243.40 credit”). App trừ dần từ lúc lưu; chép lại định kỳ để khớp số thật.
            </p>
            <button className="gold-btn h-9 rounded-full text-[12.5px] font-medium text-cream active:scale-95">Lưu</button>
          </form>
          {c && (
            <form action={creditAction} className="mt-2">
              {hidden("clear")}
              <button className="text-[11.5px] text-taupe underline-offset-4 hover:underline">Bỏ theo dõi credit nguồn này</button>
            </form>
          )}
        </details>
      </div>

      {/* Thao tác */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <form action={sourceAction}>
          {hidden("up")}
          <button disabled={index === 0} aria-label="Ưu tiên hơn" className={small}>
            ↑
          </button>
        </form>
        <form action={sourceAction}>
          {hidden("down")}
          <button disabled={index === total - 1} aria-label="Ưu tiên sau" className={small}>
            ↓
          </button>
        </form>
        <form action={sourceAction}>
          {hidden(s.enabled ? "disable" : "enable")}
          <button className={small}>{s.enabled ? "Tạm tắt" : "Bật lại"}</button>
        </form>
        <details className="open:order-last open:basis-full">
          <summary className={`${small} inline-flex cursor-pointer list-none items-center`}>Đổi tên</summary>
          <form action={sourceAction} className="mt-2 flex gap-1.5">
            {hidden("label")}
            <input name="label" defaultValue={s.label} maxLength={40} placeholder="VD: Tài khoản chính" className={field} />
            <button className="gold-btn h-9 shrink-0 rounded-full px-3 text-[12px] text-cream">Lưu</button>
          </form>
        </details>
        {s.kind === "vertex" && s.project && (
          <a href={billingConsoleUrl(s.project)} target="_blank" rel="noreferrer" className={`${small} inline-flex items-center`}>
            Số dư thật ↗
          </a>
        )}
        <form action={sourceAction} className="ml-auto">
          {hidden("remove")}
          <ConfirmButton message={`Xoá nguồn "${s.name}" khỏi danh sách?`} className="h-8 rounded-full px-3 text-[12px] text-rosegold active:scale-95">
            Xoá
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}

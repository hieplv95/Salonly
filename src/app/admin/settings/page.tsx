import type { Metadata } from "next";
import { billingStatus } from "@/lib/billing";
import { requireAdmin } from "@/lib/auth/session";
import { backendStatus } from "@/lib/gemini";
import { getAiSources, getAiView, getDefaultQuotas } from "@/lib/settings";
import { creditState } from "@/lib/usage";
import { locationsAction, resetGoogle, saveDefaultQuotas } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { dateTime } from "../format";
import { SourceCard } from "./SourceCard";
import { AddSourceForm, TestAllForm } from "./SourceForms";
import { AccessCard } from "./AccessCard";
import { FooterCard } from "./FooterCard";
import { SeoCard } from "./SeoCard";

export const metadata: Metadata = { title: "Cài đặt · Quản trị Salonly" };

const input = "h-10 w-full rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold";
const card = "rounded-3xl border border-line bg-cream/90 p-5 sm:p-6";
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.2em] text-gold";

export default async function SettingsPage() {
  await requireAdmin();
  const view = getAiView();
  const runtime = getAiSources().sources;
  const status = backendStatus();
  const quotas = getDefaultQuotas();
  // Trạng thái thanh toán từng project (nếu đã bật Cloud Billing API), hỏi song song.
  const billing = new Map(
    await Promise.all(
      runtime
        .filter((r) => r.kind === "vertex" && r.project)
        .map(async (r) => [r.id, await billingStatus({ project: r.project!, credentials: r.credentials, keyFilename: r.keyFilename })] as const),
    ),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
      <section className={card}>
        <p className={eyebrow}>Nguồn AI · Google Cloud</p>
        <h1 className="mt-1 font-serif text-[26px] leading-tight">Tài khoản & API key</h1>
        <p className="mt-1 text-[13px] text-taupe">
          App dùng lần lượt từ trên xuống: nguồn nào đang tắt, lỗi hoặc hết credit thì tự chuyển sang nguồn kế tiếp.{" "}
          {view.origin === "admin"
            ? `Cập nhật lần cuối ${view.updatedAt ? dateTime(view.updatedAt) : ""}.`
            : "Đang đọc từ file .env.local; thay đổi đầu tiên dưới đây sẽ chuyển sang quản lý trên web."}
        </p>

        <ol className="mt-4 space-y-3">
          {view.sources.map((s, i) => (
            <SourceCard
              key={s.id}
              s={s}
              index={i}
              total={view.sources.length}
              status={status.find((x) => x.id === s.id)}
              credit={s.credit ? creditState(s.id, s.credit) : null}
              billing={billing.get(s.id)}
            />
          ))}
          {!view.sources.length && <li className="rounded-3xl border border-dashed border-line p-6 text-center text-[13px] text-taupe">Chưa có nguồn AI nào: app đang ở chế độ demo.</li>}
        </ol>

        <div className="mt-4">
          <TestAllForm />
        </div>

        <div className="mt-6 border-t border-line/70 pt-5">
          <h2 className="font-serif text-[20px]">Thêm nguồn</h2>
          <p className="mb-3 mt-0.5 text-[12px] text-taupe">
            Tài khoản Google Cloud phụ: tạo project, bật Vertex AI API, tạo service account (vai trò “Vertex AI User”) rồi tải file khoá .json.
          </p>
          <AddSourceForm />
        </div>

        <details className="mt-5 border-t border-line/70 pt-4">
          <summary className="cursor-pointer text-[12.5px] text-taupe">
            Khu vực: ảnh <b>{view.imageLocation}</b> · video <b>{view.videoLocation}</b>
          </summary>
          <form action={locationsAction} className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <label className="text-[12px]">
              <span className="mb-1 block text-taupe">Khu vực tạo ảnh</span>
              <input name="imageLocation" defaultValue={view.imageLocation} className={input} />
            </label>
            <label className="text-[12px]">
              <span className="mb-1 block text-taupe">Khu vực tạo video</span>
              <input name="videoLocation" defaultValue={view.videoLocation} className={input} />
            </label>
            <button className="h-10 rounded-full border border-line bg-white/70 px-4 text-[13px] active:scale-95">Lưu</button>
          </form>
        </details>

        {view.origin === "admin" && (
          <form action={resetGoogle} className="mt-3">
            <ConfirmButton message="Xoá toàn bộ nguồn đã lưu trên web và quay lại dùng file .env.local?" className="text-[12px] text-taupe underline-offset-4 hover:text-ink hover:underline">
              Bỏ cấu hình trên web, dùng lại .env.local
            </ConfirmButton>
          </form>
        )}
      </section>

      <div className="space-y-6">
      <AccessCard />
      <section className={card}>
        <p className={eyebrow}>Hạn mức mặc định</p>
        <h2 className="mt-1 font-serif text-[22px] leading-tight">Lượt tạo mỗi tháng</h2>
        <p className="mt-1 text-[13px] text-taupe">
          Áp dụng cho mọi thành viên (và khách vãng lai) chưa có hạn mức riêng. Để trống = không giới hạn. Lượt được tính lại từ ngày 1 hằng tháng.
        </p>
        <form action={saveDefaultQuotas} className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-[12px]">
            <span className="mb-1 block text-taupe">Lượt tạo ảnh</span>
            <input name="image" type="number" min={0} defaultValue={quotas.image ?? ""} placeholder="Không giới hạn" className={input} />
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block text-taupe">Lượt tạo video</span>
            <input name="video" type="number" min={0} defaultValue={quotas.video ?? ""} placeholder="Không giới hạn" className={input} />
          </label>
          <button className="gold-btn col-span-2 h-11 rounded-full text-[14px] font-medium text-cream active:scale-[0.98]">Lưu hạn mức</button>
        </form>
      </section>
      <FooterCard />
      </div>
      <div className="lg:col-span-2">
        <SeoCard />
      </div>
    </div>
  );
}

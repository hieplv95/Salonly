import { guestCustomer } from "@/lib/admin-stats";
import { getGuestUser } from "@/lib/auth/guest";
import { getDefaultQuotas, getRequireLogin } from "@/lib/settings";
import { db } from "@/lib/auth/db";
import { requireLoginAction, setUserQuota } from "../actions";
import { usedOf, vnd } from "../format";

const input = "h-10 w-full rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold";

// Bật/tắt bắt buộc đăng nhập + hạn mức dùng chung cho người chưa đăng nhập ("Khách vãng lai").
export function AccessCard() {
  const on = getRequireLogin();
  const guest = getGuestUser();
  const stats = guestCustomer();
  const quota = db().prepare("SELECT image_quota, video_quota FROM users WHERE id = ?").get(guest.id) as { image_quota: number | null; video_quota: number | null };
  const d = getDefaultQuotas();

  return (
    <section className="rounded-3xl border border-line bg-cream/90 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Truy cập app</p>
      <form action={requireLoginAction} className="mt-2 flex items-center justify-between gap-4">
        <input type="hidden" name="on" value={on ? "0" : "1"} />
        <div>
          <h2 className="font-serif text-[22px] leading-tight">Bắt buộc đăng nhập</h2>
          <p className="mt-0.5 text-[12.5px] text-taupe">{on ? "Đang bật: phải tạo tài khoản và đăng nhập mới dùng được." : "Đang tắt: ai mở app cũng dùng được ngay."}</p>
        </div>
        <button aria-label={on ? "Tắt bắt buộc đăng nhập" : "Bật bắt buộc đăng nhập"} className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "gold-btn" : "bg-line"}`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
        </button>
      </form>

      <div className={`mt-4 rounded-2xl p-3 ${on ? "bg-white/40 opacity-60" : "bg-white/70"}`}>
        <p className="text-[13px] font-semibold">Khách không đăng nhập (dùng chung)</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-taupe">
          Khi tắt đăng nhập, mọi lượt tạo của người chưa có tài khoản tính chung vào đây. Nên đặt hạn mức để người lạ không dùng hết credit Google Cloud.
        </p>
        {stats && (
          <p className="mt-2 text-[12px]">
            Tháng này: <b>{usedOf(stats.imgMonth, stats.limits.image)}</b> ảnh · <b>{usedOf(stats.vidMonth, stats.limits.video)}</b> video · {vnd(stats.costMonth)}
          </p>
        )}
        <form action={setUserQuota} className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <input type="hidden" name="id" value={guest.id} />
          <label className="text-[11.5px]">
            <span className="mb-1 block text-taupe">Ảnh / tháng</span>
            <input name="image" type="number" min={0} defaultValue={quota.image_quota ?? ""} placeholder={d.image === null ? "Không giới hạn" : `Mặc định ${d.image}`} className={input} />
          </label>
          <label className="text-[11.5px]">
            <span className="mb-1 block text-taupe">Video / tháng</span>
            <input name="video" type="number" min={0} defaultValue={quota.video_quota ?? ""} placeholder={d.video === null ? "Không giới hạn" : `Mặc định ${d.video}`} className={input} />
          </label>
          <button className="h-10 rounded-full border border-line bg-white/80 px-4 text-[13px] active:scale-95">Lưu</button>
        </form>
        <p className="mt-2 text-[11px] text-taupe">Nhập 0 để chặn hẳn một loại. Để trống = theo hạn mức mặc định bên dưới.</p>
      </div>
    </section>
  );
}

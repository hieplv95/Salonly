import { getFooter } from "@/lib/settings";
import { SiteCredit } from "../../SiteCredit";
import { saveFooterAction } from "../actions";

const input = "h-10 w-full rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold";

// Nội dung chân trang: hiện ở trang đăng nhập / đăng ký, menu studio và trang quản trị.
export function FooterCard() {
  const f = getFooter();
  const field = (name: keyof typeof f, label: string, placeholder: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="text-[12px]">
      <span className="mb-1 block text-taupe">{label}</span>
      <input name={name} defaultValue={f[name]} placeholder={placeholder} className={input} {...extra} />
    </label>
  );
  return (
    <section className="rounded-3xl border border-line bg-cream/90 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Chân trang website</p>
      <h2 className="mt-1 font-serif text-[22px] leading-tight">Thông tin thiết kế</h2>
      <p className="mt-1 text-[13px] text-taupe">Hiện ở trang đăng nhập, cuối menu studio và cuối trang quản trị.</p>
      <form action={saveFooterAction} className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">{field("brand", "Tên website", "VD: Salonly AI Studio", { maxLength: 60 })}</div>
        {field("designer", "Thiết kế bởi", "VD: Lê Văn A", { maxLength: 80 })}
        {field("company", "Đơn vị", "VD: Công ty ABC", { maxLength: 80 })}
        {field("website", "Website đơn vị", "VD: abc.vn", { maxLength: 120 })}
        {field("founded", "Năm thành lập", "VD: 2026", { inputMode: "numeric", maxLength: 4, pattern: "(19|20)[0-9]{2}" })}
        <button className="gold-btn col-span-2 h-11 rounded-full text-[14px] font-medium text-cream active:scale-[0.98]">Lưu chân trang</button>
      </form>
      <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/50 p-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-taupe">Xem trước</p>
        <SiteCredit footer={f} />
      </div>
    </section>
  );
}

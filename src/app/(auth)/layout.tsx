import { getFooter } from "@/lib/settings";
import { SiteCredit } from "../SiteCredit";

// Khung chung cho trang đăng nhập và đăng ký.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app-bg flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-baseline justify-center gap-2">
          <span className="font-serif text-[40px] italic leading-none tracking-tight">Salonly</span>
          <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">AI Studio</span>
        </div>
        <div className="fade-up rounded-[28px] border border-line bg-cream/90 p-6 shadow-[0_24px_60px_-30px_rgb(23_22_26/0.45)] sm:p-8">{children}</div>
        <p className="mt-5 text-center text-[11px] text-taupe">Công cụ AI & thiết kế cho tiệm nail</p>
        <SiteCredit footer={getFooter()} className="mt-3 text-center" />
      </div>
    </div>
  );
}

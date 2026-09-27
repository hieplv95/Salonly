import { getCurrentUser } from "@/lib/auth/session";
import { getFooter } from "@/lib/settings";
import { SiteCredit } from "../SiteCredit";
import { logout } from "../(auth)/actions";
import { AdminNav } from "./AdminNav";

// Khung trang quản trị (admin chỉ dùng khu vực này, không vào studio).
// Mỗi trang con tự kiểm tra quyền admin, vì layout không chạy lại khi chuyển trang.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  return (
    <div className="app-bg min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-ivory/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-8">
          <span className="flex items-baseline gap-2">
            <span className="font-serif text-[24px] italic leading-none tracking-tight">Salonly</span>
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">Admin</span>
          </span>
          <AdminNav />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {user && (
              <span className="hidden text-right text-[12px] leading-tight sm:block">
                <b className="block">{user.username}</b>
                <span className="text-taupe">Quản trị viên</span>
              </span>
            )}
            <form action={logout}>
              <button className="rounded-full border border-line bg-cream px-3.5 py-2 text-[12.5px] active:scale-95">Đăng xuất</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      <footer className="mx-auto max-w-6xl border-t border-line/70 px-4 py-5 sm:px-8">
        <SiteCredit footer={getFooter()} />
      </footer>
    </div>
  );
}

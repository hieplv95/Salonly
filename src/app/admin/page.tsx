import type { Metadata } from "next";
import Link from "next/link";
import { guestCustomer, listCustomers, overview, type CustomerRow } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth/session";
import { getDefaultQuotas } from "@/lib/settings";
import { dateTime, sqlDate, usedOf, vnd } from "./format";

export const metadata: Metadata = { title: "Khách hàng · Quản trị Salonly" };

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-cream/90 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe">{label}</p>
      <p className="mt-1.5 font-serif text-[26px] leading-none">{value}</p>
      {note && <p className="mt-1.5 text-[11.5px] text-taupe">{note}</p>}
    </div>
  );
}

const avatar = "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/15 font-serif text-[18px] text-gold";

// Một khách hàng (thành viên): lượt dùng tháng này so với hạn mức và chi phí.
function CustomerCard({ c }: { c: CustomerRow }) {
  const out = (c.limits.image !== null && c.imgMonth >= c.limits.image) || (c.limits.video !== null && c.vidMonth >= c.limits.video);
  return (
    <Link
      href={`/admin/customers/${c.id}`}
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl border bg-cream/90 p-4 transition hover:border-gold/60 ${c.disabled ? "border-rosegold/40 opacity-75" : "border-line"}`}
    >
      <span className={avatar}>{c.username[0]?.toUpperCase()}</span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold">
          <span className="truncate">{c.username}</span>
          {c.disabled ? <span className="rounded-full bg-rosegold/15 px-2 py-0.5 text-[10px] font-semibold text-rosegold">Đã khoá</span> : null}
          {out && !c.disabled ? <span className="rounded-full bg-rosegold/15 px-2 py-0.5 text-[10px] font-semibold text-rosegold">Hết lượt</span> : null}
        </p>
        <p className="truncate text-[12.5px] text-taupe">
          {c.email} · đăng ký {sqlDate(c.created_at)}
        </p>
      </div>
      <dl className="grid w-full grid-cols-3 gap-2 text-[12px] sm:w-auto sm:min-w-[330px]">
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          <dt className="text-taupe">Ảnh / tháng</dt>
          <dd className="font-semibold">{usedOf(c.imgMonth, c.limits.image)}</dd>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          <dt className="text-taupe">Video / tháng</dt>
          <dd className="font-semibold">{usedOf(c.vidMonth, c.limits.video)}</dd>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          <dt className="text-taupe">Chi phí tháng</dt>
          <dd className="font-semibold">{vnd(c.costMonth)}</dd>
        </div>
      </dl>
      <p className="w-full text-[11px] text-taupe sm:w-auto sm:text-right">{c.lastUsed ? `Dùng gần nhất ${dateTime(c.lastUsed)}` : "Chưa tạo ảnh/video"}</p>
    </Link>
  );
}

export default async function CustomersPage({ searchParams }: PageProps<"/admin">) {
  const me = await requireAdmin();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 60) : "";
  const o = overview();
  const customers = listCustomers(search, "member");
  const admins = listCustomers("", "admin");
  const guest = guestCustomer();
  const d = getDefaultQuotas();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Khách hàng" value={`${o.members}`} note={o.locked ? `${o.locked} tài khoản đang bị khoá` : "Thành viên đã đăng ký"} />
        <Stat label="Ảnh tháng này" value={`${o.imgMonth}`} note={`Hạn mức mặc định: ${d.image ?? "không giới hạn"}`} />
        <Stat label="Video tháng này" value={`${o.vidMonth}`} note={`Hạn mức mặc định: ${d.video ?? "không giới hạn"}`} />
        <Stat label="Chi phí tháng này" value={vnd(o.costMonth)} note={`Từ trước tới nay: ${vnd(o.costAll)}`} />
      </div>
      <p className="mt-2 px-1 text-[11px] text-taupe">Chi phí là ước tính theo bảng giá model, hoá đơn thật xem trong Google Cloud Billing.</p>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[28px] leading-tight">Khách hàng</h1>
          <p className="text-[13px] text-taupe">{search ? `${customers.length} kết quả cho “${search}”` : `${customers.length} thành viên đã đăng ký`}</p>
        </div>
        <form className="flex w-full gap-2 sm:w-auto" role="search">
          <input
            name="q"
            defaultValue={search}
            placeholder="Tìm theo tên hoặc email"
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white/80 px-4 text-[13px] outline-none focus:border-gold sm:w-64"
          />
          <button className="h-10 shrink-0 rounded-full border border-line bg-cream px-4 text-[13px] active:scale-95">Tìm</button>
        </form>
      </div>

      <ul className="mt-4 space-y-2.5">
        {customers.map((c) => (
          <li key={c.id}>
            <CustomerCard c={c} />
          </li>
        ))}
        {!customers.length && (
          <li className="rounded-3xl border border-dashed border-line p-8 text-center text-[13px] text-taupe">
            {search ? "Không tìm thấy khách hàng nào." : "Chưa có khách hàng nào đăng ký."}
          </li>
        )}
      </ul>

      {guest && (
        <section className="mt-10">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Khách không đăng nhập</h2>
          <p className="mt-1 px-1 text-[12px] text-taupe">Lượt tạo của người dùng app khi chưa đăng nhập (lúc tắt “Bắt buộc đăng nhập”), tính chung 1 hạn mức.</p>
          <div className="mt-3">
            <CustomerCard c={{ ...guest, username: "Khách vãng lai" }} />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Quản trị viên · {admins.length}</h2>
        <p className="mt-1 px-1 text-[12px] text-taupe">Tài khoản quản trị hệ thống: chỉ vào trang này, không dùng chức năng tạo ảnh / video.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {admins.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/customers/${a.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-cream/70 p-3 transition hover:border-gold/60">
                <span className={avatar}>{a.username[0]?.toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                    <span className="truncate">{a.username}</span>
                    {a.id === me.id && <span className="text-[11px] font-normal text-taupe">(bạn)</span>}
                    {a.disabled ? <span className="rounded-full bg-rosegold/15 px-2 py-0.5 text-[10px] font-semibold text-rosegold">Đã khoá</span> : null}
                  </span>
                  <span className="block truncate text-[12px] text-taupe">{a.email}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

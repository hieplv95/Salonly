import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { customerDetail } from "@/lib/admin-stats";
import { isGuest } from "@/lib/auth/guest";
import { requireAdmin } from "@/lib/auth/session";
import { getDefaultQuotas } from "@/lib/settings";
import { modelLabel } from "@/lib/usage";
import { deleteUser, setDisabled, setRole, setUserQuota } from "../../actions";
import { ConfirmButton } from "../../ConfirmButton";
import { dateTime, sqlDate, usedOf, vnd } from "../../format";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Khách hàng · Quản trị Salonly" };

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-3xl border border-line bg-cream/90 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{title}</h2>
      {note && <p className="mt-1 text-[12px] text-taupe">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const btn = "h-10 w-full rounded-full px-4 text-[13px] font-medium active:scale-95";
const input = "h-10 w-full rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold";

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  const c = customerDetail(Number(id));
  if (!c) notFound();
  const self = c.id === me.id;
  // Tài khoản hệ thống gom lượt của người chưa đăng nhập: chỉ xem thống kê và đặt hạn mức chung.
  const guest = isGuest(c);
  if (guest) c.username = "Khách vãng lai";
  const admin = c.role === "admin";
  const d = getDefaultQuotas();

  return (
    <>
      <Link href="/admin" className="text-[12.5px] text-taupe hover:text-ink">
        ← Danh sách khách hàng
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gold/15 font-serif text-[24px] text-gold">{c.username[0]?.toUpperCase()}</span>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 font-serif text-[28px] leading-tight">
            {c.username}
            <span className={`rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold ${admin ? "gold-btn text-cream" : "bg-line text-taupe"}`}>{admin ? "Admin" : "Thành viên"}</span>
            {c.disabled ? <span className="rounded-full bg-rosegold/15 px-2.5 py-0.5 font-sans text-[11px] font-semibold text-rosegold">Đã khoá</span> : null}
          </h1>
          <p className="text-[13px] text-taupe">
            {c.email} · đăng ký {sqlDate(c.created_at)}
          </p>
        </div>
      </div>

      {admin ? (
        <p className="mt-6 rounded-3xl border border-line bg-cream/90 p-5 text-[13px] text-taupe">
          Đây là tài khoản quản trị hệ thống: chỉ vào được trang quản trị, không dùng chức năng tạo ảnh / video nên không có hạn mức hay chi phí.
        </p>
      ) : (
        <>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Ảnh tháng này", usedOf(c.month.image, c.limits.image)],
          ["Video tháng này", usedOf(c.month.video, c.limits.video)],
          ["Chi phí tháng này", vnd(c.month.cost)],
          ["Tổng chi phí", vnd(c.all.cost)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-line bg-cream/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe">{label}</p>
            <p className="mt-1.5 font-serif text-[24px] leading-none">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 px-1 text-[11px] text-taupe">
        Tổng từ trước tới nay: {c.all.image} ảnh · {c.all.video} video. Chi phí là ước tính theo bảng giá model.
      </p>
        </>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {!admin && (
        <Card title="Hạn mức mỗi tháng" note="Để trống = theo hạn mức mặc định. Nhập 0 để chặn hẳn.">
          <form action={setUserQuota} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <input type="hidden" name="id" value={c.id} />
            <label className="text-[12px]">
              <span className="mb-1 block text-taupe">Lượt ảnh</span>
              <input name="image" type="number" min={0} defaultValue={c.image_quota ?? ""} placeholder={d.image === null ? "Không giới hạn" : `Mặc định ${d.image}`} className={input} />
            </label>
            <label className="text-[12px]">
              <span className="mb-1 block text-taupe">Lượt video</span>
              <input name="video" type="number" min={0} defaultValue={c.video_quota ?? ""} placeholder={d.video === null ? "Không giới hạn" : `Mặc định ${d.video}`} className={input} />
            </label>
            <button className={`${btn} gold-btn text-cream`}>Lưu</button>
          </form>
        </Card>
        )}

        {guest ? (
          <Card title="Khách không đăng nhập">
            <p className="text-[13px] text-taupe">
              Đây là tài khoản hệ thống: gom mọi lượt tạo của người dùng app khi chưa đăng nhập. Hạn mức bên cạnh áp dụng chung cho tất cả họ. Bật/tắt “Bắt buộc đăng nhập” ở trang Cài đặt.
            </p>
          </Card>
        ) : !self ? (
          <Card title="Tài khoản">
            <div className="grid grid-cols-2 gap-2">
              <form action={setDisabled}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="disabled" value={c.disabled ? "0" : "1"} />
                {c.disabled ? (
                  <button className={`${btn} border border-gold/50 text-gold`}>Mở khoá</button>
                ) : (
                  <ConfirmButton message={`Khoá "${c.username}"? Khách sẽ bị đăng xuất và không đăng nhập được cho tới khi mở khoá.`} className={`${btn} border border-rosegold/40 text-rosegold`}>
                    Khoá tài khoản
                  </ConfirmButton>
                )}
              </form>
              <form action={setRole}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="role" value={admin ? "member" : "admin"} />
                <ConfirmButton
                  message={
                    admin
                      ? `Hạ "${c.username}" xuống thành viên? Tài khoản này sẽ vào studio tạo ảnh, không vào được trang quản trị nữa.`
                      : `Nâng "${c.username}" lên admin? Tài khoản này sẽ chỉ vào trang quản trị, không tạo ảnh / video được nữa.`
                  }
                  className={`${btn} border border-line bg-white/70`}
                >
                  {admin ? "Hạ xuống thành viên" : "Nâng lên admin"}
                </ConfirmButton>
              </form>
            </div>
            <div className="mt-4 border-t border-line/70 pt-4">
              <ResetPasswordForm id={c.id} />
            </div>
            <form action={deleteUser} className="mt-4 border-t border-line/70 pt-4">
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton message={`Xoá vĩnh viễn tài khoản "${c.username}" và toàn bộ lịch sử dùng? Không thể hoàn tác.`} className="text-[12.5px] text-rosegold underline-offset-4 hover:underline">
                Xoá tài khoản này
              </ConfirmButton>
            </form>
          </Card>
        ) : (
          <Card title="Tài khoản">
            <p className="text-[13px] text-taupe">Đây là tài khoản của bạn: không tự khoá, tự đổi vai trò hay tự xoá được.</p>
          </Card>
        )}
      </div>

      {!admin && (
      <section className="mt-6">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Lượt tạo gần đây</h2>
        {c.recent.length ? (
          <div className="mt-2 overflow-x-auto rounded-3xl border border-line bg-cream/90">
            <table className="w-full min-w-[480px] text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-[0.1em] text-taupe">
                <tr className="border-b border-line/70">
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">Loại</th>
                  <th className="px-4 py-3 font-semibold">Model</th>
                  <th className="px-4 py-3 text-right font-semibold">Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {c.recent.map((r) => (
                  <tr key={r.id} className="border-b border-line/40 last:border-0">
                    <td className="px-4 py-2.5">{dateTime(r.created_at)}</td>
                    <td className="px-4 py-2.5">{r.kind === "image" ? "Ảnh" : "Video"}</td>
                    <td className="px-4 py-2.5 text-taupe">{modelLabel(r.kind, r.model)}</td>
                    <td className="px-4 py-2.5 text-right">{vnd(r.cost_vnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 rounded-3xl border border-dashed border-line p-6 text-center text-[13px] text-taupe">Khách hàng này chưa tạo ảnh hay video nào.</p>
        )}
      </section>
      )}
    </>
  );
}

import { faqOf, loadSeo } from "@/lib/seo";
import { saveSeoAction } from "../actions";

const input = "h-10 w-full rounded-2xl border border-line bg-white/80 px-3 text-[14px] outline-none focus:border-gold";
const area = "w-full rounded-2xl border border-line bg-white/80 px-3 py-2 text-[13.5px] leading-relaxed outline-none focus:border-gold";
const group = "rounded-2xl border border-line/80 bg-white/40 p-4";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px]">
      <span className="mb-1 block text-taupe">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-snug text-taupe/80">{hint}</span>}
    </label>
  );
}

function Toggle({ name, on, title, desc }: { name: string; on: boolean; title: string; desc: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white/60 p-3">
      <span>
        <b className="block text-[13.5px] font-semibold">{title}</b>
        <span className="text-[11.5px] leading-snug text-taupe">{desc}</span>
      </span>
      <input type="checkbox" name={name} defaultChecked={on} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:left-6" />
    </label>
  );
}

// Cài đặt SEO (Google) và GEO (công cụ tìm kiếm AI + vị trí). Áp dụng cho thẻ <head>, robots.txt, sitemap.xml, llms.txt và JSON-LD.
export async function SeoCard() {
  const { seo: s, base } = await loadSeo();
  const faqCount = faqOf(s).length;
  const host = base.replace(/^https?:\/\//, "");

  return (
    <section className="rounded-3xl border border-line bg-cream/90 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">SEO & GEO</p>
      <h2 className="mt-1 font-serif text-[26px] leading-tight">Hiển thị trên Google & công cụ AI</h2>
      <p className="mt-1 text-[13px] text-taupe">
        SEO giúp website lên Google; GEO giúp ChatGPT, Gemini, Perplexity… hiểu và nhắc tới website khi khách hỏi. Lưu xong áp dụng ngay.
      </p>

      {/* Xem trước kết quả trên Google */}
      <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-taupe">Xem trước trên Google</p>
        <p className="text-[12px] text-[#4d5156]">{host}</p>
        <p className="truncate text-[19px] leading-snug text-[#1a0dab]">{s.title}</p>
        <p className="line-clamp-2 text-[13px] leading-snug text-[#4d5156]">{s.description || "Chưa có mô tả."}</p>
        {!s.indexing && <p className="mt-2 text-[12px] font-semibold text-[#b3261e]">Đang chặn Google: website sẽ không hiện trên kết quả tìm kiếm.</p>}
      </div>

      <form action={saveSeoAction} className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className={`${group} space-y-3`}>
          <h3 className="font-serif text-[18px]">SEO · Google</h3>
          <Field label="Địa chỉ website" hint="Dùng cho sitemap, link chia sẻ và dữ liệu có cấu trúc. Để trống = theo tên miền đang mở.">
            <input name="siteUrl" type="url" defaultValue={s.siteUrl} placeholder="https://salonly.net" className={input} />
          </Field>
          <Field label="Tiêu đề (title)" hint={`${s.title.length}/60 ký tự · nên dưới 60 để không bị Google cắt.`}>
            <input name="title" defaultValue={s.title} maxLength={70} required className={input} />
          </Field>
          <Field label="Mô tả (description)" hint={`${s.description.length}/160 ký tự · câu tóm tắt hiện dưới tiêu đề trên Google.`}>
            <textarea name="description" defaultValue={s.description} maxLength={200} rows={3} className={area} />
          </Field>
          <Field label="Từ khoá" hint="Cách nhau bằng dấu phẩy.">
            <input name="keywords" defaultValue={s.keywords} maxLength={300} className={input} />
          </Field>
          <Field label="Ảnh chia sẻ (Facebook, Zalo…)" hint="Link ảnh 1200×630 px, hoặc đường dẫn trong website như /og.jpg.">
            <input name="ogImage" defaultValue={s.ogImage} placeholder="https://…/anh-chia-se.jpg" className={input} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mã xác minh Google Search Console" hint="Phần content của thẻ google-site-verification.">
              <input name="googleVerification" defaultValue={s.googleVerification} className={input} />
            </Field>
            <Field label="Mã xác minh Bing Webmaster" hint="Phần content của thẻ msvalidate.01.">
              <input name="bingVerification" defaultValue={s.bingVerification} className={input} />
            </Field>
          </div>
          <Toggle name="indexing" on={s.indexing} title="Cho phép Google index" desc="Tắt khi website còn đang thử nghiệm, chưa muốn ai tìm thấy." />
        </div>

        <div className="space-y-4">
          <div className={`${group} space-y-3`}>
            <h3 className="font-serif text-[18px]">GEO · Công cụ tìm kiếm AI</h3>
            <Toggle name="allowAiBots" on={s.allowAiBots} title="Cho phép bot AI đọc website" desc="GPTBot, ClaudeBot, PerplexityBot, Google-Extended… Tắt = chặn trong robots.txt và ẩn /llms.txt." />
            <Field label="Giới thiệu cho AI" hint="2–4 câu rõ ràng: website là gì, dành cho ai, làm được gì. AI hay trích nguyên văn đoạn này.">
              <textarea name="aiSummary" defaultValue={s.aiSummary} maxLength={1000} rows={4} className={area} />
            </Field>
            <Field label={`Câu hỏi thường gặp (${faqCount})`} hint="Mỗi dòng một câu: Câu hỏi | Câu trả lời. Hiện trên Google dạng FAQ và giúp AI trả lời đúng.">
              <textarea name="faq" defaultValue={s.faq} rows={4} placeholder={"Salonly có miễn phí không? | Có, bạn có thể dùng miễn phí các mẫu thiết kế.\nTạo video móng mất bao lâu? | Khoảng 1–2 phút cho mỗi video."} className={area} />
            </Field>
            <Field label="Mạng xã hội" hint="Mỗi dòng một link (Facebook, Instagram, TikTok, YouTube…). Giúp Google và AI nhận ra đúng thương hiệu.">
              <textarea name="sameAs" defaultValue={s.sameAs} rows={3} placeholder={"https://facebook.com/…\nhttps://tiktok.com/@…"} className={area} />
            </Field>
          </div>

          <div className={`${group} space-y-3`}>
            <h3 className="font-serif text-[18px]">Vị trí (local SEO)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mã khu vực" hint="VD: VN-SG (TP.HCM), VN-HN (Hà Nội), ES-CT.">
                <input name="region" defaultValue={s.region} placeholder="VN-SG" maxLength={10} className={input} />
              </Field>
              <Field label="Thành phố / địa danh">
                <input name="placename" defaultValue={s.placename} placeholder="Hồ Chí Minh" maxLength={80} className={input} />
              </Field>
              <Field label="Vĩ độ">
                <input name="latitude" inputMode="decimal" defaultValue={s.latitude} placeholder="10.7769" className={input} />
              </Field>
              <Field label="Kinh độ">
                <input name="longitude" inputMode="decimal" defaultValue={s.longitude} placeholder="106.7009" className={input} />
              </Field>
            </div>
            <p className="text-[11px] text-taupe">Lấy toạ độ: mở Google Maps, nhấp chuột phải vào vị trí và chọn dãy số đầu tiên.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:col-span-2">
          <button className="gold-btn h-11 rounded-full px-8 text-[14px] font-medium text-cream active:scale-[0.98]">Lưu SEO & GEO</button>
          <span className="text-[12px] text-taupe">
            Kiểm tra:{" "}
            {["/robots.txt", "/sitemap.xml", "/llms.txt"].map((p, i) => (
              <span key={p}>
                {i > 0 && " · "}
                <a href={p} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">{p}</a>
              </span>
            ))}
          </span>
        </div>
      </form>
    </section>
  );
}

import type { SiteFooter } from "@/lib/settings";

// Chân trang: tên web, ai thiết kế / đơn vị nào (có link), năm thành lập, bản quyền.
// Dùng được ở cả trang server lẫn client (không đọc dữ liệu, chỉ hiển thị).
export function SiteCredit({ footer, className = "" }: { footer: SiteFooter; className?: string }) {
  const year = new Date().getFullYear();
  const by = [footer.designer, footer.company].filter(Boolean).join(" · ");
  const site = footer.website && /^https?:\/\//.test(footer.website) ? footer.website : footer.website ? `https://${footer.website}` : "";
  return (
    <div className={`text-[11px] leading-relaxed text-taupe ${className}`}>
      {by && (
        <p>
          Được thiết kế bởi{" "}
          {site ? (
            <a href={site} target="_blank" rel="noreferrer" className="font-medium text-ink/80 underline-offset-2 hover:text-gold hover:underline">
              {by}
            </a>
          ) : (
            <span className="font-medium text-ink/80">{by}</span>
          )}
        </p>
      )}
      <p>
        © {footer.founded && footer.founded !== String(year) ? `${footer.founded}–${year}` : year} {footer.brand || "Salonly AI Studio"}
        {footer.founded ? ` · Thành lập năm ${footer.founded}` : ""}
      </p>
    </div>
  );
}

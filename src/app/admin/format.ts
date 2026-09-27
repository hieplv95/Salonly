// Định dạng số, tiền, ngày giờ cho trang quản trị (giờ Việt Nam).

export const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")}đ`;

const TZ = { timeZone: "Asia/Ho_Chi_Minh" } as const;

// SQLite lưu giờ UTC dạng "YYYY-MM-DD HH:MM:SS".
export const sqlDate = (s: string) => new Date(`${s.replace(" ", "T")}Z`).toLocaleDateString("vi-VN", TZ);

export const dateTime = (ms: number) =>
  new Date(ms).toLocaleString("vi-VN", { ...TZ, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

// "3/20" hoặc "3" khi không giới hạn.
export const usedOf = (used: number, limit: number | null) => (limit === null ? `${used}` : `${used}/${limit}`);

// Tiền credit Google Cloud: €243,40 / $300,00.
export const money = (n: number, currency: "EUR" | "USD") =>
  `${currency === "EUR" ? "€" : "$"}${n.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

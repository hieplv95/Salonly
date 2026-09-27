"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, type Role } from "@/lib/auth/db";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { testConnection } from "@/lib/gemini";
import {
  DEFAULT_IMAGE_LOCATION,
  DEFAULT_VIDEO_LOCATION,
  addSource,
  clearAiConfig,
  getAiSources,
  moveSource,
  newToRuntime,
  removeSource,
  setDefaultQuotas,
  setLocations,
  setRequireLogin,
  setFooter,
  setSeo,
  setSourceCredit,
  setSourceEnabled,
  setSourceLabel,
  type Credit,
  type NewSource,
  type ServiceAccount,
} from "@/lib/settings";

// Mỗi thao tác tự kiểm tra quyền admin (không tin vào việc giao diện đã ẩn nút).
// Admin không tự đổi vai trò, tự khoá hay tự xoá mình, nên hệ thống luôn còn ít nhất 1 admin.

const idOf = (fd: FormData) => Number(fd.get("id"));

async function targetId(fd: FormData) {
  const me = await requireAdmin();
  const id = idOf(fd);
  return Number.isInteger(id) && id > 0 && id !== me.id ? id : null;
}

const refresh = (id?: number) => {
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  if (id) revalidatePath(`/admin/customers/${id}`);
};

/* ---------- Khách hàng ---------- */

export async function setRole(fd: FormData) {
  const id = await targetId(fd);
  const role = fd.get("role") as Role;
  if (!id || (role !== "admin" && role !== "member")) return;
  db().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  refresh(id);
}

export async function setDisabled(fd: FormData) {
  const id = await targetId(fd);
  if (!id) return;
  const disabled = fd.get("disabled") === "1" ? 1 : 0;
  db().prepare("UPDATE users SET disabled = ? WHERE id = ?").run(disabled, id);
  // Khoá thì đăng xuất ngay mọi thiết bị của tài khoản đó.
  if (disabled) db().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  refresh(id);
}

// Ô để trống = dùng hạn mức mặc định.
const quotaField = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Math.floor(Number(s));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100000) : null;
};

export async function setUserQuota(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (!Number.isInteger(id)) return;
  db().prepare("UPDATE users SET image_quota = ?, video_quota = ? WHERE id = ?").run(quotaField(fd.get("image")), quotaField(fd.get("video")), id);
  refresh(id);
}

export type FormResult = { ok?: string; error?: string } | undefined;

export async function resetPassword(_: FormResult, fd: FormData): Promise<FormResult> {
  const id = await targetId(fd);
  if (!id) return { error: "Không đặt lại được mật khẩu cho tài khoản này." };
  const password = String(fd.get("password") ?? "");
  if (password.length < 6) return { error: "Mật khẩu mới tối thiểu 6 ký tự." };
  if (password.length > 72) return { error: "Mật khẩu tối đa 72 ký tự." };
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), id);
  // Đăng xuất các thiết bị đang dùng mật khẩu cũ.
  db().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  return { ok: "Đã đặt mật khẩu mới. Hãy gửi mật khẩu này cho khách hàng." };
}

export async function deleteUser(fd: FormData) {
  const id = await targetId(fd);
  if (!id) return;
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
  refresh();
  redirect("/admin");
}

/* ---------- Chân trang website ---------- */

export async function saveFooterAction(fd: FormData) {
  await requireAdmin();
  const v = (k: string, max = 80) => String(fd.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const founded = v("founded", 4);
  setFooter({
    brand: v("brand", 60),
    designer: v("designer"),
    company: v("company"),
    website: v("website", 120),
    founded: /^(19|20)\d{2}$/.test(founded) ? founded : "",
  });
  revalidatePath("/", "layout");
}

/* ---------- SEO & GEO ---------- */

export async function saveSeoAction(fd: FormData) {
  await requireAdmin();
  const v = (k: string, max: number) => String(fd.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const block = (k: string, max: number) => String(fd.get(k) ?? "").replace(/\r/g, "").trim().slice(0, max);
  const url = (s: string) => (/^https?:\/\/\S+$/.test(s) ? s.replace(/\/+$/, "") : "");
  const coord = (s: string, lim: number) => (s && Number.isFinite(Number(s)) && Math.abs(Number(s)) <= lim ? String(Number(s)) : "");
  const region = v("region", 10).toUpperCase();
  const ogImage = v("ogImage", 300);
  setSeo({
    siteUrl: url(v("siteUrl", 200)),
    title: v("title", 70) || "Salonly · AI Studio",
    description: v("description", 200),
    keywords: v("keywords", 300),
    ogImage: ogImage.startsWith("/") ? ogImage : url(ogImage),
    indexing: fd.get("indexing") === "on",
    googleVerification: v("googleVerification", 100).replace(/[^\w-]/g, ""),
    bingVerification: v("bingVerification", 100).replace(/[^\w-]/g, ""),
    allowAiBots: fd.get("allowAiBots") === "on",
    aiSummary: v("aiSummary", 1000),
    faq: block("faq", 4000),
    sameAs: block("sameAs", 1500),
    region: /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(region) ? region : "",
    placename: v("placename", 80),
    latitude: coord(v("latitude", 20), 90),
    longitude: coord(v("longitude", 20), 180),
  });
  revalidatePath("/", "layout");
}

/* ---------- Bắt buộc đăng nhập ---------- */

export async function requireLoginAction(fd: FormData) {
  await requireAdmin();
  setRequireLogin(fd.get("on") === "1");
  revalidatePath("/", "layout");
}

/* ---------- Hạn mức mặc định ---------- */

export async function saveDefaultQuotas(fd: FormData) {
  await requireAdmin();
  setDefaultQuotas({ image: quotaField(fd.get("image")), video: quotaField(fd.get("video")) });
  revalidatePath("/admin", "layout");
}

/* ---------- Nguồn AI (Google Cloud) ---------- */

export type TestResult = { id: string; name: string; ok: boolean; message: string };
export type SourceResult = { error?: string; ok?: string; tests?: TestResult[] } | undefined;

const PROJECT_RE = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const LOCATION_RE = /^[a-z0-9-]{2,30}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Số tiền kiểu "€243,40", "243.40", "1.234,56" → 243.4 / 1234.56.
function parseMoney(v: string) {
  let s = v.replace(/[^\d.,]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

// Credit nhập trên form: số dư hiện tại (chép từ Google Cloud) tính từ bây giờ.
function readCredit(fd: FormData): Credit | null {
  const amount = parseMoney(str(fd, "amount"));
  if (!amount) return null;
  const currency = str(fd, "currency") === "USD" ? "USD" : "EUR";
  const expires = str(fd, "expires");
  const reserve = parseMoney(str(fd, "reserve"));
  return { amount, currency, since: Date.now(), ...(DATE_RE.test(expires) && { expires }), ...(reserve && { reserve }) };
}

async function readNewSource(fd: FormData): Promise<{ source: NewSource } | { error: string }> {
  const kind = str(fd, "kind") === "studio" ? "studio" : "vertex";
  const label = str(fd, "label").slice(0, 40);
  const credit = readCredit(fd) ?? undefined;
  if (kind === "studio") {
    const apiKey = str(fd, "apiKey");
    if (!/^[\w.-]{20,200}$/.test(apiKey)) return { error: "API key không hợp lệ." };
    return { source: { kind, label, apiKey, credit } };
  }
  let serviceAccount: ServiceAccount | undefined;
  if (str(fd, "auth") === "key") {
    const file = fd.get("keyFile");
    if (!(file instanceof File) || !file.size) return { error: "Chọn file khoá .json của service account." };
    if (file.size > 50_000) return { error: "File khoá quá lớn, hãy chọn đúng file .json của service account." };
    try {
      const json = JSON.parse(await file.text());
      if (json.type !== "service_account" || !json.client_email || !json.private_key) throw new Error();
      serviceAccount = { client_email: json.client_email, private_key: json.private_key, project_id: json.project_id };
    } catch {
      return { error: "File khoá không đúng: cần file .json tải từ Google Cloud → IAM → Service accounts → Keys." };
    }
  }
  // Project ID để trống thì lấy theo file khoá.
  const project = str(fd, "project") || serviceAccount?.project_id || "";
  if (!PROJECT_RE.test(project)) return { error: "Project ID chỉ gồm chữ thường, số và dấu gạch ngang (6–30 ký tự)." };
  return { source: { kind, label, project, serviceAccount, credit } };
}

// Thêm nguồn: luôn kiểm tra kết nối trước; nút "Kiểm tra" chỉ thử, không lưu.
export async function addSourceAction(_: SourceResult, fd: FormData): Promise<SourceResult> {
  await requireAdmin();
  const form = await readNewSource(fd);
  if ("error" in form) return { error: form.error };
  const tests = await testConnection([newToRuntime(form.source)]);
  if (fd.get("intent") !== "save") return { tests };
  try {
    addSource(form.source);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thêm được nguồn.", tests };
  }
  revalidatePath("/admin/settings");
  return { ok: tests[0]?.ok ? "Đã thêm nguồn và kết nối được." : "Đã thêm nguồn nhưng kiểm tra kết nối lỗi, xem lại thông tin bên dưới.", tests };
}

// Các nút trên từng nguồn: lên / xuống / bật tắt / xoá / đổi tên.
export async function sourceAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const intent = str(fd, "intent");
  if (!id) return;
  if (intent === "up" || intent === "down") moveSource(id, intent === "up" ? -1 : 1);
  else if (intent === "enable" || intent === "disable") setSourceEnabled(id, intent === "enable");
  else if (intent === "remove") removeSource(id);
  else if (intent === "label") setSourceLabel(id, str(fd, "label").slice(0, 40));
  revalidatePath("/admin/settings");
}

export async function creditAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  setSourceCredit(id, fd.get("intent") === "clear" ? null : readCredit(fd));
  revalidatePath("/admin/settings");
}

export async function testAllAction(): Promise<SourceResult> {
  await requireAdmin();
  return { tests: await testConnection(getAiSources().sources) };
}

export async function locationsAction(fd: FormData) {
  await requireAdmin();
  const image = str(fd, "imageLocation") || DEFAULT_IMAGE_LOCATION;
  const video = str(fd, "videoLocation") || DEFAULT_VIDEO_LOCATION;
  if (LOCATION_RE.test(image) && LOCATION_RE.test(video)) setLocations(image, video);
  revalidatePath("/admin/settings");
}

export async function resetGoogle() {
  await requireAdmin();
  clearAiConfig();
  revalidatePath("/admin/settings");
}

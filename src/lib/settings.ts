import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./auth/db";
import { decrypt, encrypt } from "./secret";

/* ---------- Bảng cài đặt chung (key → value) ---------- */

export function getSetting(key: string): string | null {
  const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null) {
  if (value === null) db().prepare("DELETE FROM settings WHERE key = ?").run(key);
  else db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

/* ---------- Chân trang website (ai thiết kế, đơn vị nào, năm thành lập) ---------- */

export type SiteFooter = { brand: string; designer: string; company: string; website: string; founded: string };
export const DEFAULT_FOOTER: SiteFooter = { brand: "Salonly AI Studio", designer: "", company: "", website: "", founded: "" };

export function getFooter(): SiteFooter {
  const raw = getSetting("site_footer");
  return raw ? { ...DEFAULT_FOOTER, ...(JSON.parse(raw) as Partial<SiteFooter>) } : DEFAULT_FOOTER;
}

export const setFooter = (f: SiteFooter) => setSetting("site_footer", JSON.stringify(f));

/* ---------- Bắt buộc đăng nhập ----------
 * Tắt (mặc định): ai mở app cũng dùng được, lượt tạo tính vào tài khoản "Khách vãng lai" dùng chung.
 * Bật: phải có tài khoản và đăng nhập. */

export const getRequireLogin = () => getSetting("require_login") === "1";
export const setRequireLogin = (on: boolean) => setSetting("require_login", on ? "1" : "0");

/* ---------- Hạn mức mặc định cho thành viên (lượt / tháng; null = không giới hạn) ---------- */

export type Quotas = { image: number | null; video: number | null };

const toQuota = (v: string | null) => (v === null || v === "" ? null : Math.max(0, Math.floor(Number(v))) || 0);

export function getDefaultQuotas(): Quotas {
  return { image: toQuota(getSetting("quota_image")), video: toQuota(getSetting("quota_video")) };
}

export function setDefaultQuotas(q: Quotas) {
  setSetting("quota_image", q.image === null ? null : String(q.image));
  setSetting("quota_video", q.video === null ? null : String(q.video));
}

/* ---------- Nguồn AI (Google Cloud) ----------
 * Danh sách nguồn dùng lần lượt theo thứ tự: project Vertex AI (tài khoản chính, phụ…) và API key AI Studio.
 * Admin quản lý trên web; chưa lưu gì thì đọc .env.local như trước.
 * Khoá service account và API key được mã hoá trước khi lưu. */

export type ServiceAccount = { client_email: string; private_key: string; project_id?: string };
export type Currency = "EUR" | "USD";

// Credit của 1 nguồn: số dư tại thời điểm "since" (admin chép từ Google Cloud), app trừ dần theo lượt tạo.
export type Credit = { amount: number; currency: Currency; since: number; expires?: string; reserve?: number };

// Nguồn đã giải mã để tạo client (chỉ dùng trên server).
export type RuntimeSource = {
  id: string;
  label: string;
  kind: "vertex" | "studio";
  enabled: boolean;
  project?: string;
  credentials?: ServiceAccount;
  keyFilename?: string;
  apiKey?: string;
  imageLocation: string;
  videoLocation: string;
  credit?: Credit;
};

// version đổi mỗi khi cấu hình đổi (để tạo lại client).
export type AiSources = { origin: "admin" | "env"; version: string; sources: RuntimeSource[] };

type StoredSource = {
  id: string;
  label: string;
  kind: "vertex" | "studio";
  enabled: boolean;
  project?: string;
  keyEnc?: string; // service account (mã hoá)
  keyEmail?: string;
  keyFilename?: string; // đường dẫn file khoá trên máy chủ (nhập từ .env.local)
  apiKeyEnc?: string;
  hint?: string;
  credit?: Credit;
};

type StoredAi = { v: 2; imageLocation: string; videoLocation: string; sources: StoredSource[]; updatedAt: number };

// Bản lưu cũ (1 project + danh sách key).
type StoredAiV1 = {
  project: string;
  imageLocation: string;
  videoLocation: string;
  keyEnc?: string;
  keyEmail?: string;
  apiKeys?: { enc: string; hint: string }[];
  apiKeyEnc?: string;
  apiKeyHint?: string;
  updatedAt: number;
};

// Thông tin an toàn để hiện trên trang admin (không có khoá bí mật).
export type SourceView = Omit<StoredSource, "keyEnc" | "apiKeyEnc"> & { auth: "adc" | "key" | "file" | "apikey"; name: string };
export type AiView = { origin: "admin" | "env"; imageLocation: string; videoLocation: string; sources: SourceView[]; updatedAt?: number };

// Nguồn mới admin thêm trên form (phần bí mật ở dạng rõ).
export type NewSource = { kind: "vertex" | "studio"; label: string; project?: string; serviceAccount?: ServiceAccount; apiKey?: string; credit?: Credit };

const AI_KEY = "ai_config";
const list = (v?: string) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
export const DEFAULT_IMAGE_LOCATION = "global";
export const DEFAULT_VIDEO_LOCATION = "us-central1";
export const MAX_SOURCES = 12;
export const keyHint = (key: string) => `…${key.slice(-4)}`;
const newId = () => randomBytes(4).toString("hex");

// Tên hiển thị: tên gợi nhớ, không có thì project / đuôi API key.
export const sourceName = (s: Pick<StoredSource, "label" | "kind" | "project" | "hint">) =>
  s.label || (s.kind === "vertex" ? (s.project ?? "Vertex") : `API key ${s.hint ?? ""}`);

function fromV1(o: StoredAiV1): StoredAi {
  const keys = o.apiKeys ?? (o.apiKeyEnc ? [{ enc: o.apiKeyEnc, hint: o.apiKeyHint ?? "" }] : []);
  return {
    v: 2,
    imageLocation: o.imageLocation,
    videoLocation: o.videoLocation,
    updatedAt: o.updatedAt,
    sources: [
      ...(o.project ? [{ id: newId(), label: "", kind: "vertex" as const, enabled: true, project: o.project, keyEnc: o.keyEnc, keyEmail: o.keyEmail }] : []),
      ...keys.map((k) => ({ id: newId(), label: "", kind: "studio" as const, enabled: true, apiKeyEnc: k.enc, hint: k.hint })),
    ],
  };
}

function readStored(): StoredAi | null {
  const raw = getSetting(AI_KEY);
  if (!raw) return null;
  const o = JSON.parse(raw) as StoredAi | StoredAiV1;
  return "v" in o && o.v === 2 ? o : fromV1(o as StoredAiV1);
}

function writeStored(s: StoredAi) {
  setSetting(AI_KEY, JSON.stringify({ ...s, updatedAt: Date.now() }));
}

// Nguồn khai báo trong .env.local (dạng đã lưu, để nhập sang cấu hình trên web).
function envStored(): StoredAi {
  const imageLocation = process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_IMAGE_LOCATION;
  const videoLocation = process.env.VEO_LOCATION || DEFAULT_VIDEO_LOCATION;
  return {
    v: 2,
    imageLocation,
    videoLocation,
    updatedAt: 0,
    sources: [
      ...list(process.env.GOOGLE_CLOUD_PROJECT).map((entry): StoredSource => {
        const [project, keyFilename] = entry.split("@");
        return { id: `env-${project}`, label: "", kind: "vertex", enabled: true, project, ...(keyFilename && { keyFilename }) };
      }),
      ...list(process.env.GEMINI_API_KEY).map((k, i): StoredSource => ({ id: `env-key-${i + 1}`, label: "", kind: "studio", enabled: true, hint: keyHint(k) })),
    ],
  };
}

function toRuntime(s: StoredSource, ai: Pick<StoredAi, "imageLocation" | "videoLocation">, envKey?: string): RuntimeSource {
  return {
    id: s.id,
    label: sourceName(s),
    kind: s.kind,
    enabled: s.enabled,
    imageLocation: ai.imageLocation,
    videoLocation: ai.videoLocation,
    ...(s.project && { project: s.project }),
    ...(s.keyEnc && { credentials: JSON.parse(decrypt(s.keyEnc)) as ServiceAccount }),
    ...(s.keyFilename && { keyFilename: s.keyFilename }),
    ...(s.apiKeyEnc ? { apiKey: decrypt(s.apiKeyEnc) } : envKey ? { apiKey: envKey } : {}),
    ...(s.credit && { credit: s.credit }),
  };
}

export function getAiSources(): AiSources {
  const s = readStored();
  if (s) return { origin: "admin", version: `admin:${s.updatedAt}`, sources: s.sources.map((x) => toRuntime(x, s)) };
  const env = envStored();
  const keys = list(process.env.GEMINI_API_KEY);
  const fingerprint = [process.env.GOOGLE_CLOUD_PROJECT, process.env.GEMINI_API_KEY, env.imageLocation, env.videoLocation].join("|");
  let k = 0;
  return {
    origin: "env",
    version: `env:${createHash("sha256").update(fingerprint).digest("hex").slice(0, 16)}`,
    sources: env.sources.map((x) => toRuntime(x, env, x.kind === "studio" ? keys[k++] : undefined)),
  };
}

export function getAiView(): AiView {
  const s = readStored();
  const src = s ?? envStored();
  return {
    origin: s ? "admin" : "env",
    imageLocation: src.imageLocation,
    videoLocation: src.videoLocation,
    ...(s && { updatedAt: s.updatedAt }),
    sources: src.sources.map((x) => {
      const v: Partial<StoredSource> = { ...x };
      delete v.keyEnc;
      delete v.apiKeyEnc;
      return { ...(v as SourceView), name: sourceName(x), auth: x.kind === "studio" ? "apikey" : x.keyEnc ? "key" : x.keyFilename ? "file" : "adc" };
    }),
  };
}

// Nguồn mới → dạng chạy thử (để kiểm tra kết nối trước khi thêm).
export function newToRuntime(n: NewSource, locations?: Pick<StoredAi, "imageLocation" | "videoLocation">): RuntimeSource {
  const loc = locations ?? readStored() ?? envStored();
  return {
    id: "test",
    label: n.label || (n.kind === "vertex" ? (n.project ?? "Vertex") : `API key ${keyHint(n.apiKey ?? "")}`),
    kind: n.kind,
    enabled: true,
    imageLocation: loc.imageLocation,
    videoLocation: loc.videoLocation,
    ...(n.project && { project: n.project }),
    ...(n.serviceAccount && { credentials: n.serviceAccount }),
    ...(n.apiKey && { apiKey: n.apiKey }),
  };
}

// Mọi thay đổi đều ghi vào cấu hình trên web; lần đầu thì chép nguồn từ .env.local sang (mã hoá key).
function editable(): StoredAi {
  const s = readStored();
  if (s) return s;
  const env = envStored();
  const keys = list(process.env.GEMINI_API_KEY);
  let k = 0;
  return {
    ...env,
    // Giữ nguyên mã nguồn (env-…) để thao tác đầu tiên (VD: nhập credit) tìm đúng nguồn.
    sources: env.sources.map((x) => ({ ...x, ...(x.kind === "studio" && { apiKeyEnc: encrypt(keys[k++]) }) })),
  };
}

export function addSource(n: NewSource) {
  const s = editable();
  if (s.sources.length >= MAX_SOURCES) throw new Error(`Tối đa ${MAX_SOURCES} nguồn.`);
  if (n.kind === "vertex" && s.sources.some((x) => x.kind === "vertex" && x.project === n.project)) throw new Error("Project này đã có trong danh sách.");
  if (n.apiKey && s.sources.some((x) => x.apiKeyEnc && decrypt(x.apiKeyEnc) === n.apiKey)) throw new Error("API key này đã có trong danh sách.");
  s.sources.push({
    id: newId(),
    label: n.label,
    kind: n.kind,
    enabled: true,
    ...(n.project && { project: n.project }),
    ...(n.serviceAccount && { keyEnc: encrypt(JSON.stringify(n.serviceAccount)), keyEmail: n.serviceAccount.client_email }),
    ...(n.apiKey && { apiKeyEnc: encrypt(n.apiKey), hint: keyHint(n.apiKey) }),
    ...(n.credit && { credit: n.credit }),
  });
  writeStored(s);
}

// Sửa 1 nguồn theo id (hàm fn trả về nguồn mới, hoặc null để xoá).
function updateSource(id: string, fn: (x: StoredSource) => StoredSource | null) {
  const s = editable();
  s.sources = s.sources.flatMap((x) => (x.id === id ? (fn(x) ?? []) : [x]));
  writeStored(s);
}

export const removeSource = (id: string) => updateSource(id, () => null);
export const setSourceEnabled = (id: string, enabled: boolean) => updateSource(id, (x) => ({ ...x, enabled }));
export const setSourceLabel = (id: string, label: string) => updateSource(id, (x) => ({ ...x, label }));
export const setSourceCredit = (id: string, credit: Credit | null) =>
  updateSource(id, (x) => {
    const next = { ...x };
    delete next.credit;
    return credit ? { ...next, credit } : next;
  });

// Đổi thứ tự ưu tiên: dir = -1 (lên trước) hoặc 1 (xuống sau).
export function moveSource(id: string, dir: -1 | 1) {
  const s = editable();
  const i = s.sources.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= s.sources.length) return;
  [s.sources[i], s.sources[j]] = [s.sources[j], s.sources[i]];
  writeStored(s);
}

export function setLocations(imageLocation: string, videoLocation: string) {
  writeStored({ ...editable(), imageLocation, videoLocation });
}

// Chép nguồn từ .env.local sang cấu hình trên web (để quản lý, thêm credit…).
export const importEnvConfig = () => writeStored(editable());

// Bỏ cấu hình trên web, quay lại dùng .env.local.
export const clearAiConfig = () => setSetting(AI_KEY, null);

import "server-only";
import { GoogleAuth } from "google-auth-library";
import type { RuntimeSource } from "./settings";

// Trạng thái thanh toán của project qua Cloud Billing API. API này chỉ cho biết thanh toán
// đang bật hay tắt (tắt = hết credit dùng thử / tài khoản bị đóng → AI ngừng chạy),
// không có số dư. Cần bật "Cloud Billing API" trong project.

export type BillingStatus =
  | { state: "enabled" | "disabled"; project: string }
  | { state: "api-off"; project: string; enableUrl: string }
  | { state: "error"; project: string; message: string };

const TTL = 5 * 60_000; // hỏi lại Google tối đa 5 phút/lần
const g = globalThis as unknown as { __billing?: Map<string, { at: number; status: BillingStatus }> };
const cache = (g.__billing ??= new Map());

export async function billingStatus(v: Pick<RuntimeSource, "credentials" | "keyFilename"> & { project: string }): Promise<BillingStatus> {
  const hit = cache.get(v.project);
  if (hit && Date.now() - hit.at < TTL) return hit.status;

  let status: BillingStatus;
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      ...(v.credentials ? { credentials: v.credentials } : v.keyFilename ? { keyFilename: v.keyFilename } : {}),
    });
    const client = await auth.getClient();
    const res = await client.request<{ billingEnabled?: boolean }>({
      url: `https://cloudbilling.googleapis.com/v1/projects/${encodeURIComponent(v.project)}/billingInfo`,
      timeout: 8000,
    });
    status = { state: res.data.billingEnabled ? "enabled" : "disabled", project: v.project };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    status = /has not been used|is disabled|SERVICE_DISABLED/i.test(msg)
      ? { state: "api-off", project: v.project, enableUrl: `https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com?project=${encodeURIComponent(v.project)}` }
      : { state: "error", project: v.project, message: /PERMISSION_DENIED|403/.test(msg) ? "Tài khoản không có quyền xem thông tin thanh toán." : "Không đọc được trạng thái thanh toán." };
  }
  cache.set(v.project, { at: Date.now(), status });
  return status;
}

export const billingConsoleUrl = (project: string) => `https://console.cloud.google.com/billing/linkedaccount?project=${encodeURIComponent(project)}`;

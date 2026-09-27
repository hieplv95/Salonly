import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getFooter, getRequireLogin } from "@/lib/settings";
import { quotaSummary } from "@/lib/usage";
import { Studio } from "./Studio";

// Trang chính (studio) dành cho thành viên; admin quản trị hệ thống nên chuyển sang /admin.
// Admin tắt "Bắt buộc đăng nhập" thì người chưa đăng nhập vẫn dùng được (tính là khách vãng lai).
export default async function Home() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  if (!user && getRequireLogin()) redirect("/login");
  return <Studio user={user} quota={user ? quotaSummary(user) : null} footer={getFooter()} />;
}

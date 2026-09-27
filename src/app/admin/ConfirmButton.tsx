"use client";

// Nút gửi form, hỏi xác nhận trước (dùng cho thao tác không hoàn tác được như xoá tài khoản).
export function ConfirmButton({ message, children, className }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={className ?? "h-9 w-full rounded-full border border-rosegold/40 px-4 text-[12.5px] text-rosegold active:scale-95"}
    >
      {children}
    </button>
  );
}

import type { AuctionStatus, ProductCondition } from "./types";

export const formatMoney = (value: number | string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value));

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function countdown(endTime: string) {
  const remaining = Math.max(0, new Date(endTime).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days ? `${days}n ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const statusLabel: Record<AuctionStatus, string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  SCHEDULED: "Sắp diễn ra",
  ACTIVE: "Đang đấu giá",
  ENDED: "Đã kết thúc",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
};

export const conditionLabel: Record<ProductCondition, string> = {
  NEW: "Mới",
  LIKE_NEW: "Như mới",
  USED: "Đã sử dụng",
  REFURBISHED: "Tân trang",
};

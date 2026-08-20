export type AuctionStatus =
  | "PENDING_APPROVAL"
  | "SCHEDULED"
  | "ACTIVE"
  | "ENDED"
  | "REJECTED"
  | "CANCELLED";

export type ProductCondition = "NEW" | "LIKE_NEW" | "USED" | "REFURBISHED";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  userId: number;
  email: string;
  displayName: string;
  roles: string[];
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  sellerId: number;
  sellerName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  condition: ProductCondition;
  createdAt: string;
}

export interface Auction {
  id: number;
  productId: number;
  productName: string;
  sellerId: number;
  sellerName: string;
  startingPrice: number;
  currentPrice: number;
  minimumIncrement: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  winningBidId: number | null;
  winnerId: number | null;
  version: number;
}

export interface Bid {
  id: number;
  auctionId: number;
  bidderId: number;
  bidderName: string;
  amount: number;
  clientRequestId: string;
  placedAt: string;
}

export interface BidUpdate {
  type: "BID_PLACED" | "AUCTION_STATUS_CHANGED";
  auctionId: number;
  bidId?: number;
  bidderId?: number;
  bidderName?: string;
  currentPrice?: number;
  placedAt?: string;
  status?: AuctionStatus;
}

export interface NotificationItem {
  id: number;
  auctionId: number | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ApiErrorPayload {
  status?: number;
  code?: string;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export type DateFilter = '7d' | '30d' | '90d' | 'all' | 'custom';

export interface StatsOverview {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalStudents: number;
  totalSold: number;
  totalRentals: number;
  earningsChange: number;
  studentsChange: number;
}

export interface EarningsPoint {
  date: string;
  earnings: number;
  sales: number;
}

export interface LecturePerformance {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  pricingModel: 'free' | 'subscription' | 'rent';
  currency: string;
  totalSales: number;
  totalRevenue: number;
  rentCount: number;
  buyCount: number;
  studentsEnrolled: number;
  views: number;
  conversionRate: number;
}

export interface Transaction {
  id: string;
  studentName: string;
  studentEmail: string;
  lectureTitle: string;
  lectureThumbnail: string;
  amount: number;
  platformFee: number;
  teacherEarning: number;
  date: string;
  paymentId: string;
  type: 'buy' | 'rent';
  status: 'success' | 'pending' | 'failed';
}

export interface WalletData {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

export interface RevenueSplit {
  teacherShare: number;
  platformShare: number;
}
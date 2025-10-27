export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  customer_type: 'Bireysel' | 'Kurumsal';
  status: 'Aktif' | 'Pasif' | 'Beklemede';
  address: string;
  city: string;
  country: string;
  join_date: string;
  total_income: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // For compatibility with existing code
  name?: string;
  totalRevenue?: string;
  projectStatus?: 'ongoing' | 'completed' | 'paused';
  activeProjects?: number;
  completedProjects?: number;
  logo?: string;
}

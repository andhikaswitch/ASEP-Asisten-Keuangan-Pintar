export interface Transaction {
  id: string;
  date: string;
  category: string;
  description: string;
  income: number;
  expense: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export type Category = 
  | 'Gaji' 
  | 'Makan dan Minum' 
  | 'Transport' 
  | 'Belanja' 
  | 'Tagihan' 
  | 'Hiburan' 
  | 'Freelance' 
  | 'Lain-lain';

export type TabType = 'chat' | 'report' | 'stats';

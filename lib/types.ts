// Types para o sistema farmacêutico
export type ReportItem = {
  id: string
  formNorm?: string
  linha?: string
  horario?: string
  vendedor?: string
  quantidade?: number
  valor?: number
  categoria?: string
  observacoes?: string
  sourceFile?: string
  rowIndex?: number
  isMapped: boolean
}

export type ProcessedData = {
  items: ReportItem[]
  kpis: {
    totalQuantity: number
    totalValue: number
    solidCount: number
    topSeller?: string
  }
}

export type KanbanItem = {
  id: string
  title: string
  category: string
  quantity: number
  value: number
  seller: string
  status: 'pending' | 'processing' | 'completed'
}

export type SellerData = {
  name: string
  totalQuantity: number
  totalValue: number
  categories: string[]
}

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

export type AnalyticsData = {
  trends: {
    date: string
    quantity: number
    value: number
  }[]
  sellers: SellerData[]
  categories: {
    name: string
    quantity: number
    percentage: number
  }[]
}

export type ProductionMetric = {
  id: string
  timeSlot: string
  category: string
  capacity: number
  isActive: boolean
}

export type DefaulterItem = {
  id: string
  name: string
  phone: string
  dueDate: Date
  amount: number
  status: 'pending' | 'contacted' | 'paid' | 'cancelled'
  description?: string
}

export type ProcessingHistoryItem = {
  id: string;
  form_norm: string;
  quantidade: number;
  created_at: string;
};

export type LastProcessingItem = {
  report_date: string;
  total_quantity: number;
  processed_at: string;
};

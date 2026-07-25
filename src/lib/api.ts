const API_BASE = "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: Record<string, unknown> | BodyInit | null } = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const { body: bodyParam, ...rest } = options as RequestInit & { body?: Record<string, unknown> | string };
  const fetchBody =
    bodyParam !== undefined
      ? typeof bodyParam === "string"
        ? bodyParam
        : JSON.stringify(bodyParam)
      : undefined;
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, body: fetchBody });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-logout"));
    }
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }
  return data as T;
}

export type DashboardSummary = {
  totalInvoices: number;
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  profitAfterExpenses: number;
};

export type ExpenseItem = {
  _id: string;
  expenseName: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
};

export type ExpensesResponse = {
  expenses: ExpenseItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type RidaPopulated = {
  _id: string;
  ridaName: string;
  price: number;
  profit: number;
  ridaImage?: string;
};

export type InvoiceItem = {
  _id: string;
  invoiceNumber: string;
  ridaId: string | RidaPopulated;
  quantity?: number;
  customer: string;
  reseller: string;
  amount: number;
  profit: number;
  address?: string;
  isAddressPrinted?: boolean;
  addressPrintedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoicesResponse = {
  invoices: InvoiceItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type AddressItem = {
  id: string;
  address: string;
  isAddressPrinted?: boolean;
  addressPrintedAt?: string | null;
};

export type AddressesResponse = {
  addresses: AddressItem[];
};

export type RidaItem = {
  _id: string;
  ridaName: string;
  price: number;
  profit: number;
  ridaImage?: string;
  createdAt: string;
  updatedAt: string;
};

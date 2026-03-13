import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const createInvoiceSchema = z.object({
  ridaId: z.string().min(1, "Rida is required"),
  customer: z.string().min(1, "Customer is required"),
  reseller: z.string().min(1, "Reseller is required"),
  amount: z.number().min(0),
  profit: z.number(),
  address: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  ridaId: z.string().min(1).optional(),
  customer: z.string().min(1).optional(),
  reseller: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  profit: z.number().optional(),
  address: z.string().optional(),
});

export const searchFieldEnum = z.enum(["invoiceNumber", "customer", "reseller"]);
export type SearchField = z.infer<typeof searchFieldEnum>;

export const queryInvoicesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  searchField: searchFieldEnum.optional(),
  dateFrom: z.string().optional(), // ISO date YYYY-MM-DD
  dateTo: z.string().optional(),
  ridaId: z.string().optional(), // filter by Rida
});

export const createRidaSchema = z.object({
  ridaName: z.string().min(1, "Rida name is required"),
  price: z.number().min(0),
  profit: z.number(),
  ridaImage: z.string().url().optional(),
});
export const updateRidaSchema = createRidaSchema.partial();

export const dashboardSummaryQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type QueryInvoicesInput = z.infer<typeof queryInvoicesSchema>;
export type CreateRidaInput = z.infer<typeof createRidaSchema>;
export type UpdateRidaInput = z.infer<typeof updateRidaSchema>;

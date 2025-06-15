import { z } from 'zod';

export const transactionSchema = z
  .object({
    amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),

    source: z.enum(['Cash', 'Bank Account', 'Other'], {
      required_error: 'Source is required',
    }),

    source_detail: z.string().max(100, 'Source detail too long').optional(),

    payment_app: z.enum(['PhonePe', 'GPay', 'AmazonPay', 'Paytm', 'RazorPay', 'Other']).optional(),

    description: z.string().min(1, 'Description is required'),

    category_id: z.string({ required_error: 'Category ID is required' }),

    category_type: z.enum(['income', 'expense'], {
      required_error: 'Category type is required',
    }),

    category_name: z.string({ required_error: 'Category name is required' }),

    status: z.enum(['Pending', 'Success', 'Failed']).default('Pending'),

    transaction_date: z
      .string({ required_error: 'Transaction date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid transaction date format',
      }),
  })
  .refine(
    (data) => {
      if (data.source === "Bank Account") {
        return !!data.source_detail?.trim();
      }
      return true;
    },
    {
      message: 'source_detail is required when source is Bank Account',
      path: ['source_detail'],
    }
  );

export const getTransactionsQuerySchema = z.object({
  // Pagination
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default('10'),
  
  // Search
  search: z.string().optional(),
  
  // Filtering
  fromDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid fromDate format',
  }).optional(),
  toDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid toDate format',
  }).optional(),
  category_type: z.enum(['income', 'expense']).optional(),
  
  // Sorting
  sortBy: z.enum(['amount', 'transaction_date']).default('transaction_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
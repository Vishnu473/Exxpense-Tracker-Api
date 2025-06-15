import {z} from "zod";

export const savingSchema = z.object({
  source: z.enum(['Cash', 'Bank Account', 'Other']),
  source_detail: z.string().max(50).optional(),
  payment_app: z.enum(['GPay', 'PhonePe', 'Paytm', 'AmazonPay', 'RazorPay', 'Other']).optional(),
  purpose: z.string().min(1, { message: 'Purpose is required' }),
  is_completed: z.boolean().default(false),
  current_amount:  z.number({ required_error: 'Amount is required' }).positive('Amount must be positive').default(0),
  expected_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'expected_at must be a valid date string',
  }),
  transaction_date: z
        .string({ required_error: 'Transaction date is required' })
        .refine((val) => !isNaN(Date.parse(val)), {
          message: 'Invalid transaction date format',
        }),
  amount:  z.number({ required_error: 'Amount is required' }).positive('Amount must be positive').default(0),
}).refine(
  (data) => {
    if (['Bank Account', 'Credit Card'].includes(data.source)) {
      return data.source_detail && data.source_detail.trim().length > 0;
    }
    return true;
  },
  {
    message: 'source_detail is required for Bank Account or Credit Card',
    path: ['source_detail'],
  }
);

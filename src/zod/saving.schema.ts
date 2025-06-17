import { z } from "zod";

export const savingSchema = z.object({
  isNew: z.boolean().default(true),
  source: z.enum(['Cash', 'Bank Account', 'Other']),
  source_detail: z.string().max(50).optional(),
  payment_app: z.enum(['GPay', 'PhonePe', 'Paytm', 'AmazonPay', 'RazorPay', 'Other']).optional(),
  purpose: z.string().min(1, { message: 'Purpose is required' }),
  is_completed: z.boolean().default(false),
  current_amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive').default(0),
  expected_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'expected_at must be a valid date string',
  }),
  transaction_date: z
    .string({ required_error: 'Transaction date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid transaction date format',
    }),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive').default(0),
}).refine(
  (data) => {
    if (data.source === "Bank Account") {
      return !!data.source_detail?.trim();
    }
    return true;
  },
  {
    message: 'Please enter the source detail when source is set to "others"',
    path: ['source_detail'],
  }
);


export const createSavingSchema = z.object({
  isNew: z.boolean(),
  source: z.enum(['Cash', 'Bank Account', 'Other'], { message: 'Please select a source for the savings' }),
  source_detail: z.string().max(100, { message: 'Source detail must be under 100 characters' }).optional(),
  payment_app: z.enum(['GPay', 'PhonePe', 'Paytm', 'AmazonPay', 'RazorPay', 'Other']).optional(),
  purpose: z.string().min(1, { message: 'Kindly provide a purpose for the saving' }),
  is_completed: z.boolean(),
  expected_at: z.string({ required_error: 'Please select a date for the transaction' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format. Please choose a valid date.',
    })
    .refine((val) => new Date(val) >= new Date(), {
      message: 'Transaction date cannot be in the past',
    }),

  pic: z.string().optional(),
  transaction_date: z
    .string({ required_error: 'Transaction date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid transaction date format',
    }),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
}).refine(
  (data) => {
    if (data.source === "Bank Account") {
      return !!data.source_detail?.trim();
    }
    return true;
  },
  {
    message: 'Please enter the source detail when source is set to "others"',
    path: ['source_detail'],
  }
);
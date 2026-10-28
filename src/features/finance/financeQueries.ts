import { supabase } from '../../lib/supabase';
import type { Database, DbRunRegistration, Profile } from '../../types';

type PaymentRow = Database['public']['Tables']['payments']['Row'];
type FinancialTransactionRow = Database['public']['Tables']['financial_transactions']['Row'];
export type FinanceScope = 'general' | 'festival' | 'run';
export type FinanceMethod = 'cash' | 'gcash' | 'bank';

export interface FinancePayment extends PaymentRow {
  participant_name: string;
  registration_reference: string;
  category_name: string;
  receiver_name: string | null;
  verifier_name: string | null;
}

export interface FinanceSnapshot {
  payments: FinancePayment[];
  transactions: FinanceTransaction[];
}

export interface FinanceTransaction extends FinancialTransactionRow {
  recorder_name: string;
  voided_by_name: string | null;
}

export interface FinancialTransactionInput {
  transaction_type: 'income' | 'expense';
  category: string;
  description: string;
  amount_centavos: number;
  method?: string | null;
  reference?: string | null;
  counterparty_name: string;
  received_by_name?: string | null;
  event_scope: FinanceScope;
  transaction_date: string;
  created_by: string;
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  if (!supabase) return { payments: [], transactions: [] };

  const [paymentResult, registrationResult, categoryResult, profileResult, transactionResult] = await Promise.all([
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('run_registrations').select('*'),
    supabase.from('run_categories').select('id,name'),
    supabase.from('profiles').select('*'),
    supabase.from('financial_transactions').select('*').order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
  ]);

  const error = paymentResult.error || registrationResult.error || categoryResult.error || profileResult.error || transactionResult.error;
  if (error) throw new Error(error.message);

  const registrations = (registrationResult.data as DbRunRegistration[]) ?? [];
  const profiles = (profileResult.data as Profile[]) ?? [];
  const registrationById = new Map(registrations.map((item) => [item.id, item]));
  const categoryById = new Map((categoryResult.data ?? []).map((item) => [item.id, item.name]));
  const profileById = new Map(profiles.map((item) => [item.id, item.full_name || 'Unnamed administrator']));

  const payments = ((paymentResult.data as PaymentRow[]) ?? []).map((payment) => {
    const registration = registrationById.get(payment.registration_id);
    return {
      ...payment,
      participant_name: registration?.participant_name || 'Unknown runner',
      registration_reference: registration?.reference || '—',
      category_name: registration ? categoryById.get(registration.category_id) || 'Unknown category' : 'Unknown category',
      receiver_name: payment.received_by ? profileById.get(payment.received_by) || 'Former administrator' : null,
      verifier_name: payment.verified_by ? profileById.get(payment.verified_by) || 'Former administrator' : null,
    };
  });

  return {
    payments,
    transactions: ((transactionResult.data as FinancialTransactionRow[]) ?? []).map((transaction) => ({
      ...transaction,
      recorder_name: transaction.created_by ? profileById.get(transaction.created_by) || 'Former administrator' : 'System / unavailable',
      voided_by_name: transaction.voided_by ? profileById.get(transaction.voided_by) || 'Former administrator' : null,
    })),
  };
}

export async function createFinancialTransaction(input: FinancialTransactionInput): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('financial_transactions').insert(input);
  if (error) throw new Error(error.message);
}

export async function voidFinancialTransaction(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.rpc('void_financial_transaction', { p_transaction_id: id });
  if (error) throw new Error(error.message);
}

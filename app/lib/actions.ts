'use server';

import { z } from 'zod';
import { sql } from '@/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// creates a new schema but omits id and date since it's not provided in the form
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // zod will throw an error if any field is missing or wrong
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql(`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES ('${customerId}', '${amountInCents}', '${status}', '${date}')
`);
  } catch (err) {
    return { message: 'Database Error: Failed to Create Invoice.' };
  }

  // clear next.js cache for this url and will fetch new data when redirecting there
  revalidatePath('/dashboard/invoices');

  // go to this page
  // redirect internally throws an error so it should be called outside of a try block
  redirect('/dashboard/invoices');
}

// expected update types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function editInvoice(invoiceId: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {
    await sql(`
    UPDATE invoices
    SET amount = '${amountInCents}', status = '${status}', customer_id = '${customerId}'
    WHERE id = '${invoiceId}'
  `);
  } catch (err) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(invoiceId: string) {
  try {
    await sql(`
    DELETE FROM invoices WHERE id = '${invoiceId}'  
  `);
    // you don't need to redirect if it is the current path
    // this will trigger a new request and re-render the table
    revalidatePath('/dashboard/invoices');

    return { message: 'Deleted Invoice.' };
  } catch (err) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}

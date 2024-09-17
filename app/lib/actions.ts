'use server';

import { z } from 'zod';
import { sql } from '@/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

// creates a new schema but omits id and date since it's not provided in the form
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  // zod will throw an error if any field is missing or wrong
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;

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

export async function editInvoice(
  invoiceId: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { amount, customerId, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql(`
    UPDATE invoices
    SET amount = '${amountInCents}', status = '${status}', customer_id = '${customerId}'
    WHERE id = '${invoiceId}'
  `);
  } catch (err) {
    console.log(err);
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

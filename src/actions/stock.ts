'use server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { normalizeDate } from '@/lib/date';

const stockSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	price: z.coerce.number().positive('Sell price must be positive'),
	buy_price: z.coerce.number().nonnegative('Buy price must be 0 or more'),
	quantity: z.coerce.number().int().nonnegative('Quantity must be 0 or more'),
	date: z.string().min(1, 'Date is required'),
});

export type StockActionState = {
	error?: string;
	fieldErrors?: Record<string, string[]>;
	success?: boolean;
};

async function getUserId() {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return session.user.id;
}

export async function getStocks(search?: string, dateFrom?: string, dateTo?: string) {
	const userId = await getUserId();
	const searchPattern = search ? `%${search.toLowerCase()}%` : '%';
	const fromDate = dateFrom || '1900-01-01';
	const toDate = dateTo || '2999-12-31';

	const rows = await sql`
		SELECT * FROM stocks
		WHERE user_id = ${userId}
			AND LOWER(name) LIKE ${searchPattern}
			AND date >= ${fromDate}
			AND date <= ${toDate}
		ORDER BY created_at DESC
	`;

	return rows.map((r) => ({
		id: r.id as number,
		name: r.name as string,
		price: String(r.price),
		buy_price: String(r.buy_price),
		quantity: Number(r.quantity),
		date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
		created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
	}));
}

export async function addStock(_prev: StockActionState, formData: FormData): Promise<StockActionState> {
	const userId = await getUserId();
	const rawDate = String(formData.get('date') ?? '');
	const parsed = stockSchema.safeParse({
		name: formData.get('name'),
		price: formData.get('price'),
		buy_price: formData.get('buy_price'),
		quantity: formData.get('quantity'),
		date: normalizeDate(rawDate) || rawDate,
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	const { name, price, buy_price, quantity, date } = parsed.data;

	// Upsert: if product exists for this user, add quantity and update prices
	const existing = await sql`
		SELECT id FROM stocks WHERE user_id = ${userId} AND LOWER(name) = ${name.toLowerCase()} LIMIT 1
	`;

	if (existing.length > 0) {
		await sql`
			UPDATE stocks
			SET quantity = quantity + ${quantity}, price = ${price}, buy_price = ${buy_price}, date = ${date}, updated_at = NOW()
			WHERE id = ${existing[0].id}
		`;
	} else {
		await sql`
			INSERT INTO stocks (user_id, name, price, buy_price, quantity, date)
			VALUES (${userId}, ${name}, ${price}, ${buy_price}, ${quantity}, ${date})
		`;
	}

	// Record in stock history
	await sql`
		INSERT INTO stock_history (user_id, product_name, quantity, sell_price, buy_price, date)
		VALUES (${userId}, ${name}, ${quantity}, ${price}, ${buy_price}, ${date})
	`;

	revalidatePath('/stockmanagement');
	return { success: true };
}

export async function updateStock(_prev: StockActionState, formData: FormData): Promise<StockActionState> {
	const userId = await getUserId();
	const id = Number(formData.get('id'));
	if (!id) return { error: 'Invalid stock ID' };

	const rawDate = String(formData.get('date') ?? '');
	const parsed = stockSchema.safeParse({
		name: formData.get('name'),
		price: formData.get('price'),
		buy_price: formData.get('buy_price'),
		quantity: formData.get('quantity'),
		date: normalizeDate(rawDate) || rawDate,
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	const { name, price, buy_price, quantity, date } = parsed.data;
	await sql`
		UPDATE stocks SET name = ${name}, price = ${price}, buy_price = ${buy_price}, quantity = ${quantity}, date = ${date}, updated_at = NOW()
		WHERE id = ${id} AND user_id = ${userId}
	`;

	revalidatePath('/stockmanagement');
	return { success: true };
}

export async function deleteStock(id: number) {
	const userId = await getUserId();
	await sql`DELETE FROM stocks WHERE id = ${id} AND user_id = ${userId}`;
	revalidatePath('/stockmanagement');
	return { success: true };
}

export async function importStocks(rows: Array<{ name: string; price: number; buy_price: number; quantity: number; date: string }>) {
	const userId = await getUserId();

	for (const row of rows) {
		const isoDate = normalizeDate(row.date) || row.date;
		const parsed = stockSchema.safeParse({ ...row, date: isoDate });
		if (!parsed.success) continue;
		const { name, price, buy_price, quantity, date } = parsed.data;

		// Upsert
		const existing = await sql`
			SELECT id FROM stocks WHERE user_id = ${userId} AND LOWER(name) = ${name.toLowerCase()} LIMIT 1
		`;

		if (existing.length > 0) {
			await sql`
				UPDATE stocks
				SET quantity = quantity + ${quantity}, price = ${price}, buy_price = ${buy_price}, date = ${date}, updated_at = NOW()
				WHERE id = ${existing[0].id}
			`;
		} else {
			await sql`
				INSERT INTO stocks (user_id, name, price, buy_price, quantity, date)
				VALUES (${userId}, ${name}, ${price}, ${buy_price}, ${quantity}, ${date})
			`;
		}

		// Record history
		await sql`
			INSERT INTO stock_history (user_id, product_name, quantity, sell_price, buy_price, date)
			VALUES (${userId}, ${name}, ${quantity}, ${price}, ${buy_price}, ${date})
		`;
	}

	revalidatePath('/stockmanagement');
	return { success: true };
}

export async function getStockHistory(productName: string) {
	const userId = await getUserId();
	const rows = await sql`
		SELECT * FROM stock_history
		WHERE user_id = ${userId} AND LOWER(product_name) = ${productName.toLowerCase()}
		ORDER BY date DESC, created_at DESC
	`;

	return rows.map((r) => ({
		id: r.id as number,
		product_name: r.product_name as string,
		quantity: Number(r.quantity),
		sell_price: String(r.sell_price),
		buy_price: String(r.buy_price),
		date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
		created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
	}));
}

'use server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type SaleActionState = {
	error?: string;
	fieldErrors?: Record<string, string[]>;
	success?: boolean;
};

async function getUserId() {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return session.user.id;
}

const saleSchema = z.object({
	product_name: z.string().min(1, 'Product name is required'),
	quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
	unit_price: z.coerce.number().positive('Price must be positive').optional(),
	date: z.string().min(1, 'Date is required'),
});

export async function searchProducts(query: string) {
	const userId = await getUserId();
	const rows = await sql`
		SELECT DISTINCT name, price, SUM(quantity) as total_quantity
		FROM stocks
		WHERE user_id = ${userId} AND LOWER(name) LIKE ${`%${query.toLowerCase()}%`}
		GROUP BY name, price
		ORDER BY name ASC
		LIMIT 10
	`;
	return rows as Array<{ name: string; price: string; total_quantity: string }>;
}

export async function getProductPrice(productName: string) {
	const userId = await getUserId();
	const rows = await sql`
		SELECT price, SUM(quantity) as available_quantity
		FROM stocks
		WHERE user_id = ${userId} AND LOWER(name) = ${productName.toLowerCase()}
		GROUP BY price
		LIMIT 1
	`;
	if (rows.length === 0) return null;
	return {
		price: Number(rows[0].price),
		availableQuantity: Number(rows[0].available_quantity),
	};
}

export async function addSale(_prev: SaleActionState, formData: FormData): Promise<SaleActionState> {
	const userId = await getUserId();
	const parsed = saleSchema.safeParse({
		product_name: formData.get('product_name'),
		quantity: formData.get('quantity'),
		unit_price: formData.get('unit_price'),
		date: formData.get('date'),
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	const { product_name, quantity, date } = parsed.data;

	// Get available quantity from stock
	const product = await getProductPrice(product_name);
	if (!product) return { error: 'Product not found in stock' };
	if (product.availableQuantity < quantity) {
		return { error: `Insufficient stock. Available: ${product.availableQuantity}` };
	}

	// Use custom price if provided, otherwise fall back to stock price
	const unitPrice = parsed.data.unit_price ?? product.price;
	const total = unitPrice * quantity;

	// Insert sale
	await sql`
		INSERT INTO sales (user_id, product_name, quantity, unit_price, total, date)
		VALUES (${userId}, ${product_name}, ${quantity}, ${unitPrice}, ${total}, ${date})
	`;

	// Deduct quantity from stock (FIFO: deduct from oldest entries first)
	let remaining = quantity;
	const stockRows = await sql`
		SELECT id, quantity FROM stocks
		WHERE user_id = ${userId} AND LOWER(name) = ${product_name.toLowerCase()} AND quantity > 0
		ORDER BY date ASC, id ASC
	`;

	for (const row of stockRows) {
		if (remaining <= 0) break;
		const stockQty = Number(row.quantity);
		const deduct = Math.min(stockQty, remaining);
		await sql`UPDATE stocks SET quantity = quantity - ${deduct}, updated_at = NOW() WHERE id = ${row.id}`;
		remaining -= deduct;
	}

	revalidatePath('/salestracker');
	revalidatePath('/stockmanagement');
	return { success: true };
}

export async function getSales(search?: string, dateFrom?: string, dateTo?: string) {
	const userId = await getUserId();
	const searchPattern = search ? `%${search.toLowerCase()}%` : '%';
	const fromDate = dateFrom || '1900-01-01';
	const toDate = dateTo || '2999-12-31';

	const rows = await sql`
		SELECT * FROM sales
		WHERE user_id = ${userId}
			AND LOWER(product_name) LIKE ${searchPattern}
			AND date >= ${fromDate}
			AND date <= ${toDate}
		ORDER BY created_at DESC
	`;

	return rows.map((r) => ({
		id: r.id as number,
		product_name: r.product_name as string,
		quantity: Number(r.quantity),
		unit_price: String(r.unit_price),
		total: String(r.total),
		date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
		created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
	}));
}

export async function deleteSale(id: number) {
	const userId = await getUserId();

	// Get the sale details to restore stock
	const saleRows = await sql`SELECT * FROM sales WHERE id = ${id} AND user_id = ${userId}`;
	if (saleRows.length === 0) return { error: 'Sale not found' };

	const sale = saleRows[0] as { product_name: string; quantity: number };

	// Restore quantity to the first matching stock entry
	const stockRows = await sql`
		SELECT id FROM stocks
		WHERE user_id = ${userId} AND LOWER(name) = ${sale.product_name.toLowerCase()}
		ORDER BY date ASC, id ASC
		LIMIT 1
	`;

	if (stockRows.length > 0) {
		await sql`UPDATE stocks SET quantity = quantity + ${sale.quantity}, updated_at = NOW() WHERE id = ${stockRows[0].id}`;
	}

	await sql`DELETE FROM sales WHERE id = ${id} AND user_id = ${userId}`;
	revalidatePath('/salestracker');
	revalidatePath('/stockmanagement');
	return { success: true };
}

export async function getBalance() {
	const userId = await getUserId();
	const rows = await sql`SELECT initial_balance FROM sales_balance WHERE user_id = ${userId}`;
	if (rows.length === 0) return 0;
	return Number(rows[0].initial_balance);
}

export async function setBalance(amount: number) {
	const userId = await getUserId();
	await sql`
		INSERT INTO sales_balance (user_id, initial_balance, updated_at)
		VALUES (${userId}, ${amount}, NOW())
		ON CONFLICT (user_id) DO UPDATE SET initial_balance = ${amount}, updated_at = NOW()
	`;
	revalidatePath('/salestracker');
	return { success: true };
}

export async function getTotalSalesRevenue() {
	const userId = await getUserId();
	const rows = await sql`SELECT COALESCE(SUM(total), 0) as total_revenue FROM sales WHERE user_id = ${userId}`;
	return Number(rows[0].total_revenue);
}

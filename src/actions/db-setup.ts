'use server';
import { sql } from '@/lib/neon';

export async function setupDatabase() {
	await sql`
		CREATE TABLE IF NOT EXISTS stocks (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			price NUMERIC(12,2) NOT NULL,
			quantity INTEGER NOT NULL DEFAULT 0,
			date DATE NOT NULL DEFAULT CURRENT_DATE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`;

	await sql`
		CREATE TABLE IF NOT EXISTS sales (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			product_name TEXT NOT NULL,
			quantity INTEGER NOT NULL,
			unit_price NUMERIC(12,2) NOT NULL,
			total NUMERIC(12,2) NOT NULL,
			date DATE NOT NULL DEFAULT CURRENT_DATE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`;

	await sql`
		CREATE TABLE IF NOT EXISTS sales_balance (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL UNIQUE,
			initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`;

	return { success: true };
}

import { auth } from '@/auth';
import { sql } from '@/lib/neon';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

	const searchParams = request.nextUrl.searchParams;
	const search = searchParams.get('search') || '';
	const dateFrom = searchParams.get('dateFrom') || '';
	const dateTo = searchParams.get('dateTo') || '';

	const searchPattern = search ? `%${search.toLowerCase()}%` : '%';
	const fromDate = dateFrom || '1900-01-01';
	const toDate = dateTo || '2999-12-31';

	const rows = await sql`
		SELECT name, price, buy_price, quantity, date FROM stocks
		WHERE user_id = ${session.user.id}
			AND LOWER(name) LIKE ${searchPattern}
			AND date >= ${fromDate}
			AND date <= ${toDate}
		ORDER BY date DESC
	`;

	const header = 'Name,Sell Price,Buy Price,Quantity,Date\n';
	const csvRows = rows.map((r: Record<string, unknown>) =>
		`"${String(r.name).replace(/"/g, '""')}",${r.price},${r.buy_price},${r.quantity},${r.date}`
	).join('\n');

	return new Response(header + csvRows, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="stocks.csv"',
		},
	});
}

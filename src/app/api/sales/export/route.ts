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
		SELECT product_name, quantity, unit_price, total, date FROM sales
		WHERE user_id = ${session.user.id}
			AND LOWER(product_name) LIKE ${searchPattern}
			AND date >= ${fromDate}
			AND date <= ${toDate}
		ORDER BY date DESC
	`;

	const header = 'Product Name,Quantity,Unit Price,Total,Date\n';
	const csvRows = rows.map((r: Record<string, unknown>) =>
		`"${String(r.product_name).replace(/"/g, '""')}",${r.quantity},${r.unit_price},${r.total},${r.date}`
	).join('\n');

	return new Response(header + csvRows, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="sales.csv"',
		},
	});
}

export async function GET() {
	const csv = 'Name,Price,Buy Price,Quantity,Date\nExample Product,9.99,7.50,100,2026-04-13\n';
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="stock_import_template.csv"',
		},
	});
}

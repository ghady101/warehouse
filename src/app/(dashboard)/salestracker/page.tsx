import { getSales, getBalance, getTotalSalesRevenue } from '@/actions/sales';
import { SalesDashboard } from '@/components/dashboard/sales-dashboard';

export default async function SalesTrackerPage() {
	const [sales, initialBalance, totalRevenue] = await Promise.all([
		getSales(),
		getBalance(),
		getTotalSalesRevenue(),
	]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Sales Tracker</h1>
				<p className="text-sm text-muted-foreground">Record sales, track revenue and manage your cash balance.</p>
			</div>
			<SalesDashboard
				initialSales={sales}
				initialBalance={initialBalance}
				initialTotalRevenue={totalRevenue}
			/>
		</div>
	);
}

import { getStocks } from '@/actions/stock';
import { StockDashboard } from '@/components/dashboard/stock-dashboard';

export default async function StockManagementPage() {
	const stocks = await getStocks();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Stock Management</h1>
				<p className="text-sm text-muted-foreground">Manage your inventory, add/edit/delete products, import and export data.</p>
			</div>
			<StockDashboard initialStocks={stocks} />
		</div>
	);
}

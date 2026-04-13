'use client';
import { useState, useActionState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addStock, updateStock, deleteStock, getStocks, importStocks, getStockHistory } from '@/actions/stock';
import type { StockActionState } from '@/actions/stock';
import { Plus, Pencil, Trash2, Search, Download, Upload, FileDown, X, History, ArrowLeft } from 'lucide-react';

type Stock = {
	id: number;
	name: string;
	price: string;
	buy_price: string;
	quantity: number;
	date: string;
	created_at: string;
};

type HistoryEntry = {
	id: number;
	product_name: string;
	quantity: number;
	sell_price: string;
	buy_price: string;
	date: string;
	created_at: string;
};

export function StockDashboard({ initialStocks }: { initialStocks: Stock[] }) {
	const [stocks, setStocks] = useState(initialStocks);
	const [showForm, setShowForm] = useState(false);
	const [editingStock, setEditingStock] = useState<Stock | null>(null);
	const [search, setSearch] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [showImport, setShowImport] = useState(false);
	const [historyProduct, setHistoryProduct] = useState<string | null>(null);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);

	const refreshStocks = useCallback(async () => {
		const data = await getStocks(search || undefined, dateFrom || undefined, dateTo || undefined);
		setStocks(data);
	}, [search, dateFrom, dateTo]);

	useEffect(() => {
		const timeout = setTimeout(() => refreshStocks(), 300);
		return () => clearTimeout(timeout);
	}, [refreshStocks]);

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete this stock?')) return;
		await deleteStock(id);
		await refreshStocks();
	};

	const openHistory = async (productName: string) => {
		setLoadingHistory(true);
		setHistoryProduct(productName);
		const data = await getStockHistory(productName);
		setHistory(data);
		setLoadingHistory(false);
	};

	const exportUrl = `/api/stocks/export?search=${encodeURIComponent(search)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

	const totalValue = stocks.reduce((sum, s) => sum + Number(s.price) * s.quantity, 0);
	const totalItems = stocks.reduce((sum, s) => sum + s.quantity, 0);
	const totalCost = stocks.reduce((sum, s) => sum + Number(s.buy_price) * s.quantity, 0);

	// If viewing history, show the history panel
	if (historyProduct) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" onClick={() => setHistoryProduct(null)}>
						<ArrowLeft className="size-4" />
						Back
					</Button>
					<div>
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<History className="size-5" />
							Stock History: {historyProduct}
						</h2>
						<p className="text-sm text-muted-foreground">All restock entries for this product</p>
					</div>
				</div>

				<div className="rounded-lg border bg-card overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left font-medium">Date</th>
								<th className="px-4 py-3 text-left font-medium">Quantity</th>
								<th className="px-4 py-3 text-left font-medium">Sell Price</th>
								<th className="px-4 py-3 text-left font-medium">Buy Price</th>
								<th className="px-4 py-3 text-left font-medium">Cost</th>
							</tr>
						</thead>
						<tbody>
							{loadingHistory ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
								</tr>
							) : history.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No history found.</td>
								</tr>
							) : (
								history.map((h) => (
									<tr key={h.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
										<td className="px-4 py-3">{h.date}</td>
										<td className="px-4 py-3">{h.quantity}</td>
										<td className="px-4 py-3">${Number(h.sell_price).toFixed(2)}</td>
										<td className="px-4 py-3">${Number(h.buy_price).toFixed(2)}</td>
										<td className="px-4 py-3 font-medium">${(Number(h.buy_price) * h.quantity).toFixed(2)}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Summary cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Total Products</p>
					<p className="text-2xl font-semibold">{stocks.length}</p>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Total Items</p>
					<p className="text-2xl font-semibold">{totalItems.toLocaleString()}</p>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Total Sell Value</p>
					<p className="text-2xl font-semibold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Total Cost</p>
					<p className="text-2xl font-semibold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
				</div>
			</div>

			{/* Filters & actions */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search products..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Input
					type="date"
					value={dateFrom}
					onChange={(e) => setDateFrom(e.target.value)}
					className="w-[160px]"
					placeholder="From date"
				/>
				<Input
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					className="w-[160px]"
					placeholder="To date"
				/>
				<a href={exportUrl} download>
					<Button variant="outline" size="sm">
						<Download className="size-4" />
						Export CSV
					</Button>
				</a>
				<Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
					<Upload className="size-4" />
					Import CSV
				</Button>
				<Button size="sm" onClick={() => { setEditingStock(null); setShowForm(true); }}>
					<Plus className="size-4" />
					Add Stock
				</Button>
			</div>

			{/* Import modal */}
			{showImport && (
				<ImportModal
					onClose={() => setShowImport(false)}
					onImported={refreshStocks}
				/>
			)}

			{/* Add/Edit form */}
			{showForm && (
				<StockForm
					stock={editingStock}
					onClose={() => { setShowForm(false); setEditingStock(null); }}
					onSaved={refreshStocks}
				/>
			)}

			{/* Table */}
			<div className="rounded-lg border bg-card overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium">Name</th>
							<th className="px-4 py-3 text-left font-medium">Sell Price</th>
							<th className="px-4 py-3 text-left font-medium">Buy Price</th>
							<th className="px-4 py-3 text-left font-medium">Quantity</th>
							<th className="px-4 py-3 text-left font-medium">Date</th>
							<th className="px-4 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{stocks.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
									No stocks found. Add your first product above.
								</td>
							</tr>
						) : (
							stocks.map((stock) => (
								<tr key={stock.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => openHistory(stock.name)}
											className="font-medium text-primary hover:underline cursor-pointer text-left"
										>
											{stock.name}
										</button>
									</td>
									<td className="px-4 py-3">${Number(stock.price).toFixed(2)}</td>
									<td className="px-4 py-3">${Number(stock.buy_price).toFixed(2)}</td>
									<td className="px-4 py-3">
										<span className={stock.quantity === 0 ? 'text-destructive font-medium' : ''}>
											{stock.quantity}
											{stock.quantity === 0 && ' (Out of stock)'}
										</span>
									</td>
									<td className="px-4 py-3 text-muted-foreground">{stock.date}</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon-xs"
												onClick={() => { setEditingStock(stock); setShowForm(true); }}
											>
												<Pencil className="size-3.5" />
											</Button>
											<Button
												variant="ghost"
												size="icon-xs"
												onClick={() => handleDelete(stock.id)}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="size-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function StockForm({
	stock,
	onClose,
	onSaved,
}: {
	stock: Stock | null;
	onClose: () => void;
	onSaved: () => void;
}) {
	const isEdit = !!stock;
	const action = isEdit ? updateStock : addStock;
	const [state, formAction, isPending] = useActionState<StockActionState, FormData>(action, {});

	useEffect(() => {
		if (state.success) {
			onSaved();
			onClose();
		}
	}, [state.success, onSaved, onClose]);

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium">{isEdit ? 'Edit Stock' : 'Add Stock'}</h3>
				<Button variant="ghost" size="icon-xs" onClick={onClose}>
					<X className="size-4" />
				</Button>
			</div>

			{state.error && (
				<p className="mb-3 text-sm text-destructive">{state.error}</p>
			)}

			<form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
				{isEdit && <input type="hidden" name="id" value={stock.id} />}
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
					<Input
						name="name"
						defaultValue={stock?.name ?? ''}
						placeholder="Product name"
						required
						aria-invalid={!!state.fieldErrors?.name}
					/>
					{state.fieldErrors?.name && <p className="text-xs text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Sell Price</label>
					<Input
						name="price"
						type="number"
						step="0.01"
						min="0.01"
						defaultValue={stock?.price ?? ''}
						placeholder="0.00"
						required
						aria-invalid={!!state.fieldErrors?.price}
					/>
					{state.fieldErrors?.price && <p className="text-xs text-destructive mt-1">{state.fieldErrors.price[0]}</p>}
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Buy Price</label>
					<Input
						name="buy_price"
						type="number"
						step="0.01"
						min="0"
						defaultValue={stock?.buy_price ?? ''}
						placeholder="0.00"
						required
						aria-invalid={!!state.fieldErrors?.buy_price}
					/>
					{state.fieldErrors?.buy_price && <p className="text-xs text-destructive mt-1">{state.fieldErrors.buy_price[0]}</p>}
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Quantity</label>
					<Input
						name="quantity"
						type="number"
						min="0"
						defaultValue={stock?.quantity ?? ''}
						placeholder="0"
						required
						aria-invalid={!!state.fieldErrors?.quantity}
					/>
					{state.fieldErrors?.quantity && <p className="text-xs text-destructive mt-1">{state.fieldErrors.quantity[0]}</p>}
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
					<Input
						name="date"
						type="date"
						defaultValue={stock?.date ?? new Date().toISOString().split('T')[0]}
						required
						aria-invalid={!!state.fieldErrors?.date}
					/>
					{state.fieldErrors?.date && <p className="text-xs text-destructive mt-1">{state.fieldErrors.date[0]}</p>}
				</div>
				<div className="flex items-end">
					<Button type="submit" disabled={isPending} className="w-full">
						{isPending ? 'Saving...' : isEdit ? 'Update' : 'Add'}
					</Button>
				</div>
			</form>
		</div>
	);
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
	const [error, setError] = useState('');
	const [importing, setImporting] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const handleImport = async () => {
		const file = fileRef.current?.files?.[0];
		if (!file) { setError('Please select a CSV file'); return; }

		setImporting(true);
		setError('');

		try {
			const text = await file.text();
			const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());

			if (lines.length < 2) {
				setError('CSV file must have a header row and at least one data row');
				setImporting(false);
				return;
			}

			// Parse header
			const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, '').replace(/\s+/g, '_'));
			const nameIdx = header.indexOf('name');
			const priceIdx = header.findIndex((h) => h === 'price' || h === 'sell_price');
			const buyIdx = header.findIndex((h) => h === 'buy_price' || h === 'cost');
			const qtyIdx = header.indexOf('quantity');
			const dateIdx = header.indexOf('date');

			if (nameIdx < 0 || priceIdx < 0 || qtyIdx < 0 || dateIdx < 0) {
				setError('CSV must have columns: Name, Price (or Sell Price), Quantity, Date. Buy Price is optional.');
				setImporting(false);
				return;
			}

			const maxIdx = Math.max(nameIdx, priceIdx, buyIdx, qtyIdx, dateIdx);
			const rows = [];
			for (let i = 1; i < lines.length; i++) {
				const cols = parseCSVLine(lines[i]);
				if (cols.length <= maxIdx) continue;
				rows.push({
					name: cols[nameIdx].trim().replace(/['"]/g, ''),
					price: Number(cols[priceIdx].trim()),
					buy_price: buyIdx >= 0 ? Number(cols[buyIdx].trim()) : 0,
					quantity: Number(cols[qtyIdx].trim()),
					date: cols[dateIdx].trim().replace(/['"]/g, ''),
				});
			}

			if (rows.length === 0) {
				setError('No valid rows found in CSV');
				setImporting(false);
				return;
			}

			await importStocks(rows);
			onImported();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to import CSV. Check format and try again.');
		} finally {
			setImporting(false);
		}
	};

	return (
		<div className="rounded-lg border bg-card p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="font-medium">Import Stocks from CSV</h3>
				<Button variant="ghost" size="icon-xs" onClick={onClose}>
					<X className="size-4" />
				</Button>
			</div>

			<p className="text-sm text-muted-foreground">
				Download the template, fill it in, then upload. Columns: Name, Price, Buy Price, Quantity, Date.
				Dates can be in any format (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, etc.).
				If a product already exists, its quantity will be added and prices updated.
			</p>

			<div className="flex flex-wrap items-center gap-2">
				<a href="/api/stocks/template" download>
					<Button variant="outline" size="sm">
						<FileDown className="size-4" />
						Download Template
					</Button>
				</a>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<div className="flex items-center gap-2">
				<Input ref={fileRef} type="file" accept=".csv" className="flex-1" />
				<Button size="sm" onClick={handleImport} disabled={importing}>
					{importing ? 'Importing...' : 'Import'}
				</Button>
			</div>
		</div>
	);
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"' && line[i + 1] === '"') {
				current += '"';
				i++;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				current += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ',') {
				result.push(current);
				current = '';
			} else {
				current += ch;
			}
		}
	}
	result.push(current);
	return result;
}

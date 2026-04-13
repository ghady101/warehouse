'use client';
import { useState, useActionState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	addSale,
	getSales,
	deleteSale,
	setBalance,
	getBalance,
	getTotalSalesRevenue,
	searchProducts,
	getProductPrice,
} from '@/actions/sales';
import type { SaleActionState } from '@/actions/sales';
import { Plus, Trash2, Search, Download, DollarSign, X, Wallet } from 'lucide-react';

type Sale = {
	id: number;
	product_name: string;
	quantity: number;
	unit_price: string;
	total: string;
	date: string;
	created_at: string;
};

type ProductSuggestion = {
	name: string;
	price: string;
	total_quantity: string;
};

export function SalesDashboard({
	initialSales,
	initialBalance,
	initialTotalRevenue,
}: {
	initialSales: Sale[];
	initialBalance: number;
	initialTotalRevenue: number;
}) {
	const [sales, setSales] = useState(initialSales);
	const [balance, setBalanceState] = useState(initialBalance);
	const [totalRevenue, setTotalRevenue] = useState(initialTotalRevenue);
	const [showForm, setShowForm] = useState(false);
	const [showBalanceForm, setShowBalanceForm] = useState(false);
	const [search, setSearch] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	const refreshData = useCallback(async () => {
		const [data, bal, rev] = await Promise.all([
			getSales(search || undefined, dateFrom || undefined, dateTo || undefined),
			getBalance(),
			getTotalSalesRevenue(),
		]);
		setSales(data);
		setBalanceState(bal);
		setTotalRevenue(rev);
	}, [search, dateFrom, dateTo]);

	useEffect(() => {
		const timeout = setTimeout(() => refreshData(), 300);
		return () => clearTimeout(timeout);
	}, [refreshData]);

	const handleDelete = async (id: number) => {
		if (!confirm('Delete this sale? Stock quantity will be restored.')) return;
		await deleteSale(id);
		await refreshData();
	};

	const currentBalance = balance + totalRevenue;
	const exportUrl = `/api/sales/export?search=${encodeURIComponent(search)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

	return (
		<div className="space-y-4">
			{/* Summary cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Initial Balance</p>
					<div className="flex items-center gap-2">
						<p className="text-2xl font-semibold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
						<Button variant="ghost" size="icon-xs" onClick={() => setShowBalanceForm(true)}>
							<Pencil className="size-3" />
						</Button>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Total Revenue</p>
					<p className="text-2xl font-semibold text-green-600">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Current Balance</p>
					<p className="text-2xl font-semibold">${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<p className="text-sm text-muted-foreground">Total Sales</p>
					<p className="text-2xl font-semibold">{sales.length}</p>
				</div>
			</div>

			{/* Balance form */}
			{showBalanceForm && (
				<BalanceForm
					currentBalance={balance}
					onClose={() => setShowBalanceForm(false)}
					onSaved={refreshData}
				/>
			)}

			{/* Filters & actions */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search sales..."
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
				/>
				<Input
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					className="w-[160px]"
				/>
				<a href={exportUrl} download>
					<Button variant="outline" size="sm">
						<Download className="size-4" />
						Export CSV
					</Button>
				</a>
				<Button size="sm" onClick={() => setShowForm(true)}>
					<Plus className="size-4" />
					Add Sale
				</Button>
			</div>

			{/* Add sale form */}
			{showForm && (
				<SaleForm
					onClose={() => setShowForm(false)}
					onSaved={refreshData}
				/>
			)}

			{/* Table */}
			<div className="rounded-lg border bg-card overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium">Product</th>
							<th className="px-4 py-3 text-left font-medium">Quantity</th>
							<th className="px-4 py-3 text-left font-medium">Unit Price</th>
							<th className="px-4 py-3 text-left font-medium">Total</th>
							<th className="px-4 py-3 text-left font-medium">Date</th>
							<th className="px-4 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{sales.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
									No sales recorded yet. Add your first sale above.
								</td>
							</tr>
						) : (
							sales.map((sale) => (
								<tr key={sale.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
									<td className="px-4 py-3 font-medium">{sale.product_name}</td>
									<td className="px-4 py-3">{sale.quantity}</td>
									<td className="px-4 py-3">${Number(sale.unit_price).toFixed(2)}</td>
									<td className="px-4 py-3 font-medium">${Number(sale.total).toFixed(2)}</td>
									<td className="px-4 py-3 text-muted-foreground">{sale.date}</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end">
											<Button
												variant="ghost"
												size="icon-xs"
												onClick={() => handleDelete(sale.id)}
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

function Pencil({ className }: { className?: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
			<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
		</svg>
	);
}

function SaleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
	const [state, formAction, isPending] = useActionState<SaleActionState, FormData>(addSale, {});
	const [productQuery, setProductQuery] = useState('');
	const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedPrice, setSelectedPrice] = useState<string>('');
	const [availableQty, setAvailableQty] = useState<number | null>(null);
	const [quantity, setQuantity] = useState('');
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (state.success) {
			onSaved();
			onClose();
		}
	}, [state.success, onSaved, onClose]);

	// Search products as user types
	useEffect(() => {
		if (productQuery.length < 1) {
			setSuggestions([]);
			return;
		}
		const timeout = setTimeout(async () => {
			const results = await searchProducts(productQuery);
			setSuggestions(results);
			setShowSuggestions(true);
		}, 200);
		return () => clearTimeout(timeout);
	}, [productQuery]);

	// Close suggestions on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
				inputRef.current && !inputRef.current.contains(e.target as Node)) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const handleSelectProduct = async (product: ProductSuggestion) => {
		setProductQuery(product.name);
		setShowSuggestions(false);
		const info = await getProductPrice(product.name);
		if (info) {
			setSelectedPrice(String(info.price));
			setAvailableQty(info.availableQuantity);
		}
	};

	const qtyError = quantity && availableQty !== null && Number(quantity) > availableQty
		? `Max available: ${availableQty}`
		: null;

	const priceNum = Number(selectedPrice);
	const total = priceNum > 0 && quantity && !qtyError
		? (priceNum * Number(quantity)).toFixed(2)
		: null;

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium">Add Sale</h3>
				<Button variant="ghost" size="icon-xs" onClick={onClose}>
					<X className="size-4" />
				</Button>
			</div>

			{state.error && (
				<p className="mb-3 text-sm text-destructive">{state.error}</p>
			)}

			<form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
				{/* Product name with search dropdown */}
				<div className="relative">
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Product Name</label>
					<Input
						ref={inputRef}
						name="product_name"
						value={productQuery}
						onChange={(e) => {
							setProductQuery(e.target.value);
							setSelectedPrice('');
							setAvailableQty(null);
						}}
						onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
						placeholder="Search product..."
						required
						autoComplete="off"
						aria-invalid={!!state.fieldErrors?.product_name}
					/>
					{showSuggestions && suggestions.length > 0 && (
						<div
							ref={suggestionsRef}
							className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
						>
							{suggestions.map((p) => {
								const outOfStock = Number(p.total_quantity) === 0;
								return (
									<button
										key={`${p.name}-${p.price}`}
										type="button"
										disabled={outOfStock}
										className={
											'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ' +
											(outOfStock
												? 'opacity-50 cursor-not-allowed text-muted-foreground'
												: 'hover:bg-muted cursor-pointer')
										}
										onClick={() => !outOfStock && handleSelectProduct(p)}
									>
										<span className="font-medium">{p.name}</span>
										<span className="text-xs text-muted-foreground">
											${Number(p.price).toFixed(2)}
											{outOfStock
												? ' - Out of stock'
												: ` - ${p.total_quantity} available`}
										</span>
									</button>
								);
							})}
						</div>
					)}
					{state.fieldErrors?.product_name && (
						<p className="text-xs text-destructive mt-1">{state.fieldErrors.product_name[0]}</p>
					)}
				</div>

				{/* Quantity */}
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Quantity</label>
					<Input
						name="quantity"
						type="number"
						min="1"
						max={availableQty ?? undefined}
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
						placeholder="0"
						required
						aria-invalid={!!qtyError || !!state.fieldErrors?.quantity}
					/>
					{qtyError && <p className="text-xs text-destructive mt-1">{qtyError}</p>}
					{state.fieldErrors?.quantity && <p className="text-xs text-destructive mt-1">{state.fieldErrors.quantity[0]}</p>}
				</div>

				{/* Price (auto-filled, editable) */}
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Unit Price</label>
					<Input
						name="unit_price"
						type="number"
						step="0.01"
						min="0.01"
						value={selectedPrice}
						onChange={(e) => setSelectedPrice(e.target.value)}
						placeholder="Select product"
						required
					/>
				</div>

				{/* Date */}
				<div>
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
					<Input
						name="date"
						type="date"
						defaultValue={new Date().toISOString().split('T')[0]}
						required
					/>
				</div>

				{/* Submit */}
				<div className="flex flex-col justify-end gap-1">
					{total && (
						<p className="text-xs font-medium text-muted-foreground">
							Total: <span className="text-foreground">${total}</span>
						</p>
					)}
					<Button
						type="submit"
						disabled={isPending || !!qtyError || !selectedPrice}
						className="w-full"
					>
						{isPending ? 'Adding...' : 'Add Sale'}
					</Button>
				</div>
			</form>
		</div>
	);
}

function BalanceForm({
	currentBalance,
	onClose,
	onSaved,
}: {
	currentBalance: number;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [amount, setAmount] = useState(String(currentBalance));
	const [saving, setSaving] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		await setBalance(Number(amount));
		onSaved();
		onClose();
		setSaving(false);
	};

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-medium flex items-center gap-2">
					<Wallet className="size-4" />
					Set Initial Balance
				</h3>
				<Button variant="ghost" size="icon-xs" onClick={onClose}>
					<X className="size-4" />
				</Button>
			</div>
			<form onSubmit={handleSubmit} className="flex items-end gap-3">
				<div className="flex-1">
					<label className="text-xs font-medium text-muted-foreground mb-1 block">Amount ($)</label>
					<Input
						type="number"
						step="0.01"
						min="0"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						required
					/>
				</div>
				<Button type="submit" disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</Button>
			</form>
		</div>
	);
}

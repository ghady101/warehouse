import { auth } from '@/auth';
import Link from 'next/link';
import { Package, ShoppingCart } from 'lucide-react';

export default async function DashboardPage() {
	const session = await auth();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Welcome back, {session?.user?.name ?? 'User'}
				</h1>
				<p className="text-sm text-muted-foreground">
					What would you like to do today?
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Link
					href="/stockmanagement"
					className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
				>
					<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
						<Package className="size-5 text-primary" />
					</div>
					<h2 className="font-semibold">Stock Management</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						View inventory, add products, import from CSV, and track stock history.
					</p>
				</Link>

				<Link
					href="/salestracker"
					className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
				>
					<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
						<ShoppingCart className="size-5 text-primary" />
					</div>
					<h2 className="font-semibold">Sales Tracker</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Record sales, track revenue, manage your balance, and export reports.
					</p>
				</Link>
			</div>
		</div>
	);
}

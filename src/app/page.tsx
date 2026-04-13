import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, BarChart3, ShoppingCart, ArrowRight } from 'lucide-react';

export default async function Home() {
	const session = await auth();
	if (session?.user) redirect('/dashboard');

	return (
		<div className="flex min-h-screen flex-col bg-background">
			{/* Navbar */}
			<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
					<Link href="/" className="flex items-center gap-2 font-semibold">
						<Package className="size-5 text-primary" />
						Warehouse
					</Link>
					<nav className="flex items-center gap-2">
						<Link
							href="/login"
							className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Log in
						</Link>
						<Link
							href="/signup"
							className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							Sign up
						</Link>
					</nav>
				</div>
			</header>

			{/* Hero */}
			<main className="flex flex-1 flex-col">
				<section className="flex flex-1 items-center justify-center px-4 py-24 sm:py-32">
					<div className="mx-auto max-w-2xl text-center">
						<div className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
							<Package className="size-3" />
							Inventory made simple
						</div>
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
							Manage your stock,{' '}
							<span className="text-primary">track your sales</span>
						</h1>
						<p className="mt-4 text-lg leading-relaxed text-muted-foreground sm:text-xl">
							A clean, fast warehouse management system. Add products, record sales,
							import inventory from CSV, and keep your business running smoothly.
						</p>
						<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
							<Link
								href="/signup"
								className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
							>
								Get started free
								<ArrowRight className="size-4" />
							</Link>
							<Link
								href="/login"
								className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
							>
								Log in to your account
							</Link>
						</div>
					</div>
				</section>

				{/* Features */}
				<section className="border-t bg-muted/30 px-4 py-16 sm:py-20">
					<div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
						<div className="flex flex-col items-center text-center sm:items-start sm:text-left">
							<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<Package className="size-5 text-primary" />
							</div>
							<h3 className="font-semibold">Stock Management</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Add, edit, and delete products. Import bulk inventory from CSV. Track buy and sell prices.
							</p>
						</div>
						<div className="flex flex-col items-center text-center sm:items-start sm:text-left">
							<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<ShoppingCart className="size-5 text-primary" />
							</div>
							<h3 className="font-semibold">Sales Tracking</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Record every sale with auto-pricing from inventory. Quantity validation prevents overselling.
							</p>
						</div>
						<div className="flex flex-col items-center text-center sm:items-start sm:text-left">
							<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<BarChart3 className="size-5 text-primary" />
							</div>
							<h3 className="font-semibold">Export & Reports</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Export filtered data to CSV. View stock history and track your balance and revenue at a glance.
							</p>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t px-4 py-6">
				<div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<Package className="size-3.5" />
						Warehouse
					</span>
					<span>&copy; {new Date().getFullYear()}</span>
				</div>
			</footer>
		</div>
	);
}

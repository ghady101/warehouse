'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Package, ShoppingCart, LogOut, LayoutDashboard } from 'lucide-react';

const links = [
	{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/stockmanagement', label: 'Stock Management', icon: Package },
	{ href: '/salestracker', label: 'Sales Tracker', icon: ShoppingCart },
];

export function DashboardNav({ userName }: { userName: string }) {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
				<Link href="/dashboard" className="mr-6 flex items-center gap-2 font-semibold">
					<Package className="size-5" />
					<span className="hidden sm:inline">Warehouse</span>
				</Link>

				<nav className="flex items-center gap-1">
					{links.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							className={cn(
								'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
								pathname === href
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							)}
						>
							<Icon className="size-4" />
							<span className="hidden sm:inline">{label}</span>
						</Link>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-3">
					<span className="text-sm text-muted-foreground hidden sm:inline">{userName}</span>
					<button
						type="button"
						onClick={() => signOut({ redirectTo: '/' })}
						className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>
		</header>
	);
}

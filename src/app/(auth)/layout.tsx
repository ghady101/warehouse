import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-sm rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-8">
				{children}
			</div>
		</main>
	);
}

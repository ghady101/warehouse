import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	if (!session?.user) redirect('/login');

	return (
		<div className="min-h-screen bg-muted/30">
			<DashboardNav userName={session.user.name ?? 'User'} />
			<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				{children}
			</main>
		</div>
	);
}

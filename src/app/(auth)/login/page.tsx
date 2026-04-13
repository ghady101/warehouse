import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
	return (
		<>
			<h1 className="mb-1 text-xl font-semibold tracking-tight">Welcome back</h1>
			<p className="mb-6 text-sm text-muted-foreground">Enter your credentials to continue</p>
			<LoginForm />
			<p className="mt-4 text-center text-sm text-muted-foreground">
				No account?{' '}
				<a href="/signup" className="text-primary underline-offset-4 hover:underline">
					Sign up
				</a>
			</p>
		</>
	);
}

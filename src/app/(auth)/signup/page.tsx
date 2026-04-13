import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
	return (
		<>
			<h1 className="mb-1 text-xl font-semibold tracking-tight">Create an account</h1>
			<p className="mb-6 text-sm text-muted-foreground">Get started for free</p>
			<SignupForm />
			<p className="mt-4 text-center text-sm text-muted-foreground">
				Already have an account?{' '}
				<a href="/login" className="text-primary underline-offset-4 hover:underline">
					Sign in
				</a>
			</p>
		</>
	);
}

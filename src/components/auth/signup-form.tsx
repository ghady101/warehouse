'use client';
import { useActionState } from 'react';
import { signupAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SignupForm() {
	const [state, action, pending] = useActionState(signupAction, {});

	return (
		<form action={action} className="flex flex-col gap-4">
			{state.error && (
				<p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{state.error}
				</p>
			)}
			<div className="flex flex-col gap-1.5">
				<label htmlFor="name" className="text-sm font-medium">
					Name
				</label>
				<Input
					id="name"
					name="name"
					type="text"
					autoComplete="name"
					placeholder="John Doe"
					aria-invalid={!!state.fieldErrors?.name}
				/>
				{state.fieldErrors?.name && (
					<p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="email" className="text-sm font-medium">
					Email
				</label>
				<Input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					aria-invalid={!!state.fieldErrors?.email}
				/>
				{state.fieldErrors?.email && (
					<p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<label htmlFor="password" className="text-sm font-medium">
					Password
				</label>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="new-password"
					placeholder="••••••••"
					aria-invalid={!!state.fieldErrors?.password}
				/>
				{state.fieldErrors?.password && (
					<p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
				)}
			</div>
			<Button type="submit" className="w-full" disabled={pending}>
				{pending ? 'Creating account…' : 'Create account'}
			</Button>
		</form>
	);
}

'use server';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { createUser } from './user';

export type ActionState = {
	error?: string;
	fieldErrors?: Record<string, string[]>;
};

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.email(),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
	const parsed = loginSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	try {
		await signIn('credentials', { ...parsed.data, redirectTo: '/' });
	} catch (e) {
		if (e instanceof AuthError) return { error: 'Invalid email or password.' };
		throw e;
	}
	return {};
}

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
	const parsed = signupSchema.safeParse({
		name: formData.get('name'),
		email: formData.get('email'),
		password: formData.get('password'),
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	const result = await createUser(parsed.data.name, parsed.data.email, parsed.data.password);
	if ('error' in result) return { error: result.error };

	try {
		await signIn('credentials', {
			email: parsed.data.email,
			password: parsed.data.password,
			redirectTo: '/',
		});
	} catch (e) {
		if (e instanceof AuthError) return { error: 'Account created but sign-in failed. Please log in.' };
		throw e;
	}
	return {};
}

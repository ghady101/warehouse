'use server';
import { sql } from '@/lib/neon';
import { verifyPassword, saltAndHashPassword } from '@/utils/hash';

export async function getUserFromDb(email: string, password: string) {
	const users = await sql`
		SELECT id, name, email FROM users WHERE email = ${email} LIMIT 1
	`;
	if (users.length === 0) return null;

	const user = users[0] as { id: number; name: string; email: string };
	const creds = await sql`
		SELECT password_hash FROM user_passwords WHERE user_id = ${user.id} LIMIT 1
	`;
	if (creds.length === 0) return null;

	const valid = verifyPassword(password, (creds[0] as { password_hash: string }).password_hash);
	return valid ? { id: String(user.id), name: user.name, email: user.email } : null;
}

export async function createUser(name: string, email: string, password: string) {
	const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
	if (existing.length > 0) return { error: 'Email already in use.' };

	const hash = saltAndHashPassword(password);

	const inserted = await sql`
		INSERT INTO users (name, email, "emailVerified")
		VALUES (${name}, ${email}, NULL)
		RETURNING id
	`;
	const userId = (inserted[0] as { id: number }).id;

	await sql`
		INSERT INTO user_passwords (user_id, password_hash)
		VALUES (${userId}, ${hash})
	`;
	return { success: true as const };
}

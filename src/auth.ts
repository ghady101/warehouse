import NextAuth from 'next-auth';
import NeonAdapter from '@auth/neon-adapter';
import { Pool } from '@neondatabase/serverless';
import Credentials from 'next-auth/providers/credentials';
import { getUserFromDb } from './actions/user';

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	return {
		providers: [
			Credentials({
				credentials: {
					email: {
						type: 'email',
						label: 'Email',
						placeholder: 'johndoe@gmail.com',
					},
					password: {
						type: 'password',
						label: 'Password',
						placeholder: '********',
					},
				},
				authorize: async ({ email, password }) => {
					const user = await getUserFromDb(email as string, password as string);
					if (!user) throw new Error('Invalid credentials.');
					return user;
				},
			}),
		],
		adapter: NeonAdapter(pool),
		secret: process.env.BETTER_AUTH_SECRET,
		session: {
			strategy: 'jwt',
			maxAge: process.env.ISDEV === 'true' ? 3600 : 2592000,
			updateAge: process.env.ISDEV === 'true' ? 60 : 86400,
		},
		callbacks: {
			jwt({ token, user }) {
				if (user) {
					token.id = user.id;
					token.name = user.name;
					token.email = user.email;
				}
				return token;
			},
			session({ session, token }) {
				session.user.id = token.id as string;
				session.user.name = token.name as string;
				session.user.email = token.email as string;
				return session;
			},
		},
	};
});

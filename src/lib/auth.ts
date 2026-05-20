import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import db from "@/lib/db"
import { compare } from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await db.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user || !user.password) return null

                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                }
            }
        })
    ],
    pages: {
        signIn: '/login-admin',
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = (user as { id?: string }).id;
                token.name = (user as { name?: string | null }).name;
                token.image = (user as { image?: string | null }).image;
            }
            // Handle active update in session
            if (trigger === "update" && session) {
                if (session.name !== undefined) token.name = session.name;
                if (session.image !== undefined) token.image = session.image;
                if (session.email !== undefined) token.email = session.email;
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string;
                (session.user as { name?: string | null }).name = token.name as string | null;
                (session.user as { image?: string | null }).image = token.image as string | null;
                (session.user as { email?: string }).email = token.email as string;
            }
            return session
        }
    }
})

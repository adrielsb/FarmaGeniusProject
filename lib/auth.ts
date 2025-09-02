
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"

interface DatabaseUser {
  id: string
  name: string | null
  email: string
  password: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log("🔐 NextAuth authorize called:", { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        if (!supabaseAdmin) {
          console.log("❌ Supabase admin client not available")
          return null
        }

        try {
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, password')
            .eq('email', credentials.email)
            .single() as { data: DatabaseUser | null, error: any }

          if (error) {
            console.log("❌ Supabase error:", error.message)
            return null
          }

          if (!user) {
            console.log("❌ User not found")
            return null
          }

          if (!user || !user.password) {
            console.log("❌ User has no password set")
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.log("❌ Invalid password for user:", credentials.email)
            return null
          }

          console.log("✅ Authentication successful for:", credentials.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("❌ Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  debug: process.env.NODE_ENV === 'development',
}

import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/admin/login"
  },
  callbacks: {
    authorized: ({ token }) => {
      if (!token) return false
      return token.role === "SUPER_ADMIN" || token.role === "ADMIN" || token.role === "MATCH_ADMIN"
    }
  }
})

export const config = {
  matcher: ["/admin/:path*"]
}

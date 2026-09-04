import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: ["/browse/:path*", "/profiles", "/admin/:path*", "/my-list", "/search", "/title/:path*", "/watch/:path*", "/providers/:path*"]
};

import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default function middleware(req: any) {
    return withAuth(req);
}
export const config = {
    // set protected pages
    matcher: ['/generate/:path*', '/settings/:path*']
};
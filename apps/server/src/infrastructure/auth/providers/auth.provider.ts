export interface JwtPayload {
  id: string;
  email: string;
}

export abstract class AuthService {
  abstract verifyToken(token: string): Promise<JwtPayload | null>;
}

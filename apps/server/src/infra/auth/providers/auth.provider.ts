export interface JwtPayload {
  id: string;
  email: string;
}

export abstract class AuthService {
  abstract verifyToken(token: string | undefined): Promise<JwtPayload | null>;

  login(_email: string, _password: string): string | null {
    return null;
  }
}

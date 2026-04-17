
export interface TokenPayload {
  sub: string;
  email: string;
}

export interface IssuedToken {
  token: string;
  expiresIn: string;
}

export interface ITokenService {
  sign(payload: TokenPayload): IssuedToken;
  verify(token: string): TokenPayload;
}

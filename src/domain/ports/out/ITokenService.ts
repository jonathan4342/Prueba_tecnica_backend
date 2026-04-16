/**
 * Puerto de salida para generación / verificación de tokens.
 *
 * El dominio no conoce JWT. Un adaptador de infraestructura
 * (JwtTokenService) implementa esta interfaz.
 */
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

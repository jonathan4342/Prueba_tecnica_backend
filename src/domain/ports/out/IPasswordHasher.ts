/**
 * Puerto de salida para hashing y verificación de contraseñas.
 * Un adaptador bcrypt implementa esta interfaz.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

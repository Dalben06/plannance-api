export interface PasswordHasher {
  hash(value: string): string;
  verify(plain: string, hashed: string): boolean;
}

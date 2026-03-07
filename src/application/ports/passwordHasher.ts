export interface PasswordHasher {
  hash(value: string): Promise<string>;
  verify(plain: string, hashed: string): Promise<boolean>;
}

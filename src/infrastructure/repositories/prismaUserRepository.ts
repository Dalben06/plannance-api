import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import type { PrismaClient, User as PrismaUser } from "@prisma/client";
import { AuthenticationError } from "../../domain/auth.js";
import type { UserRepository } from "../../application/ports/userRepository.js";
import type { UserCreate, UserView } from "../../domain/user.js";

const mapRow = (row: PrismaUser): UserView => ({
  id: row.uuid,
  email: row.email,
  name: row.name,
  picture: row.picture,
});

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<UserView | null> {
    const row = await this.prisma.user.findFirst({ where: { uuid: id } });
    return row ? mapRow(row) : null;
  }

  async getByCredentials(email: string, hashedPassword: string): Promise<UserView> {
    const row = await this.prisma.user.findFirst({ where: { email } });

    if (!row) {
      throw new AuthenticationError("Invalid credentials");
    }

    const storedBuffer = Buffer.from(row.password);
    const incomingBuffer = Buffer.from(hashedPassword);
    const passwordsMatch =
      storedBuffer.length === incomingBuffer.length &&
      timingSafeEqual(storedBuffer, incomingBuffer);

    if (!passwordsMatch) {
      throw new AuthenticationError("Invalid credentials");
    }

    return mapRow(row);
  }

  async create(user: UserCreate): Promise<UserView> {
    const row = await this.prisma.user.create({
      data: {
        uuid: user.id ?? randomUUID(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        password: user.password,
      },
    });
    return mapRow(row);
  }
}

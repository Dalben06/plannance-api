import { randomUUID } from "node:crypto";
import type { PrismaClient, User as PrismaUser } from "@prisma/client";
import type { UserRepository, UserWithPassword } from "../../application/ports/userRepository.js";
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

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const row = await this.prisma.user.findFirst({ where: { email } });
    if (!row) return null;
    return { ...mapRow(row), passwordHash: row.password };
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

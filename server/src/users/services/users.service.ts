import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findUserByEmail(email);
  }

  findById(id: string, include?: Prisma.UserInclude): Promise<User | null> {
    return this.repo.findUserById(id, include);
  }

  create(id: string, email: string): Promise<User> {
    return this.repo.createUser({ id, email });
  }

  update(id: string, name: string): Promise<User> {
    return this.repo.updateUser(id, { name });
  }
}

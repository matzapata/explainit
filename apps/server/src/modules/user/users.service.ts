import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
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

  findOrCreate(email: string): Promise<User> {
    return this.repo.findOrCreate({ email });
  }

  create(email: string): Promise<User> {
    return this.repo.createUser({ email });
  }

  update(id: string, name: string): Promise<User> {
    return this.repo.updateUser(id, { name });
  }
}

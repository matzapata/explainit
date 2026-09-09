import type { PrismaService } from '@src/infra/database/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const service = new UsersService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    it('returns the user with that email', async () => {
      const user = { id: 'user-1', email: 'admin' };
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findOrCreate('admin')).resolves.toEqual(user);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('adopts the existing owner when password auth uses a new identity', async () => {
      const owner = { id: 'user-1', email: 'admin@localhost' };
      const adopted = { id: 'user-1', email: 'admin' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(owner);
      prisma.user.update.mockResolvedValue(adopted);

      await expect(service.findOrCreate('admin')).resolves.toEqual(adopted);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { email: 'admin' },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('creates a user when the instance has none', async () => {
      const created = { id: 'user-1', email: 'admin@localhost' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(created);

      await expect(service.findOrCreate('admin@localhost')).resolves.toEqual(
        created,
      );
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'admin@localhost' },
      });
    });
  });
});

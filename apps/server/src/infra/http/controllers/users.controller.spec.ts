import { TestBed } from '@automock/jest';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { UsersService } from '@src/modules/user/users.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let userController: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(UsersController).compile();
    userController = unit;
    usersService = unitRef.get(UsersService);
  });

  it('should require authentication', () => {
    const guards = Reflect.getMetadata('__guards__', UsersController);
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(AuthGuard);
  });

  describe('get', () => {
    it('should return the user from db', async () => {
      const authUser = { id: 'id', email: 'email' };
      usersService.findById.mockResolvedValue({
        id: 'id',
        email: 'email',
        name: 'Ada',
        createdAt: new Date(),
      } as never);

      await expect(userController.get(authUser)).resolves.toEqual({
        id: 'id',
        email: 'email',
        name: 'Ada',
      });
      expect(usersService.findById).toHaveBeenCalledWith(authUser.id);
    });
  });
});

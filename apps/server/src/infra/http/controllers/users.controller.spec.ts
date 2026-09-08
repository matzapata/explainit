import { TestBed } from '@automock/jest';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { SerializeInterceptor } from '@src/infra/http/interceptors/serialize.interceptor';
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

  it('should require authentication to update a user', () => {
    const guards = Reflect.getMetadata('__guards__', UsersController);
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(AuthGuard);
  });

  describe('update', () => {
    it("should use UserDto to serialize the user's data", () => {
      const interceptors = Reflect.getMetadata(
        '__interceptors__',
        UsersController.prototype.update,
      );

      expect(interceptors[0]).toBeInstanceOf(SerializeInterceptor);
    });

    it('should update the user name and return the new user instance', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const updatedUser = {
        id: 'id',
        email: 'email',
        name: 'updated_name',
        createdAt: new Date(),
      };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await userController.update(authUser, {
        name: 'updated_name',
      });

      expect(usersService.update).toHaveBeenCalledWith(
        authUser.id,
        'updated_name',
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('get', () => {
    it('should return the user from db', async () => {
      const authUser = { id: 'id', email: 'email', isAdmin: false };
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
        isAdmin: false,
      });
      expect(usersService.findById).toHaveBeenCalledWith(authUser.id);
    });
  });
});

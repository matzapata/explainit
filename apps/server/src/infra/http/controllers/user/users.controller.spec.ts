import { TestBed } from '@automock/jest';
import { UsersController } from './users.controller';
import { UsersService } from '@src/modules/user/application/users.service';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';

describe('UsersController', () => {
  // Declare the unit under test
  let userController: UsersController;

  // Declare the mocks
  let usersService: jest.Mocked<UsersService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(UsersController).compile();

    // Assign the unit under test
    userController = unit;

    // Retrieve mocks from the unit reference and assign
    usersService = unitRef.get(UsersService);
  });

  it('should require authentication to update a user', () => {
    // Arrange
    const guards = Reflect.getMetadata('__guards__', UsersController);
    const guard = new guards[0]();

    // Assert
    expect(guard).toBeInstanceOf(AuthGuard);
  });

  describe('update', () => {
    it.todo("should use UserDto to serialize the user's data");

    it('should update the user name and return the new user instance', async () => {
      // Arrange
      const authUser = { id: 'id', email: 'email', isAdmin: false };
      const updatedUser = {
        id: 'id',
        email: 'email',
        name: 'updated_name',
        createdAt: new Date(),
      };
      usersService.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userController.update(authUser, {
        name: 'updated_name',
      });

      // Assert
      expect(usersService.update).toHaveBeenCalledWith(
        authUser.id,
        'updated_name',
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('get', () => {
    it.todo("should use UserDto to serialize the user's data");

    it.todo('should return the user from db');
  });
});

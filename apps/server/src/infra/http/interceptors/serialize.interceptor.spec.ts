import type { CallHandler } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { UserDto } from '../controllers/dto/user.dto';
import { SerializeInterceptor } from './serialize.interceptor';

describe('SerializeInterceptor', () => {
  const interceptor = new SerializeInterceptor(UserDto);

  it('strips fields that are not exposed on the DTO', async () => {
    const handler = {
      handle: () =>
        of({
          id: '1',
          email: 'a@example.com',
          name: 'Ada',
          password: 'secret',
        }),
    } as CallHandler;

    const result = await lastValueFrom(
      interceptor.intercept({} as never, handler),
    );

    expect(result).toEqual({
      id: '1',
      email: 'a@example.com',
      name: 'Ada',
    });
    expect(result.password).toBeUndefined();
  });

  it('serializes arrays of records', async () => {
    const handler = {
      handle: () =>
        of([
          { id: '1', email: 'a@example.com', name: 'Ada', extra: true },
          { id: '2', email: 'b@example.com', name: 'Bob', extra: true },
        ]),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept({} as never, handler)),
    ).resolves.toEqual([
      { id: '1', email: 'a@example.com', name: 'Ada' },
      { id: '2', email: 'b@example.com', name: 'Bob' },
    ]);
  });
});

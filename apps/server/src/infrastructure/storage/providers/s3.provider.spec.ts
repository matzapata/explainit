import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3StorageProvider } from './s3.provider';

describe('S3StorageProvider', () => {
  const send = jest.fn();
  const client = { send } as unknown as S3Client;

  const config = (values: Record<string, string | boolean | undefined>) =>
    ({
      get: (key: string, fallback?: unknown) =>
        values[key] !== undefined ? values[key] : fallback,
    }) as unknown as ConfigService;

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({});
  });

  it('builds path-style public URLs from S3_PUBLIC_ENDPOINT', () => {
    const provider = new S3StorageProvider(
      config({
        S3_BUCKET: 'explainit',
        S3_PUBLIC_ENDPOINT: 'http://localhost:4566',
      }),
      client,
    );

    expect(provider.buildPublicUrl('logos/chat.webp')).toBe(
      'http://localhost:4566/explainit/logos/chat.webp',
    );
  });

  it('falls back to the internal endpoint when no public endpoint is set', () => {
    const provider = new S3StorageProvider(
      config({
        S3_BUCKET: 'explainit',
        S3_ENDPOINT: 'http://floci:4566/',
      }),
      client,
    );

    expect(provider.buildPublicUrl('/logos/chat.webp')).toBe(
      'http://floci:4566/explainit/logos/chat.webp',
    );
  });

  it('builds virtual-hosted AWS URLs when no custom endpoint is set', () => {
    const provider = new S3StorageProvider(
      config({
        S3_BUCKET: 'explainit',
        AWS_REGION: 'eu-west-1',
      }),
      client,
    );

    expect(provider.buildPublicUrl('logos/chat.webp')).toBe(
      'https://explainit.s3.eu-west-1.amazonaws.com/logos/chat.webp',
    );
  });

  it('uploads with a public-read ACL and image content type', async () => {
    const provider = new S3StorageProvider(
      config({ S3_BUCKET: 'explainit' }),
      client,
    );
    const body = Buffer.from('webp');

    await provider.uploadFile('logos/chat.webp', body);

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command.input).toMatchObject({
      Bucket: 'explainit',
      Key: 'logos/chat.webp',
      Body: body,
      ContentType: 'image/webp',
      ACL: 'public-read',
    });
  });

  it('retries upload without ACL when the bucket rejects it', async () => {
    send.mockRejectedValueOnce({ name: 'AccessControlListNotSupported' });
    const provider = new S3StorageProvider(
      config({ S3_BUCKET: 'explainit' }),
      client,
    );
    const body = Buffer.from('webp');

    await provider.uploadFile('logos/chat.webp', body);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].input.ACL).toBeUndefined();
    expect(send.mock.calls[1][0].input.Key).toBe('logos/chat.webp');
  });

  it('ignores missing objects on delete', async () => {
    send.mockRejectedValueOnce({
      name: 'NoSuchKey',
      $metadata: { httpStatusCode: 404 },
    });
    const provider = new S3StorageProvider(
      config({ S3_BUCKET: 'explainit' }),
      client,
    );

    await expect(provider.deleteFile('missing.webp')).resolves.toBeUndefined();
  });

  it('creates the bucket when HeadBucket returns 404', async () => {
    send
      .mockRejectedValueOnce({
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const provider = new S3StorageProvider(
      config({ S3_BUCKET: 'explainit', AWS_REGION: 'us-east-1' }),
      client,
    );

    await provider.onModuleInit();

    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls[1][0].input).toMatchObject({
      Bucket: 'explainit',
    });
  });

  it('returns listed object keys', async () => {
    send.mockResolvedValueOnce({
      Contents: [{ Key: 'a.webp' }, { Key: 'b.webp' }, {}],
    });
    const provider = new S3StorageProvider(
      config({ S3_BUCKET: 'explainit' }),
      client,
    );

    await expect(provider.listFiles()).resolves.toEqual(['a.webp', 'b.webp']);
  });
});

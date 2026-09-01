import { Inject, Injectable, Optional } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { StorageProvider } from './storage.provider';

export const S3_CLIENT = 'S3_CLIENT';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly publicEndpoint?: string;
  private readonly usingInjectedClient: boolean;

  constructor(
    private readonly env: EnvService,
    @Optional() @Inject(S3_CLIENT) client?: S3Client,
  ) {
    this.bucket = this.env.get('S3_BUCKET') ?? 'explainit';
    this.region = this.env.get('AWS_REGION') ?? 'us-east-1';
    this.endpoint = trimSlash(this.env.get('S3_ENDPOINT'));
    this.publicEndpoint = trimSlash(
      this.env.get('S3_PUBLIC_ENDPOINT') ?? this.endpoint,
    );
    this.client = client ?? new S3Client(this.buildClientConfig());
    this.usingInjectedClient = Boolean(client);
  }

  async onModuleInit(): Promise<void> {
    if (
      this.env.get('NODE_ENV') === 'test' &&
      !this.usingInjectedClient
    ) {
      return;
    }

    await this.ensureBucket();
  }

  async uploadFile(path: string, file: Buffer): Promise<void> {
    const input = {
      Bucket: this.bucket,
      Key: path,
      Body: file,
      ContentType: contentTypeFor(path),
      CacheControl: 'public, max-age=31536000',
    };

    try {
      await this.client.send(
        new PutObjectCommand({ ...input, ACL: 'public-read' }),
      );
    } catch (error) {
      if (!isAclNotSupported(error)) {
        throw error;
      }
      await this.client.send(new PutObjectCommand(input));
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );

    if (!result.Body) {
      throw new Error(`S3 object is empty: ${path}`);
    }

    return Buffer.from(await result.Body.transformToByteArray());
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  async listFiles(): Promise<string[]> {
    const result = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
      }),
    );

    return (result.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key));
  }

  async getFileUrl(path: string, makePublic: boolean): Promise<string> {
    if (makePublic) {
      try {
        await this.client.send(
          new PutObjectAclCommand({
            Bucket: this.bucket,
            Key: path,
            ACL: 'public-read',
          }),
        );
      } catch {
        // Bucket may block ACLs (Object Ownership). Public URLs still work when
        // the bucket policy or emulator allows anonymous reads.
      }
    }

    return this.buildPublicUrl(path);
  }

  async resizeImage(
    file: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    return sharp(file).resize(width, height).webp().toBuffer();
  }

  buildPublicUrl(path: string): string {
    const key = path.replace(/^\/+/, '');

    if (this.publicEndpoint) {
      return `${this.publicEndpoint}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private buildClientConfig(): S3ClientConfig {
    const accessKeyId = this.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.env.get('AWS_SECRET_ACCESS_KEY');
    const forcePathStyle =
      this.env.get('S3_FORCE_PATH_STYLE') ?? Boolean(this.endpoint);

    return {
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    };
  }

  private async ensureBucket(): Promise<void> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        await this.headOrCreateBucket();
        return;
      } catch (error) {
        if (isFatalBucketError(error)) {
          throw error;
        }
        lastError = error;
        await sleep(1000);
      }
    }

    throw lastError;
  }

  private async headOrCreateBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }

      try {
        await this.client.send(
          new CreateBucketCommand({
            Bucket: this.bucket,
            ...(this.region === 'us-east-1'
              ? {}
              : {
                  CreateBucketConfiguration: {
                    LocationConstraint: this.region as never,
                  },
                }),
          }),
        );
      } catch (createError) {
        if (!isBucketAlreadyExists(createError)) {
          throw createError;
        }
      }
    }

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['ETag', 'Content-Type'],
              },
            ],
          },
        }),
      );
    } catch {
      // CORS is best-effort for browser logo loads against local emulators.
    }
  }
}

function trimSlash(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.replace(/\/+$/, '');
}

function contentTypeFor(path: string): string {
  if (path.endsWith('.webp')) {
    return 'image/webp';
  }
  if (path.endsWith('.png')) {
    return 'image/png';
  }
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (path.endsWith('.gif')) {
    return 'image/gif';
  }
  return 'application/octet-stream';
}

function isNotFound(error: unknown): boolean {
  const err = error as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    err?.name === 'NotFound' ||
    err?.name === 'NoSuchKey' ||
    err?.name === 'NoSuchBucket' ||
    err?.name === 'NotFoundException' ||
    err?.Code === 'NoSuchBucket' ||
    err?.$metadata?.httpStatusCode === 404
  );
}

function isBucketAlreadyExists(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  return name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists';
}

function isAclNotSupported(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  return name === 'AccessControlListNotSupported' || name === 'InvalidArgument';
}

function isFatalBucketError(error: unknown): boolean {
  const status = (error as { $metadata?: { httpStatusCode?: number } })
    ?.$metadata?.httpStatusCode;
  return status === 401 || status === 403;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

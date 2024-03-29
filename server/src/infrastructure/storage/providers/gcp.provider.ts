import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage.provider';
import { Storage, Bucket } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GcpStorageProvider implements StorageProvider {
  private storage: Storage;
  private bucket: Bucket;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({
      projectId: this.configService.get('GCP_PROJECT_ID'),
      credentials: {
        client_email: this.configService.get('GCP_CLIENT_EMAIL'),
        private_key: this.configService
          .get('GCP_PRIVATE_KEY')
          .split(String.raw`\n`)
          .join('\n'), // https://stackoverflow.com/questions/74131595/error-error1e08010cdecoder-routinesunsupported-with-google-auth-library
      },
    });
    this.bucket = this.storage.bucket(
      this.configService.get('GCP_STORAGE_BUCKET'),
    );
  }

  async uploadFile(path: string, file: Buffer): Promise<void> {
    try {
      await this.bucket.file(path).save(file);
    } catch (error) {
      console.error(error);
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    const [buffer] = await this.bucket.file(path).download();
    return buffer;
  }

  async deleteFile(path: string): Promise<void> {
    await this.bucket.file(path).delete();
  }

  async listFiles(): Promise<string[]> {
    const [files] = await this.bucket.getFiles();
    return files.map((file) => file.name);
  }
}

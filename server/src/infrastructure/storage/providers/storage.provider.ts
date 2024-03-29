export abstract class StorageProvider {
  abstract uploadFile(path: string, file: Buffer): Promise<void>;

  abstract downloadFile(path: string): Promise<Buffer>;

  abstract deleteFile(path: string): Promise<void>;

  abstract listFiles(): Promise<string[]>;
}

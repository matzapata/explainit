export abstract class ObjectStorageProvider {
  abstract uploadFile(path: string, file: Buffer): Promise<void>;

  abstract downloadFile(path: string): Promise<Buffer>;

  abstract deleteFile(path: string): Promise<void>;

  abstract listFiles(): Promise<string[]>;

  abstract getFileUrl(path: string, makePublic: boolean): Promise<string>;

  abstract resizeImage(
    file: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer>;
}

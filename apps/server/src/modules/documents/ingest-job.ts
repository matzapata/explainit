export const INGEST_QUEUE = 'ingest';

export type IngestJob = {
  resourceId: string;
  chatId: string;
  url: string;
};

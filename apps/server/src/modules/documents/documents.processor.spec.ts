import { DocumentsProcessor } from '@src/modules/documents/documents.processor';
import {
  type DocumentsService,
  PermanentIngestError,
} from '@src/modules/documents/documents.service';
import type { IngestJob } from '@src/modules/documents/ingest-job';
import type { Job } from 'bullmq';

describe('DocumentsProcessor', () => {
  const processJob = jest.fn();
  const markFailed = jest.fn();
  const documents = {
    process: processJob,
    markFailed,
  } as unknown as DocumentsService;
  const processor = new DocumentsProcessor(documents);

  const job = {
    data: {
      resourceId: 'resource-1',
      chatId: 'chat-1',
      url: 'https://docs.example.com',
    },
  } as Job<IngestJob>;

  beforeEach(() => {
    processJob.mockReset();
    markFailed.mockReset();
    processJob.mockResolvedValue(undefined);
    markFailed.mockResolvedValue(undefined);
  });

  it('processes the ingest job payload', async () => {
    await processor.process(job);

    expect(processJob).toHaveBeenCalledWith(job.data);
    expect(markFailed).not.toHaveBeenCalled();
  });

  it('marks permanent failures complete without retrying', async () => {
    processJob.mockRejectedValueOnce(new PermanentIngestError('Empty scrape'));

    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(markFailed).toHaveBeenCalledWith('resource-1', 'Empty scrape');
  });

  it('rethrows retryable failures', async () => {
    processJob.mockRejectedValueOnce(new Error('timeout'));

    await expect(processor.process(job)).rejects.toThrow('timeout');
    expect(markFailed).not.toHaveBeenCalled();
  });
});

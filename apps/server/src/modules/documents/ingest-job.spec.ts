import { ingestJobId } from './ingest-job';

describe('ingestJobId', () => {
  it('does not contain a colon, which BullMQ rejects in custom job ids', () => {
    const resourceId = '11111111-2222-3333-4444-555555555555';
    const jobId = ingestJobId(resourceId);

    expect(jobId).not.toContain(':');
    expect(jobId).toContain(resourceId);
  });
});

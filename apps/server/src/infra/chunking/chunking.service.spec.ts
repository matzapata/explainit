import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  const service = new ChunkingService();

  it('turns HTML into namespaced chunks with source metadata', async () => {
    const docs = await service.generateDocsFromHtml(
      {
        html: '<h1>Guide</h1><p>Hello world from the docs.</p>',
        url: 'https://docs.example.com',
        title: 'Docs',
      },
      'chat-1',
      { extra: true },
    );

    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].namespace).toBe('chat-1');
    expect(docs[0].metadata).toEqual({
      source: 'https://docs.example.com',
      title: 'Docs',
      extra: true,
    });
    expect(docs[0].content).toContain('Hello world');
  });

  it('chunks plain text with the same metadata contract', async () => {
    const docs = await service.generateDocsFromText(
      {
        text: 'Plain text about billing.',
        source: 'manual',
        title: 'Notes',
      },
      'chat-1',
    );

    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].namespace).toBe('chat-1');
    expect(docs[0].metadata).toEqual({
      source: 'manual',
      title: 'Notes',
    });
    expect(docs[0].content).toContain('billing');
  });
});

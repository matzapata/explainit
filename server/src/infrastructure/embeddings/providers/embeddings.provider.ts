export abstract class EmbeddingsProvider {
  // Generate embeddings for a given text
  abstract generateEmbeddings(text: string): Promise<number[]>;
}

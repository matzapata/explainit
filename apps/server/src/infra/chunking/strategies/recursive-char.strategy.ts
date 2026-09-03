import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export function createRecursiveCharMarkdownSplitter() {
  return RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 3000,
    chunkOverlap: 100,
  });
}

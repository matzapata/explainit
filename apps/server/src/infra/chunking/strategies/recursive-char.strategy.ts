import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export function createRecursiveCharMarkdownSplitter() {
  return RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 3000,
    chunkOverlap: 100,
  });
}

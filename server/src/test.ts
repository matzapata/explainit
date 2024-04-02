import { OpenAIEmbeddings } from '@langchain/openai';
import { compile } from 'html-to-text';
import { RecursiveUrlLoader } from 'langchain/document_loaders/web/recursive_url';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const url = 'https://js.langchain.com/docs/get_started/introduction';

const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

const loader = new RecursiveUrlLoader(url, {
  extractor: compiledConvert,
  maxDepth: 1,
  excludeDirs: ['https://js.langchain.com/docs/api/'],
});

const embedding = new OpenAIEmbeddings({
  openAIApiKey: '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',
});

loader.load().then(async (docs) => {
  docs = docs.filter((d) => d.pageContent.length > 0);

  const text_splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 200,
  });
  docs = await text_splitter.splitDocuments(docs);
  console.log(
    'docs',
    docs.map((d) => d.pageContent.length),
  );

  const embeddings = await embedding.embedDocuments(
    docs.map((d) => d.pageContent),
  );

  //   console.log(
  //     'embeddings',
  //     em
  //   );

  // (chunk_size = 4000),
  // (chunk_overlap = 200),

  //   embedding
  //     .embedDocuments(
  //       docs.filter((d) => d.pageContent.length > 0).map((d) => d.pageContent),
  //       // .slice(0, 20),
  //       // .slice(1, 2),
  //     )
  //     .then((embeddings) => {
  //       console.log('embeddings', embeddings);
  //     });
});

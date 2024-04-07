// // import 'cheerio';

// import { OpenAIEmbeddings } from '@langchain/openai';
// import { compile } from 'html-to-text';
// import { RecursiveUrlLoader } from 'langchain/document_loaders/web/recursive_url';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';

// // const url = 'https://lilianweng.github.io/posts/2023-06-23-agent/';
// // const question = 'What is Task Decomposition';

// const url =
//   'https://js.langchain.com/docs/use_cases/question_answering/streaming';
// const question = 'How does streaming work in langchain?';

// const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

// const loader = new RecursiveUrlLoader(url, {
//   extractor: compiledConvert,
//   maxDepth: 1,
//   //   excludeDirs: ['https://js.langchain.com/docs/api/'],
// });

// const embedding = new OpenAIEmbeddings({
//   openAIApiKey: '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',
// });

// loader.load().then(async (docs) => {
//   docs = docs.filter((d) => d.pageContent.length > 0);

//   const text_splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 4000,
//     chunkOverlap: 200,
//   });
//   docs = await text_splitter.splitDocuments(docs);
//   console.log('docs', docs.length);

//   const vectorStore = await MemoryVectorStore.fromDocuments(docs, embedding);

//   const resultOne = await vectorStore.similaritySearch(question, 1);

//   console.log('result one', resultOne);

//   //   console.log(
//   //     'embeddings',
//   //     em
//   //   );

//   // (chunk_size = 4000),
//   // (chunk_overlap = 200),

//   //   embedding
//   //     .embedDocuments(
//   //       docs.filter((d) => d.pageContent.length > 0).map((d) => d.pageContent),
//   //       // .slice(0, 20),
//   //       // .slice(1, 2),
//   //     )
//   //     .then((embeddings) => {
//   //       console.log('embeddings', embeddings);
//   //     });
// });

// ===========================================================================================
// load https://docs.nestjs.com/

// split

// retrieve

// prompt chain, history and question

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { formatDocumentsAsString } from 'langchain/util/document';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  RunnableSequence,
  RunnablePassthrough,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PlaywrightWebBaseLoader } from 'langchain/document_loaders/web/playwright';
import { RecursiveUrlLoader } from 'langchain/document_loaders/web/recursive_url';
import { compile } from 'html-to-text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { pull } from 'langchain/hub';

const OPENAI_API_KEY = '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';
const model = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY });
const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });

async function buildRetriever() {
  const url = 'https://docs.lemonsqueezy.com/api';
  const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

  const loader = new RecursiveUrlLoader(url, {
    extractor: compiledConvert,
    maxDepth: 2,
  });
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(await loader.load());
  //   console.log(
  //     'loading docs',
  //     docs.map((d) => d.pageContent.length),
  //   );
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
}

async function buildStandaloneQuestion(question, chatHistory) {
  const condenseQuestionTemplate = `Given a chat history and the latest user question
  which might reference context in the chat history, formulate a standalone question
  which can be understood without the chat history. Do NOT answer the question,
  just reformulate it if needed and otherwise return it as is.

  Chat History:
    {chatHistory}
  Question:
    {question}`;
  const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
    condenseQuestionTemplate,
  );

  const formatChatHistory = (chatHistory: [string, string][]) => {
    const formattedDialogueTurns = chatHistory.map(
      (dialogueTurn) =>
        `Human: ${dialogueTurn[0]}\nAssistant: ${dialogueTurn[1]}`,
    );
    return formattedDialogueTurns.join('\n');
  };

  type ConversationalRetrievalQAChainInput = {
    question: string;
    chatHistory: [string, string][];
  };

  const standaloneQuestionChain = RunnableSequence.from([
    {
      question: (input: ConversationalRetrievalQAChainInput) => input.question,
      chatHistory: (input: ConversationalRetrievalQAChainInput) =>
        formatChatHistory(input.chatHistory),
    },
    CONDENSE_QUESTION_PROMPT,
    model,
    new StringOutputParser(),
  ]);

  const standaloneQuestion = await standaloneQuestionChain.invoke({
    question: question,
    chatHistory: chatHistory,
  });
  return standaloneQuestion;
}

async function buildAnswerQuestion(question, context) {
  const answerTemplate = `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know.
  Question: {question}
  Context: {context} 
  Answer:
`;
  const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);

  const answerChain = RunnableSequence.from([
    {
      context: (input) => input.context,
      question: (input) => input.question,
    },
    ANSWER_PROMPT,
    model,
    new StringOutputParser(),
  ]);

  const answer = await answerChain.invoke({
    question: question,
    context: formatDocumentsAsString(context),
  });
  return answer;
}

async function main() {
  const standaloneQuestion = await buildStandaloneQuestion(
    'How to create a customer?',
    [],
  );
  console.log(standaloneQuestion);

  const retriever = await buildRetriever();
  const context = await retriever.similaritySearch(standaloneQuestion);
  console.log(context);

  const answer = await buildAnswerQuestion(standaloneQuestion, context);
  console.log(answer);
}

// main();

// pull('rlm/rag-prompt').then((c) =>
//   console.log((c.toJSON() as any).kwargs.messages),
// );

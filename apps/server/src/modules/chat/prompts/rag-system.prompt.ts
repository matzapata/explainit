import { PromptTemplate } from '@langchain/core/prompts';

export const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
  `Given a chat history and the latest user question
    which might reference context in the chat history, formulate a standalone question
    which can be understood without the chat history. Do NOT answer the question,
    just reformulate it if needed and otherwise return it as is.

    Chat History:
      {chatHistory}
    Selected text from the page (may be empty):
      {selectedText}
    Question:
      {question}`,
);

export const ANSWER_PROMPT = PromptTemplate.fromTemplate(
  `You are an assistant for question-answering tasks.
    Use the following pieces of retrieved context to answer the question.
    If selected text is provided, treat it as a highlighted passage the visitor is asking about.
    If you don't know the answer, just say that you don't know.

    Question: {question}
    Selected text: {selectedText}
    Context: {context}
    Answer:
  `,
);

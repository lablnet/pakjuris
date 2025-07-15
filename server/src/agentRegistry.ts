import { Clarifier } from './agents/Clarifier';
import { QueryGenerator } from './agents/QueryGenerator';
import { Retriever } from './agents/Retriever';
import { Summarizer } from './agents/Summarizer';

export const tools = [
  new Clarifier(),
  new QueryGenerator(),
  new Retriever(),
  new Summarizer()
];

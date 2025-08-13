import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { END, START, StateGraph } from "@langchain/langgraph";
import { createChatModel } from "./llm/llmConfig.js";
import { logger } from "./utils/logger.js";
import { getCheckpointer } from "./memory/checkpointer.js";
import { MessagesAnnotation } from "@langchain/langgraph";
import { getReactAgentSystemPrompt } from "./prompts/reactAgentPrompts.js";
import { RetrieveDocumentsTool } from "./tools/RetrieveDocumentsTool.js";


export async function buildReactAgentGraph() {
  logger.info("🚀 Building React Agent Graph...");

  const model = createChatModel();
  const retrieveDocuments = new RetrieveDocumentsTool("documents").asTool();
  const llmWithTools = model.bindTools([retrieveDocuments]);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", getReactAgentSystemPrompt()],
    new MessagesPlaceholder("messages"),
  ]);

  const agent = async (state: typeof MessagesAnnotation.State) => {
    logger.info(`💬 Agent node received messages: ${JSON.stringify(state.messages, null, 2)}`);

    const chain = prompt.pipe(llmWithTools);
    logger.info("🤖 Sending prompt + tools to LLM...");

    const response = await chain.invoke({ messages: state.messages }, { timeout: 15_000 });
    console.log("response", response);
    // Print actual content & tool_calls (JSON.stringify on AIMessage is often empty)
    const c =
      typeof (response as any)?.content === "string"
        ? (response as any).content
        : JSON.stringify((response as any)?.content, null, 2);
    logger.info("🤖 LLM response content:", c);

    const toolCalls = (response as any)?.tool_calls;
    if (toolCalls?.length) {
      logger.info(`🧰 tool_calls: ${JSON.stringify(toolCalls, null, 2)}`);
    }

    return { messages: [response] };
  };

  const toolNode = new ToolNode([retrieveDocuments]);

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", agent)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolsCondition, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent");

  const checkpointer = await getCheckpointer();
  const app = workflow.compile({ checkpointer });

  logger.info("✅ React Agent Graph built successfully");
  return { app };
}

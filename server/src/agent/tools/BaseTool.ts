import { z } from "zod";
import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import type { RunnableConfig } from "@langchain/core/runnables";

/**
 * Abstract base for class-based tools.
 * Subclasses implement `name`, `description`, `schema`, and `run()`.
 * `asTool()` returns a LangChain StructuredTool you can pass to LLMs/ToolNode.
 */
export abstract class BaseTool<TSchema extends z.ZodTypeAny> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly schema: TSchema;

  /** Implement the tool logic. Args already validated by Zod. */
  abstract run(args: z.infer<TSchema>, config?: RunnableConfig): Promise<any>;

  /** Convert this class into a LangChain tool */
  asTool(): StructuredToolInterface<TSchema> {
    return tool(
      async (args: z.infer<TSchema>, config?: RunnableConfig) => {
        return this.run(args, config);
      },
      {
        name: this.name,
        description: this.description,
        schema: this.schema,
      }
    );
  }
}

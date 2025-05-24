// Core framework exports
export { ActionRegistry, actionRegistry } from "./core/action-registry.js";
export { ContextManager } from "./core/context-manager.js";
export * from "./core/types.js";

// Configuration exports
export {
	AISDKConfig,
	createConfigFromEnv,
	defaultConfig,
} from "./config/ai-sdk-config.js";

// Re-export AI SDK core functions for convenience
export { createAnthropic } from "@ai-sdk/anthropic";
export { createOpenAI } from "@ai-sdk/openai";
export {
	generateObject,
	generateText,
	streamObject,
	streamText,
	tool,
} from "ai";

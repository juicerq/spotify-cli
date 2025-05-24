// Core framework exports
export { ActionRegistry, actionRegistry } from "./core/action-registry.js";
export { AIIntegration } from "./core/ai-integration.js";
export { ContextManager } from "./core/context-manager.js";
export { ToolExecutionEngine } from "./core/execution-engine.js";

// Configuration exports
export {
	AISDKConfig,
	createConfigFromEnv,
	defaultConfig,
} from "./config/ai-sdk-config.js";

// Tools exports
export * from "./tools/index.js";
export {
	getAllTools,
	getToolsByCategory,
	registerAllTools,
} from "./tools/tool-registry.js";

// Types exports
export type { AIIntegrationConfig, AIResponse } from "./core/ai-integration.js";
export type {
	ExecutionConfig,
	RateLimitState,
} from "./core/execution-engine.js";
export type * from "./core/types.js";

// Examples exports
export { basicUsageExample } from "./examples/basic-usage.js";
export { demonstrateStep2 } from "./examples/step2-tools-usage.js";
export {
	directExecutionExample,
	step3ExecutionExample,
} from "./examples/step3-execution-usage.js";

// Re-export AI SDK for convenience
export { generateText, streamText } from "ai";

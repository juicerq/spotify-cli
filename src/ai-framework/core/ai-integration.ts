import { type Tool, generateText, streamText } from "ai";
import type { AISDKConfig } from "../config/ai-sdk-config.js";
import { actionRegistry } from "./action-registry.js";
import { ContextManager } from "./context-manager.js";
import {
	type ExecutionConfig,
	ToolExecutionEngine,
} from "./execution-engine.js";
import type {
	AIContext,
	ActionCategory,
	ActionExecutionContext,
	ActionExecutionResult,
	ConversationMessage,
	ToolCall,
	ToolResult,
} from "./types.js";

export interface AIIntegrationConfig {
	execution: ExecutionConfig;
	maxSteps: number;
	enableStreaming: boolean;
	autoSaveContext: boolean;
}

export interface AIResponse {
	text: string;
	toolCalls: ToolCall[];
	toolResults: ToolResult[];
	context: AIContext;
	success: boolean;
	error?: string;
}

export class AIIntegration {
	private executionEngine: ToolExecutionEngine;
	private contextManager: ContextManager;

	constructor(
		private aiConfig: AISDKConfig,
		private config: AIIntegrationConfig = {
			execution: {
				enableRateLimit: true,
				maxRetries: 3,
				retryDelayMs: 1000,
				enableLogging: true,
			},
			maxSteps: 5,
			enableStreaming: false,
			autoSaveContext: true,
		},
	) {
		this.executionEngine = new ToolExecutionEngine(
			config.execution,
			this.log.bind(this),
		);
		this.contextManager = new ContextManager();
	}

	async initialize(context?: Partial<AIContext>): Promise<AIContext> {
		// Update context if provided, otherwise use current context
		if (context?.spotify) {
			this.contextManager.updateSpotifyContext(context.spotify);
		}
		if (context?.session?.metadata) {
			this.contextManager.updateSessionMetadata(context.session.metadata);
		}

		const aiContext = this.contextManager.getContext();

		// Initialize execution engine with context
		await this.executionEngine.initialize(aiContext);

		this.log("AI Integration initialized");
		return aiContext;
	}

	async executePrompt(
		prompt: string,
		context?: AIContext,
		options?: {
			tools?: string[];
			category?: string;
			permissions?: string[];
		},
	): Promise<AIResponse> {
		const aiContext = context || (await this.initialize());

		// Get tools based on options
		const tools = this.getToolsForExecution(options);

		// Add user message to context
		const userMessage: ConversationMessage = {
			id: this.generateId(),
			role: "user",
			content: prompt,
			timestamp: new Date(),
		};

		aiContext.conversationHistory.push(userMessage);

		const toolCalls: ToolCall[] = [];
		const toolResults: ToolResult[] = [];

		// Execute with AI SDK
		const result = await generateText({
			model: this.aiConfig.getDefaultModel(),
			prompt,
			tools,
			maxSteps: this.config.maxSteps,
			onStepFinish: async (step) => {
				// Handle tool calls
				if (step.toolCalls && step.toolCalls.length > 0) {
					for (const toolCall of step.toolCalls) {
						const toolCallRecord: ToolCall = {
							id: toolCall.toolCallId,
							name: toolCall.toolName,
							parameters: toolCall.args,
							timestamp: new Date(),
						};
						toolCalls.push(toolCallRecord);

						// Execute tool
						const executionContext: ActionExecutionContext = {
							context: aiContext,
							toolCallId: toolCall.toolCallId,
							parameters: toolCall.args,
						};

						const executionResult = await this.executionEngine.executeAction(
							toolCall.toolName,
							executionContext,
						);

						const toolResult: ToolResult = {
							toolCallId: toolCall.toolCallId,
							result: executionResult.data,
							success: executionResult.success,
							error: executionResult.error,
							timestamp: new Date(),
						};
						toolResults.push(toolResult);

						this.log(
							`Tool '${toolCall.toolName}' executed: ${executionResult.success ? "success" : "failed"}`,
						);
					}
				}
			},
		});

		// Add assistant message to context
		const assistantMessage: ConversationMessage = {
			id: this.generateId(),
			role: "assistant",
			content: result.text,
			timestamp: new Date(),
			toolCalls,
			toolResults,
		};

		aiContext.conversationHistory.push(assistantMessage);
		aiContext.session.lastActivity = new Date();

		// Auto-save context if enabled
		if (this.config.autoSaveContext) {
			this.saveContextToStorage(aiContext);
		}

		return {
			text: result.text,
			toolCalls,
			toolResults,
			context: aiContext,
			success: true,
		};
	}

	async streamPrompt(
		prompt: string,
		context?: AIContext,
		options?: {
			tools?: string[];
			category?: string;
			permissions?: string[];
		},
	): Promise<
		AsyncIterable<{
			type: "text" | "tool-call" | "tool-result" | "finish";
			content?: string;
			toolCall?: ToolCall;
			toolResult?: ToolResult;
			context?: AIContext;
		}>
	> {
		const aiContext = context || (await this.initialize());
		const tools = this.getToolsForExecution(options);

		const toolCalls: ToolCall[] = [];
		const toolResults: ToolResult[] = [];

		// Add user message to context
		const userMessage: ConversationMessage = {
			id: this.generateId(),
			role: "user",
			content: prompt,
			timestamp: new Date(),
		};

		aiContext.conversationHistory.push(userMessage);

		const stream = streamText({
			model: this.aiConfig.getDefaultModel(),
			prompt,
			tools,
			maxSteps: this.config.maxSteps,
			onStepFinish: async (step) => {
				// Handle tool calls in streaming mode
				if (step.toolCalls && step.toolCalls.length > 0) {
					for (const toolCall of step.toolCalls) {
						const toolCallRecord: ToolCall = {
							id: toolCall.toolCallId,
							name: toolCall.toolName,
							parameters: toolCall.args,
							timestamp: new Date(),
						};
						toolCalls.push(toolCallRecord);

						// Execute tool
						const executionContext: ActionExecutionContext = {
							context: aiContext,
							toolCallId: toolCall.toolCallId,
							parameters: toolCall.args,
						};

						const executionResult = await this.executionEngine.executeAction(
							toolCall.toolName,
							executionContext,
						);

						const toolResult: ToolResult = {
							toolCallId: toolCall.toolCallId,
							result: executionResult.data,
							success: executionResult.success,
							error: executionResult.error,
							timestamp: new Date(),
						};
						toolResults.push(toolResult);
					}
				}
			},
		});

		// Create async generator for streaming
		return this.createStreamGenerator(
			stream,
			aiContext,
			toolCalls,
			toolResults,
		);
	}

	private async *createStreamGenerator(
		stream: ReturnType<typeof streamText>,
		context: AIContext,
		toolCalls: ToolCall[],
		toolResults: ToolResult[],
	): AsyncIterable<{
		type: "text" | "tool-call" | "tool-result" | "finish";
		content?: string;
		toolCall?: ToolCall;
		toolResult?: ToolResult;
		context?: AIContext;
	}> {
		let fullText = "";

		for await (const chunk of stream.textStream) {
			fullText += chunk;
			yield {
				type: "text",
				content: chunk,
			};
		}

		// Yield tool calls and results
		for (const toolCall of toolCalls) {
			yield {
				type: "tool-call",
				toolCall,
			};
		}

		for (const toolResult of toolResults) {
			yield {
				type: "tool-result",
				toolResult,
			};
		}

		// Add assistant message to context
		const assistantMessage: ConversationMessage = {
			id: this.generateId(),
			role: "assistant",
			content: fullText,
			timestamp: new Date(),
			toolCalls,
			toolResults,
		};

		context.conversationHistory.push(assistantMessage);
		context.session.lastActivity = new Date();

		// Auto-save context if enabled
		if (this.config.autoSaveContext) {
			this.saveContextToStorage(context);
		}

		yield {
			type: "finish",
			context,
		};
	}

	async executeAction(
		actionName: string,
		parameters: Record<string, unknown>,
		context?: AIContext,
	): Promise<ActionExecutionResult> {
		const aiContext = context || (await this.initialize());

		const executionContext: ActionExecutionContext = {
			context: aiContext,
			toolCallId: this.generateId(),
			parameters,
		};

		return this.executionEngine.executeAction(actionName, executionContext);
	}

	async getAvailableTools(options?: {
		category?: string;
		permissions?: string[];
	}): Promise<{
		tools: Array<{
			name: string;
			description: string;
			category: string;
			permissions?: string[];
		}>;
		count: number;
	}> {
		const allActions = actionRegistry.getAll();
		let filteredActions = allActions;

		// Filter by category if specified
		if (options?.category) {
			filteredActions = actionRegistry.getByCategory(
				options.category as ActionCategory,
			);
		}

		// Filter by permissions if specified
		if (options?.permissions) {
			filteredActions = filteredActions.filter((action) => {
				if (!action.permissions || action.permissions.length === 0) {
					return true; // No permissions required
				}
				return action.permissions.every(
					(permission) => options.permissions?.includes(permission) ?? false,
				);
			});
		}

		return {
			tools: filteredActions.map((action) => ({
				name: action.name,
				description: action.description,
				category: action.category,
				permissions: action.permissions,
			})),
			count: filteredActions.length,
		};
	}

	async getSystemStatus(): Promise<{
		status: string;
		context: AIContext;
		executionEngine: Record<string, unknown>;
		availableTools: number;
	}> {
		const currentContext = this.contextManager.getContext();
		const systemStatusResult = await this.executionEngine.executeAction(
			"get_system_status",
			{
				context: currentContext,
				toolCallId: this.generateId(),
				parameters: {},
			},
		);

		return {
			status: "operational",
			context: currentContext,
			executionEngine:
				(systemStatusResult.data as Record<string, unknown>) || {},
			availableTools: actionRegistry.getAll().length,
		};
	}

	private getToolsForExecution(options?: {
		tools?: string[];
		category?: string;
		permissions?: string[];
	}): Record<string, Tool> {
		if (options?.tools) {
			// Get specific tools
			const tools: Record<string, Tool> = {};
			for (const toolName of options.tools) {
				const action = actionRegistry.get(toolName);
				if (action) {
					tools[toolName] = action.tool;
				}
			}
			return tools;
		}

		if (options?.category) {
			// Get tools by category
			return actionRegistry.getToolsByCategory(
				options.category as ActionCategory,
			);
		}

		if (options?.permissions) {
			// Get tools by permissions
			return actionRegistry.getToolsWithPermissions(options.permissions);
		}

		// Get all tools
		return actionRegistry.getTools();
	}

	private saveContextToStorage(context: AIContext): void {
		// In a real implementation, this would save to persistent storage
		// For now, we'll just export to JSON format
		const contextJson = this.contextManager.exportContext();
		this.log(`Context saved: ${contextJson.length} characters`);
	}

	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private log(message: string): void {
		if (this.config.execution.enableLogging) {
			console.log(`[AIIntegration] ${message}`);
		}
	}
}

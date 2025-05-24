import type { Tool } from "ai";
import { z } from "zod";

// Base types for the AI framework
export interface AIFrameworkConfig {
	providers: {
		openai?: {
			apiKey: string;
			model?: string;
		};
		anthropic?: {
			apiKey: string;
			model?: string;
		};
	};
	defaultProvider: "openai" | "anthropic";
	maxSteps?: number;
	enableStreaming?: boolean;
}

// Context management types
export interface SessionContext {
	userId?: string;
	sessionId: string;
	startTime: Date;
	lastActivity: Date;
	metadata: Record<string, unknown>;
}

export interface SpotifyContext {
	accessToken?: string;
	refreshToken?: string;
	userId?: string;
	isAuthenticated: boolean;
}

export interface AIContext {
	session: SessionContext;
	spotify: SpotifyContext;
	conversationHistory: ConversationMessage[];
}

export interface ConversationMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	toolCalls?: ToolCall[];
	toolResults?: ToolResult[];
}

export interface ToolCall {
	id: string;
	name: string;
	parameters: Record<string, unknown>;
	timestamp: Date;
}

export interface ToolResult {
	toolCallId: string;
	result: unknown;
	success: boolean;
	error?: string;
	timestamp: Date;
}

// Action registry types
export interface ActionDefinition {
	name: string;
	description: string;
	category: ActionCategory;
	tool: Tool;
	permissions?: string[];
	rateLimit?: {
		maxCalls: number;
		windowMs: number;
	};
}

export type ActionCategory =
	| "playlist"
	| "track"
	| "user"
	| "search"
	| "system";

export interface ActionRegistry {
	register(action: ActionDefinition): void;
	unregister(name: string): void;
	get(name: string): ActionDefinition | undefined;
	getByCategory(category: ActionCategory): ActionDefinition[];
	getAll(): ActionDefinition[];
	getTools(): Record<string, Tool>;
}

// Execution types
export interface ActionExecutionContext {
	context: AIContext;
	toolCallId: string;
	parameters: Record<string, unknown>;
}

export interface ActionExecutionResult {
	success: boolean;
	data?: unknown;
	error?: string;
	metadata?: Record<string, unknown>;
}

// Validation schemas
export const SessionContextSchema = z.object({
	userId: z.string().optional(),
	sessionId: z.string(),
	startTime: z.date(),
	lastActivity: z.date(),
	metadata: z.record(z.unknown()),
});

export const SpotifyContextSchema = z.object({
	accessToken: z.string().optional(),
	refreshToken: z.string().optional(),
	userId: z.string().optional(),
	isAuthenticated: z.boolean(),
});

export const AIContextSchema = z.object({
	session: SessionContextSchema,
	spotify: SpotifyContextSchema,
	conversationHistory: z.array(
		z.object({
			id: z.string(),
			role: z.enum(["user", "assistant", "system"]),
			content: z.string(),
			timestamp: z.date(),
			toolCalls: z
				.array(
					z.object({
						id: z.string(),
						name: z.string(),
						parameters: z.record(z.unknown()),
						timestamp: z.date(),
					}),
				)
				.optional(),
			toolResults: z
				.array(
					z.object({
						toolCallId: z.string(),
						result: z.unknown(),
						success: z.boolean(),
						error: z.string().optional(),
						timestamp: z.date(),
					}),
				)
				.optional(),
		}),
	),
});

import { randomUUID } from "node:crypto";
import type {
	AIContext,
	ConversationMessage,
	SpotifyContext,
	ToolCall,
	ToolResult,
} from "./types.js";
import { AIContextSchema } from "./types.js";

/**
 * Manages AI conversation context including session state, Spotify context, and conversation history
 */
export class ContextManager {
	private context: AIContext;

	constructor(initialSpotifyContext?: Partial<SpotifyContext>) {
		this.context = this.createInitialContext(initialSpotifyContext);
	}

	/**
	 * Create initial context with default values
	 */
	private createInitialContext(
		spotifyContext?: Partial<SpotifyContext>,
	): AIContext {
		const now = new Date();

		return {
			session: {
				sessionId: randomUUID(),
				startTime: now,
				lastActivity: now,
				metadata: {},
			},
			spotify: {
				isAuthenticated: false,
				...spotifyContext,
			},
			conversationHistory: [],
		};
	}

	/**
	 * Get current context
	 */
	getContext(): AIContext {
		return { ...this.context };
	}

	/**
	 * Update session metadata
	 */
	updateSessionMetadata(metadata: Record<string, unknown>): void {
		this.context.session.metadata = {
			...this.context.session.metadata,
			...metadata,
		};
		this.updateLastActivity();
	}

	/**
	 * Update Spotify context
	 */
	updateSpotifyContext(updates: Partial<SpotifyContext>): void {
		this.context.spotify = {
			...this.context.spotify,
			...updates,
		};
		this.updateLastActivity();
	}

	/**
	 * Add a message to conversation history
	 */
	addMessage(message: Omit<ConversationMessage, "id" | "timestamp">): void {
		const fullMessage: ConversationMessage = {
			...message,
			id: randomUUID(),
			timestamp: new Date(),
		};

		this.context.conversationHistory.push(fullMessage);
		this.updateLastActivity();
	}

	/**
	 * Add tool calls to the last assistant message
	 */
	addToolCalls(toolCalls: Omit<ToolCall, "timestamp">[]): void {
		const lastMessage = this.getLastMessage();

		if (!lastMessage || lastMessage.role !== "assistant") {
			throw new Error("Cannot add tool calls: no assistant message found");
		}

		const timestampedToolCalls: ToolCall[] = toolCalls.map((call) => ({
			...call,
			timestamp: new Date(),
		}));

		lastMessage.toolCalls = [
			...(lastMessage.toolCalls || []),
			...timestampedToolCalls,
		];

		this.updateLastActivity();
	}

	/**
	 * Add tool results to conversation
	 */
	addToolResults(toolResults: Omit<ToolResult, "timestamp">[]): void {
		const lastMessage = this.getLastMessage();

		if (!lastMessage || lastMessage.role !== "assistant") {
			throw new Error("Cannot add tool results: no assistant message found");
		}

		const timestampedResults: ToolResult[] = toolResults.map((result) => ({
			...result,
			timestamp: new Date(),
		}));

		lastMessage.toolResults = [
			...(lastMessage.toolResults || []),
			...timestampedResults,
		];

		this.updateLastActivity();
	}

	/**
	 * Get the last message in conversation
	 */
	getLastMessage(): ConversationMessage | undefined {
		return this.context.conversationHistory[
			this.context.conversationHistory.length - 1
		];
	}

	/**
	 * Get conversation history filtered by role
	 */
	getMessagesByRole(role: ConversationMessage["role"]): ConversationMessage[] {
		return this.context.conversationHistory.filter((msg) => msg.role === role);
	}

	/**
	 * Get recent messages (last N messages)
	 */
	getRecentMessages(count: number): ConversationMessage[] {
		return this.context.conversationHistory.slice(-count);
	}

	/**
	 * Clear conversation history
	 */
	clearHistory(): void {
		this.context.conversationHistory = [];
		this.updateLastActivity();
	}

	/**
	 * Reset session (keeps Spotify context)
	 */
	resetSession(): void {
		const spotifyContext = this.context.spotify;
		this.context = this.createInitialContext(spotifyContext);
	}

	/**
	 * Get session duration in milliseconds
	 */
	getSessionDuration(): number {
		return (
			this.context.session.lastActivity.getTime() -
			this.context.session.startTime.getTime()
		);
	}

	/**
	 * Check if session is active (last activity within threshold)
	 */
	isSessionActive(thresholdMs: number = 30 * 60 * 1000): boolean {
		// 30 minutes default
		const now = new Date();
		const timeSinceLastActivity =
			now.getTime() - this.context.session.lastActivity.getTime();
		return timeSinceLastActivity < thresholdMs;
	}

	/**
	 * Validate context against schema
	 */
	validateContext(): boolean {
		const result = AIContextSchema.safeParse(this.context);
		return result.success;
	}

	/**
	 * Export context for persistence
	 */
	exportContext(): string {
		return JSON.stringify(this.context, null, 2);
	}

	/**
	 * Import context from JSON
	 */
	importContext(contextJson: string): void {
		const parsed = JSON.parse(contextJson);

		// Convert date strings back to Date objects
		parsed.session.startTime = new Date(parsed.session.startTime);
		parsed.session.lastActivity = new Date(parsed.session.lastActivity);

		for (const message of parsed.conversationHistory) {
			message.timestamp = new Date(message.timestamp);

			if (message.toolCalls) {
				for (const toolCall of message.toolCalls) {
					toolCall.timestamp = new Date(toolCall.timestamp);
				}
			}

			if (message.toolResults) {
				for (const toolResult of message.toolResults) {
					toolResult.timestamp = new Date(toolResult.timestamp);
				}
			}
		}

		// Validate imported context
		const result = AIContextSchema.safeParse(parsed);
		if (!result.success) {
			throw new Error(`Invalid context format: ${result.error.message}`);
		}

		this.context = parsed;
	}

	/**
	 * Update last activity timestamp
	 */
	private updateLastActivity(): void {
		this.context.session.lastActivity = new Date();
	}
}

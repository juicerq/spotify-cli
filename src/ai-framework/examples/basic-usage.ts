import { tool } from "ai";
import { z } from "zod";
import {
	AISDKConfig,
	ContextManager,
	actionRegistry,
	createConfigFromEnv,
	generateText,
} from "../index.js";

/**
 * Basic usage example of the AI Framework
 * This demonstrates how to set up and use the framework
 */
async function basicUsageExample() {
	// 1. Create configuration from environment variables
	const config = createConfigFromEnv();

	// 2. Initialize AI SDK configuration
	const aiConfig = new AISDKConfig(config);

	// 3. Create context manager
	const contextManager = new ContextManager({
		isAuthenticated: false, // Will be updated when Spotify auth is implemented
	});

	// 4. Register a simple example action
	const exampleAction = tool({
		description: "Get information about the current session",
		parameters: z.object({
			infoType: z
				.enum(["session", "spotify", "history"])
				.describe("Type of information to retrieve"),
		}),
		execute: async ({ infoType }) => {
			const context = contextManager.getContext();

			switch (infoType) {
				case "session":
					return {
						sessionId: context.session.sessionId,
						duration: contextManager.getSessionDuration(),
						isActive: contextManager.isSessionActive(),
					};
				case "spotify":
					return {
						isAuthenticated: context.spotify.isAuthenticated,
						userId: context.spotify.userId || "Not authenticated",
					};
				case "history":
					return {
						messageCount: context.conversationHistory.length,
						recentMessages: contextManager.getRecentMessages(3),
					};
				default:
					return { error: "Unknown info type" };
			}
		},
	});

	// Register the action
	actionRegistry.register({
		name: "get_session_info",
		description: "Get information about the current session",
		category: "system",
		tool: exampleAction,
	});

	// 5. Add a user message to context
	contextManager.addMessage({
		role: "user",
		content: "Tell me about my current session",
	});

	// 6. Generate AI response using the framework
	if (aiConfig.getAvailableProviders().length > 0) {
		const result = await generateText({
			model: aiConfig.getDefaultModel(),
			prompt: "Get information about the current session and provide a summary",
			tools: actionRegistry.getTools(),
			...aiConfig.getGenerationConfig(),
		});

		// Add AI response to context
		contextManager.addMessage({
			role: "assistant",
			content: result.text,
		});

		console.log("AI Response:", result.text);
		console.log("Tool Calls:", result.toolCalls);
		console.log("Registry Stats:", actionRegistry.getStats());
	} else {
		console.log(
			"No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables.",
		);
	}

	// 7. Export context for persistence (optional)
	const exportedContext = contextManager.exportContext();
	console.log("Exported Context Length:", exportedContext.length);
}

// Export for use in other files
export { basicUsageExample };

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	basicUsageExample().catch(console.error);
}

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { AIFrameworkConfig } from "../core/types.js";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini" as const;
export const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022" as const;

/**
 * AI SDK Configuration
 * Manages provider setup and model selection
 */
export class AISDKConfig {
	private config: AIFrameworkConfig;
	private providers: Record<string, LanguageModel> = {};

	constructor(config: AIFrameworkConfig) {
		this.config = config;
		this.initializeProviders();
	}

	/**
	 * Initialize AI providers based on configuration
	 */
	private initializeProviders(): void {
		// Initialize OpenAI provider
		if (this.config.providers.openai?.apiKey) {
			const openaiProvider = createOpenAI({
				apiKey: this.config.providers.openai.apiKey,
			});
			this.providers.openai = openaiProvider(
				this.config.providers.openai.model || DEFAULT_OPENAI_MODEL,
			);
		}

		// Initialize Anthropic provider
		if (this.config.providers.anthropic?.apiKey) {
			const anthropicProvider = createAnthropic({
				apiKey: this.config.providers.anthropic.apiKey,
			});
			this.providers.anthropic = anthropicProvider(
				this.config.providers.anthropic.model || DEFAULT_ANTHROPIC_MODEL,
			);
		}
	}

	/**
	 * Get the default model based on configuration
	 */
	getDefaultModel(): LanguageModel {
		const defaultProvider = this.config.defaultProvider;
		const model = this.providers[defaultProvider];

		if (!model) {
			throw new Error(
				`Default provider '${defaultProvider}' is not configured`,
			);
		}

		return model;
	}

	/**
	 * Get a specific model by provider name
	 */
	getModel(provider: string): LanguageModel {
		const model = this.providers[provider];

		if (!model) {
			throw new Error(`Provider '${provider}' is not configured`);
		}

		return model;
	}

	/**
	 * Get all available providers
	 */
	getAvailableProviders(): string[] {
		return Object.keys(this.providers);
	}

	/**
	 * Check if a provider is available
	 */
	isProviderAvailable(provider: string): boolean {
		return provider in this.providers;
	}

	/**
	 * Get configuration for generateText/streamText
	 */
	getGenerationConfig() {
		return {
			maxSteps: this.config.maxSteps || 5,
			experimental_continueSteps: true,
		};
	}

	/**
	 * Update provider configuration
	 */
	updateProvider(provider: string, apiKey: string, model?: string): void {
		if (provider === "openai") {
			this.config.providers.openai = { apiKey, model };
			const openaiProvider = createOpenAI({ apiKey });
			this.providers.openai = openaiProvider(model || DEFAULT_OPENAI_MODEL);
		}

		if (provider === "anthropic") {
			this.config.providers.anthropic = { apiKey, model };
			const anthropicProvider = createAnthropic({ apiKey });
			this.providers.anthropic = anthropicProvider(
				model || "claude-3-5-sonnet-20241022",
			);
		}
	}
}

/**
 * Create AI SDK configuration from environment variables
 */
export function createConfigFromEnv(): AIFrameworkConfig {
	return {
		providers: {
			openai: process.env.OPENAI_API_KEY
				? {
						apiKey: process.env.OPENAI_API_KEY,
						model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
					}
				: undefined,
			anthropic: process.env.ANTHROPIC_API_KEY
				? {
						apiKey: process.env.ANTHROPIC_API_KEY,
						model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
					}
				: undefined,
		},
		defaultProvider:
			(process.env.DEFAULT_AI_PROVIDER as "openai" | "anthropic") || "openai",
		maxSteps: process.env.AI_MAX_STEPS
			? Number.parseInt(process.env.AI_MAX_STEPS, 10)
			: 5,
		enableStreaming: process.env.AI_ENABLE_STREAMING !== "false",
	};
}

/**
 * Default configuration for development
 */
export const defaultConfig: AIFrameworkConfig = {
	providers: {},
	defaultProvider: "openai",
	maxSteps: 5,
	enableStreaming: true,
};

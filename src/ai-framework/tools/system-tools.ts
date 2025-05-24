import { tool } from "ai";
import { z } from "zod";

export const getAvailableToolsTool = tool({
	description: "Get list of all available tools and their descriptions",
	parameters: z.object({
		category: z
			.enum(["playlist", "track", "user", "search", "system"])
			.optional()
			.describe("Filter tools by category"),
	}),
	execute: async ({ category }) => {
		return {
			success: true,
			action: "get_available_tools",
			parameters: { category },
			message: category
				? `Request to get tools in category "${category}"`
				: "Request to get all available tools",
		};
	},
});

export const getSystemStatusTool = tool({
	description: "Get system status and health information",
	parameters: z.object({}),
	execute: async () => {
		return {
			success: true,
			action: "get_system_status",
			parameters: {},
			message: "Request to get system status",
		};
	},
});

export const getSpotifyConnectionStatusTool = tool({
	description: "Check Spotify API connection status and authentication",
	parameters: z.object({}),
	execute: async () => {
		return {
			success: true,
			action: "get_spotify_connection_status",
			parameters: {},
			message: "Request to check Spotify connection status",
		};
	},
});

export const refreshSpotifyTokenTool = tool({
	description: "Refresh Spotify access token",
	parameters: z.object({}),
	execute: async () => {
		return {
			success: true,
			action: "refresh_spotify_token",
			parameters: {},
			message: "Request to refresh Spotify access token",
		};
	},
});

export const getContextTool = tool({
	description: "Get current session context and conversation history",
	parameters: z.object({
		includeHistory: z
			.boolean()
			.default(false)
			.describe("Include conversation history"),
	}),
	execute: async ({ includeHistory }) => {
		return {
			success: true,
			action: "get_context",
			parameters: { includeHistory },
			message: `Request to get current context${includeHistory ? " with history" : ""}`,
		};
	},
});

export const clearContextTool = tool({
	description: "Clear current session context and conversation history",
	parameters: z.object({}),
	execute: async () => {
		return {
			success: true,
			action: "clear_context",
			parameters: {},
			message: "Request to clear session context",
		};
	},
});

export const saveContextTool = tool({
	description: "Save current session context to file",
	parameters: z.object({
		filename: z
			.string()
			.optional()
			.describe("Filename to save context to (auto-generated if not provided)"),
	}),
	execute: async ({ filename }) => {
		return {
			success: true,
			action: "save_context",
			parameters: { filename },
			message: `Request to save context${filename ? ` to "${filename}"` : " to auto-generated file"}`,
		};
	},
});

export const loadContextTool = tool({
	description: "Load session context from file",
	parameters: z.object({
		filename: z.string().describe("Filename to load context from"),
	}),
	execute: async ({ filename }) => {
		return {
			success: true,
			action: "load_context",
			parameters: { filename },
			message: `Request to load context from "${filename}"`,
		};
	},
});

export const getHelpTool = tool({
	description: "Get help information about using the AI framework",
	parameters: z.object({
		topic: z.string().optional().describe("Specific topic to get help for"),
	}),
	execute: async ({ topic }) => {
		return {
			success: true,
			action: "get_help",
			parameters: { topic },
			message: topic
				? `Request for help on topic "${topic}"`
				: "Request for general help information",
		};
	},
});

export const executeCommandTool = tool({
	description: "Execute a raw Spotify CLI command",
	parameters: z.object({
		command: z.string().describe("CLI command to execute"),
		args: z.array(z.string()).default([]).describe("Command arguments"),
	}),
	execute: async ({ command, args }) => {
		return {
			success: true,
			action: "execute_command",
			parameters: { command, args },
			message: `Request to execute command "${command}" with args: ${args.join(" ")}`,
		};
	},
});

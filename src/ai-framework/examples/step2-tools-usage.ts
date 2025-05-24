import {
	AISDKConfig,
	ContextManager,
	createConfigFromEnv,
	generateText,
} from "../index.js";
import {
	getAllTools,
	getRegistryStats,
	registerAllTools,
} from "../tools/tool-registry.js";

/**
 * Example demonstrating Step 2: Tool Definitions with AI SDK
 * Shows how to use the registered Spotify CLI tools with AI models
 */
async function demonstrateStep2() {
	console.log("🎯 AI Framework Step 2: Tool Definitions Demo\n");

	// 1. Setup AI configuration
	console.log("1. Setting up AI configuration...");
	const config = createConfigFromEnv();
	const aiConfig = new AISDKConfig(config);
	const contextManager = new ContextManager();

	// 2. Register all Spotify CLI tools
	console.log("2. Registering all Spotify CLI tools...");
	registerAllTools();

	// 3. Show registry statistics
	console.log("3. Registry Statistics:");
	const stats = getRegistryStats();
	console.log(`   Total tools: ${stats.totalActions}`);
	console.log("   Tools by category:");
	for (const [category, count] of Object.entries(stats.actionsByCategory)) {
		console.log(`     ${category}: ${count} tools`);
	}
	console.log(`   Tools with permissions: ${stats.actionsWithPermissions}`);
	console.log(`   Tools with rate limits: ${stats.actionsWithRateLimit}\n`);

	// 4. Get all available tools for AI
	console.log("4. Getting tools for AI model...");
	const tools = getAllTools();
	console.log(`   Available tools for AI: ${Object.keys(tools).length}\n`);

	// 5. Example AI interaction with tools
	console.log("5. Example AI interaction with tools...");

	const examplePrompts = [
		"List all my playlists",
		"Search for rock music tracks",
		"Get my top tracks from last month",
		"Create a new playlist called 'AI Generated Mix'",
		"Show me what tools are available for playlist management",
	];

	for (const prompt of examplePrompts) {
		console.log(`\n📝 User: "${prompt}"`);

		const result = await generateText({
			model: aiConfig.getDefaultModel(),
			prompt: `User request: ${prompt}
      
      You are a Spotify CLI assistant. Based on the user's request, determine which tool(s) to use and execute them.
      Always respond with the tool execution results and explain what you're doing.`,
			tools,
			maxSteps: 3,
		});

		console.log(`🤖 AI Response: ${result.text}`);

		if (result.toolCalls && result.toolCalls.length > 0) {
			console.log(
				`🔧 Tools called: ${result.toolCalls.map((call) => call.toolName).join(", ")}`,
			);

			for (const toolCall of result.toolCalls) {
				console.log(
					`   ${toolCall.toolName}:`,
					JSON.stringify(toolCall.args, null, 2),
				);
			}
		}
	}

	console.log("\n✅ Step 2 demonstration completed!");
	console.log("\n📊 Summary:");
	console.log("- ✅ All Spotify CLI tools converted to AI SDK tools");
	console.log(
		"- ✅ Tools organized by categories (playlist, track, user, search, system)",
	);
	console.log("- ✅ Permission system implemented");
	console.log("- ✅ AI can now interact with Spotify CLI functionality");
	console.log("- ✅ Ready for Step 3: Tool Execution Engine");
}

/**
 * Example showing tool categories and their capabilities
 */
function showToolCategories() {
	console.log("\n🗂️  Tool Categories Overview:\n");

	const categories = {
		playlist: [
			"create_playlist - Create new playlists",
			"get_user_playlists - List user playlists",
			"get_playlist_tracks - Get tracks from playlists",
			"merge_playlists - Merge multiple playlists",
			"add_tracks_to_playlist - Add tracks to playlists",
			"remove_tracks_from_playlist - Remove tracks from playlists",
		],
		track: [
			"like_all_songs_from_playlists - Like all songs from playlists",
			"dislike_all_songs_from_playlists - Dislike all songs from playlists",
			"like_songs - Like specific songs",
			"dislike_songs - Dislike specific songs",
			"get_current_track - Get currently playing track",
			"get_saved_tracks - Get liked songs",
			"get_track_details - Get detailed track info",
			"get_track_audio_features - Get audio features",
		],
		search: [
			"search_tracks - Search for tracks",
			"search_playlists - Search for playlists",
			"search_artists - Search for artists",
			"search_albums - Search for albums",
			"search_all - Search all content types",
			"get_recommendations - Get track recommendations",
		],
		user: [
			"get_user_profile - Get user profile",
			"get_user_top_tracks - Get user top tracks",
			"get_user_top_artists - Get user top artists",
			"get_followed_artists - Get followed artists",
			"follow_artists - Follow artists",
			"unfollow_artists - Unfollow artists",
			"follow_playlist - Follow playlists",
			"unfollow_playlist - Unfollow playlists",
			"get_recently_played - Get recently played tracks",
		],
		system: [
			"get_available_tools - List available tools",
			"get_system_status - Get system status",
			"get_spotify_connection_status - Check Spotify connection",
			"refresh_spotify_token - Refresh access token",
			"get_context - Get session context",
			"clear_context - Clear session context",
			"save_context - Save context to file",
			"load_context - Load context from file",
			"get_help - Get help information",
			"execute_command - Execute raw CLI commands",
		],
	};

	for (const [category, tools] of Object.entries(categories)) {
		console.log(`📁 ${category.toUpperCase()}:`);
		for (const tool of tools) {
			console.log(`   • ${tool}`);
		}
		console.log("");
	}
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
	demonstrateStep2()
		.then(() => {
			showToolCategories();
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Error running Step 2 demonstration:", error);
			process.exit(1);
		});
}

export { demonstrateStep2, showToolCategories };

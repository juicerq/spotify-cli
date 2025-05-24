import { actionRegistry } from "../core/action-registry.js";

// Playlist tools
import {
	addTracksToPlaylistTool,
	createPlaylistTool,
	getPlaylistTracksTool,
	getUserPlaylistsTool,
	mergePlaylistsTool,
	removeTracksFromPlaylistTool,
} from "./playlist-tools.js";

// Track tools
import {
	dislikeAllSongsFromPlaylistsTool,
	dislikeSongsTool,
	getCurrentTrackTool,
	getSavedTracksTool,
	getTrackAudioFeaturesTool,
	getTrackDetailsTool,
	likeAllSongsFromPlaylistsTool,
	likeSongsTool,
} from "./track-tools.js";

// Search tools
import {
	getRecommendationsTool,
	searchAlbumsTool,
	searchAllTool,
	searchArtistsTool,
	searchPlaylistsTool,
	searchTracksTool,
} from "./search-tools.js";

// User tools
import {
	followArtistsTool,
	followPlaylistTool,
	getFollowedArtistsTool,
	getRecentlyPlayedTool,
	getUserProfileTool,
	getUserTopArtistsTool,
	getUserTopTracksTool,
	unfollowArtistsTool,
	unfollowPlaylistTool,
} from "./user-tools.js";

// System tools
import {
	clearContextTool,
	executeCommandTool,
	getAvailableToolsTool,
	getContextTool,
	getHelpTool,
	getSpotifyConnectionStatusTool,
	getSystemStatusTool,
	loadContextTool,
	refreshSpotifyTokenTool,
	saveContextTool,
} from "./system-tools.js";

/**
 * Register all Spotify CLI tools with the action registry
 */
export function registerAllTools(): void {
	// Playlist tools
	actionRegistry.register({
		name: "create_playlist",
		description: "Create a new Spotify playlist",
		category: "playlist",
		tool: createPlaylistTool,
		permissions: ["playlist:modify"],
	});

	actionRegistry.register({
		name: "get_user_playlists",
		description: "Get all user playlists from Spotify",
		category: "playlist",
		tool: getUserPlaylistsTool,
		permissions: ["playlist:read"],
	});

	actionRegistry.register({
		name: "get_playlist_tracks",
		description: "Get all tracks from a specific playlist",
		category: "playlist",
		tool: getPlaylistTracksTool,
		permissions: ["playlist:read"],
	});

	actionRegistry.register({
		name: "merge_playlists",
		description: "Merge multiple playlists into a new playlist or existing one",
		category: "playlist",
		tool: mergePlaylistsTool,
		permissions: ["playlist:modify", "playlist:read"],
	});

	actionRegistry.register({
		name: "add_tracks_to_playlist",
		description: "Add specific tracks to a playlist",
		category: "playlist",
		tool: addTracksToPlaylistTool,
		permissions: ["playlist:modify"],
	});

	actionRegistry.register({
		name: "remove_tracks_from_playlist",
		description: "Remove specific tracks from a playlist",
		category: "playlist",
		tool: removeTracksFromPlaylistTool,
		permissions: ["playlist:modify"],
	});

	// Track tools
	actionRegistry.register({
		name: "like_all_songs_from_playlists",
		description: "Like all songs from selected playlists (add to saved tracks)",
		category: "track",
		tool: likeAllSongsFromPlaylistsTool,
		permissions: ["track:modify", "playlist:read"],
	});

	actionRegistry.register({
		name: "dislike_all_songs_from_playlists",
		description:
			"Dislike all songs from selected playlists (remove from saved tracks)",
		category: "track",
		tool: dislikeAllSongsFromPlaylistsTool,
		permissions: ["track:modify", "playlist:read"],
	});

	actionRegistry.register({
		name: "like_songs",
		description: "Like specific songs (add to saved tracks)",
		category: "track",
		tool: likeSongsTool,
		permissions: ["track:modify"],
	});

	actionRegistry.register({
		name: "dislike_songs",
		description: "Dislike specific songs (remove from saved tracks)",
		category: "track",
		tool: dislikeSongsTool,
		permissions: ["track:modify"],
	});

	actionRegistry.register({
		name: "get_current_track",
		description: "Get the currently playing track from Spotify",
		category: "track",
		tool: getCurrentTrackTool,
		permissions: ["track:read"],
	});

	actionRegistry.register({
		name: "get_saved_tracks",
		description: "Get user saved tracks (liked songs)",
		category: "track",
		tool: getSavedTracksTool,
		permissions: ["track:read"],
	});

	actionRegistry.register({
		name: "get_track_details",
		description: "Get detailed information about specific tracks",
		category: "track",
		tool: getTrackDetailsTool,
		permissions: ["track:read"],
	});

	actionRegistry.register({
		name: "get_track_audio_features",
		description:
			"Get audio features for tracks (tempo, energy, danceability, etc.)",
		category: "track",
		tool: getTrackAudioFeaturesTool,
		permissions: ["track:read"],
	});

	// Search tools
	actionRegistry.register({
		name: "search_tracks",
		description: "Search for tracks on Spotify",
		category: "search",
		tool: searchTracksTool,
	});

	actionRegistry.register({
		name: "search_playlists",
		description: "Search for playlists on Spotify",
		category: "search",
		tool: searchPlaylistsTool,
	});

	actionRegistry.register({
		name: "search_artists",
		description: "Search for artists on Spotify",
		category: "search",
		tool: searchArtistsTool,
	});

	actionRegistry.register({
		name: "search_albums",
		description: "Search for albums on Spotify",
		category: "search",
		tool: searchAlbumsTool,
	});

	actionRegistry.register({
		name: "search_all",
		description: "Search for all types of content on Spotify",
		category: "search",
		tool: searchAllTool,
	});

	actionRegistry.register({
		name: "get_recommendations",
		description:
			"Get track recommendations based on seed tracks, artists, or genres",
		category: "search",
		tool: getRecommendationsTool,
	});

	// User tools
	actionRegistry.register({
		name: "get_user_profile",
		description: "Get current user profile information",
		category: "user",
		tool: getUserProfileTool,
		permissions: ["user:read"],
	});

	actionRegistry.register({
		name: "get_user_top_tracks",
		description: "Get user top tracks",
		category: "user",
		tool: getUserTopTracksTool,
		permissions: ["user:read"],
	});

	actionRegistry.register({
		name: "get_user_top_artists",
		description: "Get user top artists",
		category: "user",
		tool: getUserTopArtistsTool,
		permissions: ["user:read"],
	});

	actionRegistry.register({
		name: "get_followed_artists",
		description: "Get artists followed by the user",
		category: "user",
		tool: getFollowedArtistsTool,
		permissions: ["user:read"],
	});

	actionRegistry.register({
		name: "follow_artists",
		description: "Follow artists",
		category: "user",
		tool: followArtistsTool,
		permissions: ["user:modify"],
	});

	actionRegistry.register({
		name: "unfollow_artists",
		description: "Unfollow artists",
		category: "user",
		tool: unfollowArtistsTool,
		permissions: ["user:modify"],
	});

	actionRegistry.register({
		name: "follow_playlist",
		description: "Follow a playlist",
		category: "user",
		tool: followPlaylistTool,
		permissions: ["user:modify"],
	});

	actionRegistry.register({
		name: "unfollow_playlist",
		description: "Unfollow a playlist",
		category: "user",
		tool: unfollowPlaylistTool,
		permissions: ["user:modify"],
	});

	actionRegistry.register({
		name: "get_recently_played",
		description: "Get recently played tracks",
		category: "user",
		tool: getRecentlyPlayedTool,
		permissions: ["user:read"],
	});

	// System tools
	actionRegistry.register({
		name: "get_available_tools",
		description: "Get list of all available tools and their descriptions",
		category: "system",
		tool: getAvailableToolsTool,
	});

	actionRegistry.register({
		name: "get_system_status",
		description: "Get system status and health information",
		category: "system",
		tool: getSystemStatusTool,
	});

	actionRegistry.register({
		name: "get_spotify_connection_status",
		description: "Check Spotify API connection status and authentication",
		category: "system",
		tool: getSpotifyConnectionStatusTool,
	});

	actionRegistry.register({
		name: "refresh_spotify_token",
		description: "Refresh Spotify access token",
		category: "system",
		tool: refreshSpotifyTokenTool,
	});

	actionRegistry.register({
		name: "get_context",
		description: "Get current session context and conversation history",
		category: "system",
		tool: getContextTool,
	});

	actionRegistry.register({
		name: "clear_context",
		description: "Clear current session context and conversation history",
		category: "system",
		tool: clearContextTool,
	});

	actionRegistry.register({
		name: "save_context",
		description: "Save current session context to file",
		category: "system",
		tool: saveContextTool,
	});

	actionRegistry.register({
		name: "load_context",
		description: "Load session context from file",
		category: "system",
		tool: loadContextTool,
	});

	actionRegistry.register({
		name: "get_help",
		description: "Get help information about using the AI framework",
		category: "system",
		tool: getHelpTool,
	});

	actionRegistry.register({
		name: "execute_command",
		description: "Execute a raw Spotify CLI command",
		category: "system",
		tool: executeCommandTool,
		permissions: ["system:execute"],
	});
}

/**
 * Get tools by category with proper typing
 */
export function getToolsByCategory(
	category: "playlist" | "track" | "user" | "search" | "system",
) {
	return actionRegistry.getToolsByCategory(category);
}

/**
 * Get all registered tools
 */
export function getAllTools() {
	return actionRegistry.getTools();
}

/**
 * Get registry statistics
 */
export function getRegistryStats() {
	return actionRegistry.getStats();
}

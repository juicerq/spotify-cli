import { tool } from "ai";
import { z } from "zod";

export const likeAllSongsFromPlaylistsTool = tool({
	description: "Like all songs from selected playlists (add to saved tracks)",
	parameters: z.object({
		playlistIds: z
			.array(z.string())
			.describe("Array of playlist IDs to process"),
	}),
	execute: async ({ playlistIds }) => {
		return {
			success: true,
			action: "like_all_songs_from_playlists",
			parameters: { playlistIds },
			message: `Request to like all songs from ${playlistIds.length} playlists`,
		};
	},
});

export const dislikeAllSongsFromPlaylistsTool = tool({
	description:
		"Dislike all songs from selected playlists (remove from saved tracks)",
	parameters: z.object({
		playlistIds: z
			.array(z.string())
			.describe("Array of playlist IDs to process"),
	}),
	execute: async ({ playlistIds }) => {
		return {
			success: true,
			action: "dislike_all_songs_from_playlists",
			parameters: { playlistIds },
			message: `Request to dislike all songs from ${playlistIds.length} playlists`,
		};
	},
});

export const likeSongsTool = tool({
	description: "Like specific songs (add to saved tracks)",
	parameters: z.object({
		trackIds: z.array(z.string()).describe("Array of track IDs to like"),
	}),
	execute: async ({ trackIds }) => {
		return {
			success: true,
			action: "like_songs",
			parameters: { trackIds },
			message: `Request to like ${trackIds.length} songs`,
		};
	},
});

export const dislikeSongsTool = tool({
	description: "Dislike specific songs (remove from saved tracks)",
	parameters: z.object({
		trackIds: z.array(z.string()).describe("Array of track IDs to dislike"),
	}),
	execute: async ({ trackIds }) => {
		return {
			success: true,
			action: "dislike_songs",
			parameters: { trackIds },
			message: `Request to dislike ${trackIds.length} songs`,
		};
	},
});

export const getCurrentTrackTool = tool({
	description: "Get the currently playing track from Spotify",
	parameters: z.object({}),
	execute: async () => {
		return {
			success: true,
			action: "get_current_track",
			parameters: {},
			message: "Request to get currently playing track",
		};
	},
});

export const getSavedTracksTool = tool({
	description: "Get user saved tracks (liked songs)",
	parameters: z.object({
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of tracks to retrieve"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
	}),
	execute: async ({ limit, offset }) => {
		return {
			success: true,
			action: "get_saved_tracks",
			parameters: { limit, offset },
			message: `Request to get ${limit} saved tracks starting from offset ${offset}`,
		};
	},
});

export const getTrackDetailsTool = tool({
	description: "Get detailed information about specific tracks",
	parameters: z.object({
		trackIds: z
			.array(z.string())
			.describe("Array of track IDs to get details for"),
	}),
	execute: async ({ trackIds }) => {
		return {
			success: true,
			action: "get_track_details",
			parameters: { trackIds },
			message: `Request to get details for ${trackIds.length} tracks`,
		};
	},
});

export const getTrackAudioFeaturesTool = tool({
	description:
		"Get audio features for tracks (tempo, energy, danceability, etc.)",
	parameters: z.object({
		trackIds: z
			.array(z.string())
			.describe("Array of track IDs to get audio features for"),
	}),
	execute: async ({ trackIds }) => {
		return {
			success: true,
			action: "get_track_audio_features",
			parameters: { trackIds },
			message: `Request to get audio features for ${trackIds.length} tracks`,
		};
	},
});

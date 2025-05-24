import { tool } from "ai";
import { z } from "zod";

export const createPlaylistTool = tool({
	description: "Create a new Spotify playlist",
	parameters: z.object({
		name: z.string().describe("Name of the new playlist"),
		isPublic: z
			.boolean()
			.default(false)
			.describe("Whether the playlist should be public"),
		description: z.string().optional().describe("Description for the playlist"),
	}),
	execute: async ({ name, isPublic, description }) => {
		return {
			success: true,
			action: "create_playlist",
			parameters: { name, isPublic, description },
			message: `Request to create playlist "${name}" (${isPublic ? "public" : "private"})`,
		};
	},
});

export const getUserPlaylistsTool = tool({
	description: "Get all user playlists from Spotify",
	parameters: z.object({
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of playlists to retrieve"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
	}),
	execute: async ({ limit, offset }) => {
		return {
			success: true,
			action: "get_user_playlists",
			parameters: { limit, offset },
			message: `Request to retrieve ${limit} playlists starting from offset ${offset}`,
		};
	},
});

export const getPlaylistTracksTool = tool({
	description: "Get all tracks from a specific playlist",
	parameters: z.object({
		playlistId: z.string().describe("ID of the playlist"),
		includeDetails: z
			.boolean()
			.default(false)
			.describe("Include detailed track information"),
	}),
	execute: async ({ playlistId, includeDetails }) => {
		return {
			success: true,
			action: "get_playlist_tracks",
			parameters: { playlistId, includeDetails },
			message: `Request to get tracks from playlist ${playlistId}${includeDetails ? " with details" : ""}`,
		};
	},
});

export const mergePlaylistsTool = tool({
	description: "Merge multiple playlists into a new playlist or existing one",
	parameters: z.object({
		sourcePlaylistIds: z
			.array(z.string())
			.describe("IDs of playlists to merge"),
		targetPlaylistId: z
			.string()
			.optional()
			.describe(
				"ID of existing playlist to merge into (if not provided, creates new playlist)",
			),
		newPlaylistName: z
			.string()
			.optional()
			.describe(
				"Name for new playlist (required if targetPlaylistId not provided)",
			),
		newPlaylistPublic: z
			.boolean()
			.default(false)
			.describe("Whether new playlist should be public"),
		excludeTrackIds: z
			.array(z.string())
			.default([])
			.describe("Track IDs to exclude from merge"),
	}),
	execute: async ({
		sourcePlaylistIds,
		targetPlaylistId,
		newPlaylistName,
		newPlaylistPublic,
		excludeTrackIds,
	}) => {
		if (!targetPlaylistId && !newPlaylistName) {
			return {
				success: false,
				error: "Either targetPlaylistId or newPlaylistName must be provided",
			};
		}

		return {
			success: true,
			action: "merge_playlists",
			parameters: {
				sourcePlaylistIds,
				targetPlaylistId,
				newPlaylistName,
				newPlaylistPublic,
				excludeTrackIds,
			},
			message: `Request to merge ${sourcePlaylistIds.length} playlists${targetPlaylistId ? ` into existing playlist ${targetPlaylistId}` : ` into new playlist "${newPlaylistName}"`}`,
		};
	},
});

export const addTracksToPlaylistTool = tool({
	description: "Add specific tracks to a playlist",
	parameters: z.object({
		playlistId: z.string().describe("ID of the target playlist"),
		trackIds: z.array(z.string()).describe("Array of track IDs to add"),
	}),
	execute: async ({ playlistId, trackIds }) => {
		return {
			success: true,
			action: "add_tracks_to_playlist",
			parameters: { playlistId, trackIds },
			message: `Request to add ${trackIds.length} tracks to playlist ${playlistId}`,
		};
	},
});

export const removeTracksFromPlaylistTool = tool({
	description: "Remove specific tracks from a playlist",
	parameters: z.object({
		playlistId: z.string().describe("ID of the target playlist"),
		trackIds: z.array(z.string()).describe("Array of track IDs to remove"),
	}),
	execute: async ({ playlistId, trackIds }) => {
		return {
			success: true,
			action: "remove_tracks_from_playlist",
			parameters: { playlistId, trackIds },
			message: `Request to remove ${trackIds.length} tracks from playlist ${playlistId}`,
		};
	},
});

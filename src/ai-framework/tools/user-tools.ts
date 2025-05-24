import { tool } from "ai";
import { z } from "zod";

export const getUserProfileTool = tool({
	description: "Get current user profile information",
	parameters: z.object({}),
	execute: async () => {
		return {
			success: true,
			action: "get_user_profile",
			parameters: {},
			message: "Request to get user profile information",
		};
	},
});

export const getUserTopTracksTool = tool({
	description: "Get user top tracks",
	parameters: z.object({
		timeRange: z
			.enum(["short_term", "medium_term", "long_term"])
			.default("medium_term")
			.describe("Time range for top tracks"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of tracks to return"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
	}),
	execute: async ({ timeRange, limit, offset }) => {
		return {
			success: true,
			action: "get_user_top_tracks",
			parameters: { timeRange, limit, offset },
			message: `Request to get top ${limit} tracks for ${timeRange} period`,
		};
	},
});

export const getUserTopArtistsTool = tool({
	description: "Get user top artists",
	parameters: z.object({
		timeRange: z
			.enum(["short_term", "medium_term", "long_term"])
			.default("medium_term")
			.describe("Time range for top artists"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of artists to return"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
	}),
	execute: async ({ timeRange, limit, offset }) => {
		return {
			success: true,
			action: "get_user_top_artists",
			parameters: { timeRange, limit, offset },
			message: `Request to get top ${limit} artists for ${timeRange} period`,
		};
	},
});

export const getFollowedArtistsTool = tool({
	description: "Get artists followed by the user",
	parameters: z.object({
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of artists to return"),
		after: z
			.string()
			.optional()
			.describe("Artist ID to start after (for pagination)"),
	}),
	execute: async ({ limit, after }) => {
		return {
			success: true,
			action: "get_followed_artists",
			parameters: { limit, after },
			message: `Request to get ${limit} followed artists`,
		};
	},
});

export const followArtistsTool = tool({
	description: "Follow artists",
	parameters: z.object({
		artistIds: z.array(z.string()).describe("Array of artist IDs to follow"),
	}),
	execute: async ({ artistIds }) => {
		return {
			success: true,
			action: "follow_artists",
			parameters: { artistIds },
			message: `Request to follow ${artistIds.length} artists`,
		};
	},
});

export const unfollowArtistsTool = tool({
	description: "Unfollow artists",
	parameters: z.object({
		artistIds: z.array(z.string()).describe("Array of artist IDs to unfollow"),
	}),
	execute: async ({ artistIds }) => {
		return {
			success: true,
			action: "unfollow_artists",
			parameters: { artistIds },
			message: `Request to unfollow ${artistIds.length} artists`,
		};
	},
});

export const followPlaylistTool = tool({
	description: "Follow a playlist",
	parameters: z.object({
		playlistId: z.string().describe("ID of the playlist to follow"),
		isPublic: z.boolean().default(true).describe("Whether to follow publicly"),
	}),
	execute: async ({ playlistId, isPublic }) => {
		return {
			success: true,
			action: "follow_playlist",
			parameters: { playlistId, isPublic },
			message: `Request to follow playlist ${playlistId} ${isPublic ? "publicly" : "privately"}`,
		};
	},
});

export const unfollowPlaylistTool = tool({
	description: "Unfollow a playlist",
	parameters: z.object({
		playlistId: z.string().describe("ID of the playlist to unfollow"),
	}),
	execute: async ({ playlistId }) => {
		return {
			success: true,
			action: "unfollow_playlist",
			parameters: { playlistId },
			message: `Request to unfollow playlist ${playlistId}`,
		};
	},
});

export const getRecentlyPlayedTool = tool({
	description: "Get recently played tracks",
	parameters: z.object({
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of tracks to return"),
		after: z.number().optional().describe("Unix timestamp to get tracks after"),
		before: z
			.number()
			.optional()
			.describe("Unix timestamp to get tracks before"),
	}),
	execute: async ({ limit, after, before }) => {
		return {
			success: true,
			action: "get_recently_played",
			parameters: { limit, after, before },
			message: `Request to get ${limit} recently played tracks`,
		};
	},
});

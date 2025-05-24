import { tool } from "ai";
import { z } from "zod";

export const searchTracksTool = tool({
	description: "Search for tracks on Spotify",
	parameters: z.object({
		query: z.string().describe("Search query for tracks"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of results to return"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
		market: z
			.string()
			.optional()
			.describe('Market/country code (e.g., "US", "BR")'),
	}),
	execute: async ({ query, limit, offset, market }) => {
		return {
			success: true,
			action: "search_tracks",
			parameters: { query, limit, offset, market },
			message: `Request to search for tracks with query "${query}"`,
		};
	},
});

export const searchPlaylistsTool = tool({
	description: "Search for playlists on Spotify",
	parameters: z.object({
		query: z.string().describe("Search query for playlists"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of results to return"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
		market: z
			.string()
			.optional()
			.describe('Market/country code (e.g., "US", "BR")'),
	}),
	execute: async ({ query, limit, offset, market }) => {
		return {
			success: true,
			action: "search_playlists",
			parameters: { query, limit, offset, market },
			message: `Request to search for playlists with query "${query}"`,
		};
	},
});

export const searchArtistsTool = tool({
	description: "Search for artists on Spotify",
	parameters: z.object({
		query: z.string().describe("Search query for artists"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of results to return"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
		market: z
			.string()
			.optional()
			.describe('Market/country code (e.g., "US", "BR")'),
	}),
	execute: async ({ query, limit, offset, market }) => {
		return {
			success: true,
			action: "search_artists",
			parameters: { query, limit, offset, market },
			message: `Request to search for artists with query "${query}"`,
		};
	},
});

export const searchAlbumsTool = tool({
	description: "Search for albums on Spotify",
	parameters: z.object({
		query: z.string().describe("Search query for albums"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of results to return"),
		offset: z.number().min(0).default(0).describe("Offset for pagination"),
		market: z
			.string()
			.optional()
			.describe('Market/country code (e.g., "US", "BR")'),
	}),
	execute: async ({ query, limit, offset, market }) => {
		return {
			success: true,
			action: "search_albums",
			parameters: { query, limit, offset, market },
			message: `Request to search for albums with query "${query}"`,
		};
	},
});

export const searchAllTool = tool({
	description:
		"Search for all types of content on Spotify (tracks, artists, albums, playlists)",
	parameters: z.object({
		query: z.string().describe("Search query"),
		types: z
			.array(z.enum(["track", "artist", "album", "playlist"]))
			.default(["track", "artist", "album", "playlist"])
			.describe("Types of content to search for"),
		limit: z
			.number()
			.min(1)
			.max(50)
			.default(20)
			.describe("Number of results per type"),
		market: z
			.string()
			.optional()
			.describe('Market/country code (e.g., "US", "BR")'),
	}),
	execute: async ({ query, types, limit, market }) => {
		return {
			success: true,
			action: "search_all",
			parameters: { query, types, limit, market },
			message: `Request to search for ${types.join(", ")} with query "${query}"`,
		};
	},
});

export const getRecommendationsTool = tool({
	description:
		"Get track recommendations based on seed tracks, artists, or genres",
	parameters: z.object({
		seedTracks: z
			.array(z.string())
			.optional()
			.describe("Array of track IDs to use as seeds"),
		seedArtists: z
			.array(z.string())
			.optional()
			.describe("Array of artist IDs to use as seeds"),
		seedGenres: z
			.array(z.string())
			.optional()
			.describe("Array of genres to use as seeds"),
		limit: z
			.number()
			.min(1)
			.max(100)
			.default(20)
			.describe("Number of recommendations to return"),
		market: z
			.string()
			.optional()
			.describe('Market/country code (e.g., "US", "BR")'),
		targetAcousticness: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.describe("Target acousticness (0.0 to 1.0)"),
		targetDanceability: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.describe("Target danceability (0.0 to 1.0)"),
		targetEnergy: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.describe("Target energy (0.0 to 1.0)"),
		targetValence: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.describe("Target valence/positivity (0.0 to 1.0)"),
	}),
	execute: async ({
		seedTracks,
		seedArtists,
		seedGenres,
		limit,
		market,
		targetAcousticness,
		targetDanceability,
		targetEnergy,
		targetValence,
	}) => {
		return {
			success: true,
			action: "get_recommendations",
			parameters: {
				seedTracks,
				seedArtists,
				seedGenres,
				limit,
				market,
				targetAcousticness,
				targetDanceability,
				targetEnergy,
				targetValence,
			},
			message: `Request for ${limit} recommendations based on provided seeds`,
		};
	},
});

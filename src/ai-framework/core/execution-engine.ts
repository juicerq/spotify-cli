import type SpotifyWebApi from "spotify-web-api-node";
import { spotifyApi } from "../../index.js";
import { PlaylistOperations } from "../../lib/playlists/playlist-operations.js";
import { TrackOperations } from "../../lib/playlists/track-operations.js";
import { actionRegistry } from "./action-registry.js";
import type {
	AIContext,
	ActionDefinition,
	ActionExecutionContext,
	ActionExecutionResult,
} from "./types.js";

export interface ExecutionConfig {
	enableRateLimit: boolean;
	maxRetries: number;
	retryDelayMs: number;
	enableLogging: boolean;
}

export interface RateLimitState {
	calls: number;
	windowStart: number;
}

export class ToolExecutionEngine {
	private spotifyApi: SpotifyWebApi;
	private playlistOperations?: PlaylistOperations;
	private trackOperations?: TrackOperations;
	private rateLimitMap = new Map<string, RateLimitState>();
	private logger: (message: string) => void;

	constructor(
		private config: ExecutionConfig = {
			enableRateLimit: true,
			maxRetries: 3,
			retryDelayMs: 1000,
			enableLogging: true,
		},
		logger?: (message: string) => void,
	) {
		this.spotifyApi = spotifyApi;
		this.logger = logger || console.log;
	}

	async initialize(context: AIContext): Promise<void> {
		// Initialize Spotify authentication
		if (!context.spotify.isAuthenticated || !context.spotify.accessToken) {
			throw new Error("Spotify authentication required");
		}

		this.spotifyApi.setAccessToken(context.spotify.accessToken);

		if (context.spotify.refreshToken) {
			this.spotifyApi.setRefreshToken(context.spotify.refreshToken);
		}

		// Initialize operations
		this.trackOperations = new TrackOperations(this.spotifyApi, this.logger);

		this.playlistOperations = new PlaylistOperations(
			this.spotifyApi,
			this.trackOperations,
			this.logger,
		);

		this.log("Tool execution engine initialized");
	}

	async executeAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		const action = actionRegistry.get(actionName);

		if (!action) {
			return {
				success: false,
				error: `Action '${actionName}' not found`,
			};
		}

		// Check rate limits
		if (this.config.enableRateLimit && action.rateLimit) {
			const rateLimitCheck = this.checkRateLimit(actionName, action.rateLimit);
			if (!rateLimitCheck.allowed) {
				return {
					success: false,
					error: `Rate limit exceeded for action '${actionName}'. Try again in ${rateLimitCheck.retryAfterMs}ms`,
					metadata: {
						rateLimitExceeded: true,
						retryAfterMs: rateLimitCheck.retryAfterMs,
					},
				};
			}
		}

		// Execute with retries
		let lastError: string | undefined;

		for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
			const result = await this.executeWithRetry(actionName, context, attempt);

			if (result.success) {
				this.updateRateLimit(actionName);
				return result;
			}

			lastError = result.error;

			if (attempt < this.config.maxRetries) {
				await this.sleep(this.config.retryDelayMs * attempt);
				this.log(
					`Retrying action '${actionName}' (attempt ${attempt + 1}/${this.config.maxRetries})`,
				);
			}
		}

		return {
			success: false,
			error: `Action '${actionName}' failed after ${this.config.maxRetries} attempts. Last error: ${lastError}`,
		};
	}

	private async executeWithRetry(
		actionName: string,
		context: ActionExecutionContext,
		attempt: number,
	): Promise<ActionExecutionResult> {
		this.log(`Executing action '${actionName}' (attempt ${attempt})`);

		// Route to specific execution methods based on action category
		const [category] = actionName.split("_");

		switch (category) {
			case "create":
			case "get":
			case "merge":
			case "add":
			case "remove":
				if (actionName.includes("playlist")) {
					return this.executePlaylistAction(actionName, context);
				}
				if (actionName.includes("track") || actionName.includes("song")) {
					return this.executeTrackAction(actionName, context);
				}
				if (actionName.includes("user")) {
					return this.executeUserAction(actionName, context);
				}
				break;
			case "like":
			case "dislike":
				return this.executeTrackAction(actionName, context);
			case "search":
				return this.executeSearchAction(actionName, context);
			case "follow":
			case "unfollow":
				return this.executeUserAction(actionName, context);
			case "system":
				return this.executeSystemAction(actionName, context);
			default:
				return this.executeGenericAction(actionName, context);
		}

		return {
			success: false,
			error: `Unknown action category for '${actionName}'`,
		};
	}

	private async executePlaylistAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		if (!this.playlistOperations) {
			return { success: false, error: "Playlist operations not initialized" };
		}

		const { parameters } = context;

		switch (actionName) {
			case "create_playlist":
				return this.createPlaylist(parameters);
			case "get_user_playlists":
				return this.getUserPlaylists(parameters);
			case "get_playlist_tracks":
				return this.getPlaylistTracks(parameters);
			case "merge_playlists":
				return this.mergePlaylists(parameters);
			case "add_tracks_to_playlist":
				return this.addTracksToPlaylist(parameters);
			case "remove_tracks_from_playlist":
				return this.removeTracksFromPlaylist(parameters);
			default:
				return {
					success: false,
					error: `Unknown playlist action: ${actionName}`,
				};
		}
	}

	private async executeTrackAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		if (!this.trackOperations) {
			return { success: false, error: "Track operations not initialized" };
		}

		const { parameters } = context;

		switch (actionName) {
			case "like_all_songs_from_playlists":
				return this.likeAllSongsFromPlaylists(parameters);
			case "dislike_all_songs_from_playlists":
				return this.dislikeAllSongsFromPlaylists(parameters);
			case "like_songs":
				return this.likeSongs(parameters);
			case "dislike_songs":
				return this.dislikeSongs(parameters);
			case "get_current_track":
				return this.getCurrentTrack();
			case "get_saved_tracks":
				return this.getSavedTracks(parameters);
			case "get_track_details":
				return this.getTrackDetails(parameters);
			case "get_track_audio_features":
				return this.getTrackAudioFeatures(parameters);
			default:
				return { success: false, error: `Unknown track action: ${actionName}` };
		}
	}

	private async executeSearchAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		const { parameters } = context;

		switch (actionName) {
			case "search_tracks":
				return this.searchTracks(parameters);
			case "search_playlists":
				return this.searchPlaylists(parameters);
			case "search_artists":
				return this.searchArtists(parameters);
			case "search_albums":
				return this.searchAlbums(parameters);
			case "search_all":
				return this.searchAll(parameters);
			case "get_recommendations":
				return this.getRecommendations(parameters);
			default:
				return {
					success: false,
					error: `Unknown search action: ${actionName}`,
				};
		}
	}

	private async executeUserAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		const { parameters } = context;

		switch (actionName) {
			case "get_user_profile":
				return this.getUserProfile();
			case "get_user_top_tracks":
				return this.getUserTopTracks(parameters);
			case "get_user_top_artists":
				return this.getUserTopArtists(parameters);
			case "get_followed_artists":
				return this.getFollowedArtists(parameters);
			case "follow_artists":
				return this.followArtists(parameters);
			case "unfollow_artists":
				return this.unfollowArtists(parameters);
			case "follow_playlist":
				return this.followPlaylist(parameters);
			case "unfollow_playlist":
				return this.unfollowPlaylist(parameters);
			case "get_recently_played":
				return this.getRecentlyPlayed(parameters);
			default:
				return { success: false, error: `Unknown user action: ${actionName}` };
		}
	}

	private async executeSystemAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		const { parameters } = context;

		switch (actionName) {
			case "get_available_tools":
				return this.getAvailableTools();
			case "get_system_status":
				return this.getSystemStatus();
			case "get_spotify_connection_status":
				return this.getSpotifyConnectionStatus();
			case "refresh_spotify_token":
				return this.refreshSpotifyToken(context);
			case "get_context":
				return this.getContext(context);
			case "clear_context":
				return this.clearContext(context);
			case "save_context":
				return this.saveContext(context, parameters);
			case "load_context":
				return this.loadContext(parameters);
			case "get_help":
				return this.getHelp(parameters);
			case "execute_command":
				return this.executeCommand(parameters);
			default:
				return {
					success: false,
					error: `Unknown system action: ${actionName}`,
				};
		}
	}

	private async executeGenericAction(
		actionName: string,
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		return {
			success: false,
			error: `Generic execution not implemented for action: ${actionName}`,
		};
	}

	// Playlist Actions Implementation
	private async createPlaylist(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const name = parameters.name as string;
		const isPublic = (parameters.public as boolean) ?? false;
		const description = (parameters.description as string) ?? "";

		const result = await this.spotifyApi.createPlaylist(name, {
			public: isPublic,
			description,
		});

		return {
			success: true,
			data: result.body,
			metadata: { action: "create_playlist", playlistId: result.body.id },
		};
	}

	private async getUserPlaylists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const limit = (parameters.limit as number) ?? 20;
		const offset = (parameters.offset as number) ?? 0;

		const result = await this.spotifyApi.getUserPlaylists({ limit, offset });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_user_playlists",
				count: result.body.items.length,
			},
		};
	}

	private async getPlaylistTracks(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistId = parameters.playlistId as string;
		const limit = (parameters.limit as number) ?? 50;
		const offset = (parameters.offset as number) ?? 0;

		const result = await this.spotifyApi.getPlaylistTracks(playlistId, {
			limit,
			offset,
		});

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_playlist_tracks",
				playlistId,
				count: result.body.items.length,
			},
		};
	}

	private async mergePlaylists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const sourcePlaylistIds = parameters.sourcePlaylistIds as string[];
		const targetPlaylistId = parameters.targetPlaylistId as string;
		const excludeTrackIds = (parameters.excludeTrackIds as string[]) ?? [];

		if (!this.playlistOperations || !this.trackOperations) {
			return { success: false, error: "Operations not initialized" };
		}

		await this.playlistOperations.addTracksToPlaylist({
			playlistIds: sourcePlaylistIds,
			targetPlaylistId,
			tracksToExcludeIds: excludeTrackIds,
			getPlaylistName: () => undefined, // Simplified for AI execution
		});

		return {
			success: true,
			data: { merged: true },
			metadata: {
				action: "merge_playlists",
				sourceCount: sourcePlaylistIds.length,
				targetPlaylistId,
			},
		};
	}

	private async addTracksToPlaylist(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistId = parameters.playlistId as string;
		const trackUris = parameters.trackUris as string[];

		await this.spotifyApi.addTracksToPlaylist(playlistId, trackUris);

		return {
			success: true,
			data: { added: true },
			metadata: {
				action: "add_tracks_to_playlist",
				playlistId,
				trackCount: trackUris.length,
			},
		};
	}

	private async removeTracksFromPlaylist(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistId = parameters.playlistId as string;
		const trackUris = parameters.trackUris as string[];

		const tracks = trackUris.map((uri) => ({ uri }));
		await this.spotifyApi.removeTracksFromPlaylist(playlistId, tracks);

		return {
			success: true,
			data: { removed: true },
			metadata: {
				action: "remove_tracks_from_playlist",
				playlistId,
				trackCount: trackUris.length,
			},
		};
	}

	// Track Actions Implementation
	private async likeAllSongsFromPlaylists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistIds = parameters.playlistIds as string[];

		if (!this.trackOperations) {
			return { success: false, error: "Track operations not initialized" };
		}

		await this.trackOperations.processLikedSongs(
			playlistIds,
			"add",
			() => undefined, // Simplified for AI execution
		);

		return {
			success: true,
			data: { liked: true },
			metadata: {
				action: "like_all_songs_from_playlists",
				playlistCount: playlistIds.length,
			},
		};
	}

	private async dislikeAllSongsFromPlaylists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistIds = parameters.playlistIds as string[];

		if (!this.trackOperations) {
			return { success: false, error: "Track operations not initialized" };
		}

		await this.trackOperations.processLikedSongs(
			playlistIds,
			"remove",
			() => undefined, // Simplified for AI execution
		);

		return {
			success: true,
			data: { disliked: true },
			metadata: {
				action: "dislike_all_songs_from_playlists",
				playlistCount: playlistIds.length,
			},
		};
	}

	private async likeSongs(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const trackIds = parameters.trackIds as string[];

		await this.spotifyApi.addToMySavedTracks(trackIds);

		return {
			success: true,
			data: { liked: true },
			metadata: { action: "like_songs", trackCount: trackIds.length },
		};
	}

	private async dislikeSongs(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const trackIds = parameters.trackIds as string[];

		await this.spotifyApi.removeFromMySavedTracks(trackIds);

		return {
			success: true,
			data: { disliked: true },
			metadata: { action: "dislike_songs", trackCount: trackIds.length },
		};
	}

	private async getCurrentTrack(): Promise<ActionExecutionResult> {
		const result = await this.spotifyApi.getMyCurrentPlayingTrack();

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_current_track",
				isPlaying: result.body.is_playing,
			},
		};
	}

	private async getSavedTracks(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const limit = (parameters.limit as number) ?? 20;
		const offset = (parameters.offset as number) ?? 0;

		const result = await this.spotifyApi.getMySavedTracks({ limit, offset });

		return {
			success: true,
			data: result.body,
			metadata: { action: "get_saved_tracks", count: result.body.items.length },
		};
	}

	private async getTrackDetails(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const trackIds = parameters.trackIds as string[];

		const result = await this.spotifyApi.getTracks(trackIds);

		return {
			success: true,
			data: result.body,
			metadata: { action: "get_track_details", trackCount: trackIds.length },
		};
	}

	private async getTrackAudioFeatures(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const trackIds = parameters.trackIds as string[];

		const result = await this.spotifyApi.getAudioFeaturesForTracks(trackIds);

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_track_audio_features",
				trackCount: trackIds.length,
			},
		};
	}

	// Search Actions Implementation
	private async searchTracks(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const query = parameters.query as string;
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.searchTracks(query, { limit });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "search_tracks",
				query,
				count: result.body.tracks?.items.length ?? 0,
			},
		};
	}

	private async searchPlaylists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const query = parameters.query as string;
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.searchPlaylists(query, { limit });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "search_playlists",
				query,
				count: result.body.playlists?.items.length ?? 0,
			},
		};
	}

	private async searchArtists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const query = parameters.query as string;
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.searchArtists(query, { limit });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "search_artists",
				query,
				count: result.body.artists?.items.length ?? 0,
			},
		};
	}

	private async searchAlbums(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const query = parameters.query as string;
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.searchAlbums(query, { limit });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "search_albums",
				query,
				count: result.body.albums?.items.length ?? 0,
			},
		};
	}

	private async searchAll(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const query = parameters.query as string;
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.search(
			query,
			["track", "artist", "album", "playlist"],
			{ limit },
		);

		return {
			success: true,
			data: result.body,
			metadata: { action: "search_all", query },
		};
	}

	private async getRecommendations(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const seedTracks = (parameters.seedTracks as string[]) ?? [];
		const seedArtists = (parameters.seedArtists as string[]) ?? [];
		const seedGenres = (parameters.seedGenres as string[]) ?? [];
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.getRecommendations({
			seed_tracks: seedTracks,
			seed_artists: seedArtists,
			seed_genres: seedGenres,
			limit,
		});

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_recommendations",
				count: result.body.tracks.length,
			},
		};
	}

	// User Actions Implementation
	private async getUserProfile(): Promise<ActionExecutionResult> {
		const result = await this.spotifyApi.getMe();

		return {
			success: true,
			data: result.body,
			metadata: { action: "get_user_profile", userId: result.body.id },
		};
	}

	private async getUserTopTracks(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const timeRange =
			(parameters.timeRange as "short_term" | "medium_term" | "long_term") ??
			"medium_term";
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.getMyTopTracks({
			time_range: timeRange,
			limit,
		});

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_user_top_tracks",
				timeRange,
				count: result.body.items.length,
			},
		};
	}

	private async getUserTopArtists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const timeRange =
			(parameters.timeRange as "short_term" | "medium_term" | "long_term") ??
			"medium_term";
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.getMyTopArtists({
			time_range: timeRange,
			limit,
		});

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_user_top_artists",
				timeRange,
				count: result.body.items.length,
			},
		};
	}

	private async getFollowedArtists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.getFollowedArtists({ limit });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_followed_artists",
				count: result.body.artists.items.length,
			},
		};
	}

	private async followArtists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const artistIds = parameters.artistIds as string[];

		await this.spotifyApi.followArtists(artistIds);

		return {
			success: true,
			data: { followed: true },
			metadata: { action: "follow_artists", artistCount: artistIds.length },
		};
	}

	private async unfollowArtists(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const artistIds = parameters.artistIds as string[];

		await this.spotifyApi.unfollowArtists(artistIds);

		return {
			success: true,
			data: { unfollowed: true },
			metadata: { action: "unfollow_artists", artistCount: artistIds.length },
		};
	}

	private async followPlaylist(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistId = parameters.playlistId as string;

		await this.spotifyApi.followPlaylist(playlistId);

		return {
			success: true,
			data: { followed: true },
			metadata: { action: "follow_playlist", playlistId },
		};
	}

	private async unfollowPlaylist(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const playlistId = parameters.playlistId as string;

		await this.spotifyApi.unfollowPlaylist(playlistId);

		return {
			success: true,
			data: { unfollowed: true },
			metadata: { action: "unfollow_playlist", playlistId },
		};
	}

	private async getRecentlyPlayed(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const limit = (parameters.limit as number) ?? 20;

		const result = await this.spotifyApi.getMyRecentlyPlayedTracks({ limit });

		return {
			success: true,
			data: result.body,
			metadata: {
				action: "get_recently_played",
				count: result.body.items.length,
			},
		};
	}

	// System Actions Implementation
	private async getAvailableTools(): Promise<ActionExecutionResult> {
		const tools = actionRegistry.getAll();

		return {
			success: true,
			data: {
				tools: tools.map((tool: ActionDefinition) => ({
					name: tool.name,
					description: tool.description,
					category: tool.category,
					permissions: tool.permissions,
				})),
				count: tools.length,
			},
			metadata: { action: "get_available_tools" },
		};
	}

	private async getSystemStatus(): Promise<ActionExecutionResult> {
		return {
			success: true,
			data: {
				status: "operational",
				timestamp: new Date().toISOString(),
				config: this.config,
				rateLimitStates: Object.fromEntries(this.rateLimitMap),
			},
			metadata: { action: "get_system_status" },
		};
	}

	private async getSpotifyConnectionStatus(): Promise<ActionExecutionResult> {
		const hasAccessToken = !!this.spotifyApi.getAccessToken();
		const hasRefreshToken = !!this.spotifyApi.getRefreshToken();

		let userProfile = null;
		let connectionValid = false;

		if (hasAccessToken) {
			const profile = await this.spotifyApi.getMe();
			userProfile = profile.body;
			connectionValid = true;
		}

		return {
			success: true,
			data: {
				connected: connectionValid,
				hasAccessToken,
				hasRefreshToken,
				userProfile,
			},
			metadata: { action: "get_spotify_connection_status" },
		};
	}

	private async refreshSpotifyToken(
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		if (!this.spotifyApi.getRefreshToken()) {
			return {
				success: false,
				error: "No refresh token available",
			};
		}

		const result = await this.spotifyApi.refreshAccessToken();
		const newAccessToken = result.body.access_token;

		this.spotifyApi.setAccessToken(newAccessToken);

		// Update context
		context.context.spotify.accessToken = newAccessToken;

		return {
			success: true,
			data: { refreshed: true, newToken: newAccessToken },
			metadata: { action: "refresh_spotify_token" },
		};
	}

	private async getContext(
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		return {
			success: true,
			data: context.context,
			metadata: { action: "get_context" },
		};
	}

	private async clearContext(
		context: ActionExecutionContext,
	): Promise<ActionExecutionResult> {
		context.context.conversationHistory = [];
		context.context.session.metadata = {};

		return {
			success: true,
			data: { cleared: true },
			metadata: { action: "clear_context" },
		};
	}

	private async saveContext(
		context: ActionExecutionContext,
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const key = (parameters.key as string) ?? "default";

		// In a real implementation, this would save to persistent storage
		// For now, we'll just return success
		return {
			success: true,
			data: { saved: true, key },
			metadata: { action: "save_context" },
		};
	}

	private async loadContext(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const key = (parameters.key as string) ?? "default";

		// In a real implementation, this would load from persistent storage
		// For now, we'll just return empty context
		return {
			success: true,
			data: { loaded: true, key, context: null },
			metadata: { action: "load_context" },
		};
	}

	private async getHelp(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const actionName = parameters.actionName as string;

		if (actionName) {
			const action = actionRegistry.get(actionName);
			if (!action) {
				return {
					success: false,
					error: `Action '${actionName}' not found`,
				};
			}

			return {
				success: true,
				data: {
					action: {
						name: action.name,
						description: action.description,
						category: action.category,
						permissions: action.permissions,
					},
				},
				metadata: { action: "get_help", targetAction: actionName },
			};
		}

		const allActions = actionRegistry.getAll();

		return {
			success: true,
			data: {
				availableActions: allActions.map((action: ActionDefinition) => ({
					name: action.name,
					description: action.description,
					category: action.category,
				})),
				categories: ["playlist", "track", "user", "search", "system"],
			},
			metadata: { action: "get_help" },
		};
	}

	private async executeCommand(
		parameters: Record<string, unknown>,
	): Promise<ActionExecutionResult> {
		const command = parameters.command as string;

		// This would execute CLI commands in a real implementation
		// For security reasons, we'll limit this to safe operations
		return {
			success: false,
			error: "Direct command execution not implemented for security reasons",
			metadata: { action: "execute_command", requestedCommand: command },
		};
	}

	// Rate limiting utilities
	private checkRateLimit(
		actionName: string,
		rateLimit: { maxCalls: number; windowMs: number },
	): { allowed: boolean; retryAfterMs?: number } {
		const now = Date.now();
		const state = this.rateLimitMap.get(actionName);

		if (!state) {
			this.rateLimitMap.set(actionName, { calls: 0, windowStart: now });
			return { allowed: true };
		}

		// Reset window if expired
		if (now - state.windowStart >= rateLimit.windowMs) {
			state.calls = 0;
			state.windowStart = now;
		}

		if (state.calls >= rateLimit.maxCalls) {
			const retryAfterMs = rateLimit.windowMs - (now - state.windowStart);
			return { allowed: false, retryAfterMs };
		}

		return { allowed: true };
	}

	private updateRateLimit(actionName: string): void {
		const state = this.rateLimitMap.get(actionName);
		if (state) {
			state.calls++;
		}
	}

	private async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private log(message: string): void {
		if (this.config.enableLogging) {
			this.logger(`[ToolExecutionEngine] ${message}`);
		}
	}
}

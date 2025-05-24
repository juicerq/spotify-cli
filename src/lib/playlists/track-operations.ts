import type SpotifyWebApi from "spotify-web-api-node";
import type { TrackInfo } from "../../commands/spotify/playlists/index.js";
import { processBatch } from "./batch-processor.js";

export class TrackOperations {
	constructor(
		private spotifyApi: SpotifyWebApi,
		private logger: (message: string) => void,
	) {}

	async getPlaylistTracks(playlistId: string): Promise<TrackInfo[]> {
		const allTracks: TrackInfo[] = [];

		let offset = 0;
		const limit = 100;

		while (true) {
			const tracksResponse = await this.spotifyApi.getPlaylistTracks(
				playlistId,
				{
					offset,
					limit,
				},
			);

			const tracks = tracksResponse.body.items
				.map((item) => item.track)
				.filter((track): track is TrackInfo => !!track);

			allTracks.push(...tracks);

			if (tracksResponse.body.items.length < limit) {
				break;
			}

			offset += limit;
		}

		return allTracks;
	}

	async processLikedSongs(
		playlistIds: string[],
		action: "add" | "remove",
		getPlaylistName: (id: string) => string | undefined,
	): Promise<void> {
		const actionText = action === "add" ? "Adding" : "Removing";
		const actionPastText = action === "add" ? "Added" : "Removed";
		const actionPreposition = action === "add" ? "to" : "from";

		this.logger(
			`${actionText} all songs ${actionPreposition} your liked songs...`,
		);

		for (const playlistId of playlistIds) {
			const playlistName = getPlaylistName(playlistId);

			if (!playlistName) {
				this.logger(`Playlist ${playlistId} not found!`);
				continue;
			}

			this.logger(`Processing playlist: ${playlistName}`);

			const tracks = await this.getPlaylistTracks(playlistId);

			if (tracks.length === 0) {
				this.logger(`No tracks found in ${playlistName}`);
				continue;
			}

			const trackIds = tracks
				.filter((track) => !!track)
				.map((track) => track.id);

			await processBatch(trackIds, 50, async (batch) => {
				if (action === "add") {
					await this.spotifyApi.addToMySavedTracks(batch);
				} else {
					await this.spotifyApi.removeFromMySavedTracks(batch);
				}
			});

			this.logger(
				`${actionPastText} ${trackIds.length} songs ${actionPreposition} your liked songs from ${playlistName}`,
			);
		}

		this.logger(
			`Successfully ${action === "add" ? "added" : "removed"} all songs ${actionPreposition} your liked songs!`,
		);
	}

	async displayPlaylistTracks(
		playlistIds: string[],
		getPlaylistName: (id: string) => string | undefined,
	): Promise<void> {
		this.logger("Fetching tracks from selected playlists...");

		for (const playlistId of playlistIds) {
			const playlistName = getPlaylistName(playlistId);

			if (!playlistName) continue;

			this.logger(`\n=== Tracks in ${playlistName} ===`);

			const tracks = await this.getPlaylistTracks(playlistId);

			if (tracks.length === 0) {
				this.logger("No tracks found in this playlist!");
				continue;
			}

			for (const [index, track] of tracks.entries()) {
				if (!track) continue;

				const artists = track.artists.map((artist) => artist.name).join(", ");
				this.logger(`${index + 1}. ${track.name} - ${artists}`);
			}
		}
	}
}

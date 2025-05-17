import { checkbox, select } from "@inquirer/prompts";
import type SpotifyWebApi from "spotify-web-api-node";
import { sleep } from "../../../lib/utils.js";
import Spotify from "../index.js";

export type Playlist = Awaited<
	ReturnType<SpotifyWebApi["getUserPlaylists"]>
>["body"]["items"][number];

export type TrackObjectFull = Awaited<
	ReturnType<SpotifyWebApi["getPlaylistTracks"]>
>["body"]["items"][number];

export type TrackInfo = TrackObjectFull["track"];

export default class Playlists extends Spotify {
	static description = "Manage and view your Spotify playlists";
	playlists: Playlist[] = [];
	tracksToPlaylistMap: Record<string, TrackObjectFull[]> = {};

	async rerun() {
		this.run();
	}

	async run() {
		const playlists = await this.spotifyApi.getUserPlaylists();

		this.playlists = playlists.body.items;

		if (this.playlists.length === 0) {
			this.log("No playlists found!");
			return;
		}

		// Display playlists as checkbox selection
		const selectedPlaylistIds = await checkbox({
			message:
				"Select playlists (Use arrow keys to navigate, SPACE to select, ENTER to confirm)",
			choices: this.playlists.map((playlist) => ({
				name: playlist.name,
				value: playlist.id,
			})),
			pageSize: 30,
		});

		const canContinue = await this.checkHasPlaylists(selectedPlaylistIds);

		if (!canContinue) return this.rerun();

		await this.handleActionStep(selectedPlaylistIds);
	}

	private async handleActionStep(selectedPlaylistIds: string[]) {
		const action = await select({
			message: "What would you like to do with the selected playlists?",
			choices: [
				{
					name: "Show tracks",
					value: "showTracks",
				},
				{
					name: "Show which artists are more popular in these playlists",
					value: "showArtists",
				},
				{
					name: "Cancel",
					value: "cancel",
				},
			] as const,
		});

		// Process action
		switch (action) {
			case "showTracks":
				await this.showPlaylistTracks(selectedPlaylistIds);
				break;
			case "showArtists":
				await this.showPlaylistMostPopularsArtists(selectedPlaylistIds);
				break;
			case "cancel":
				this.log("Operation canceled");
				break;
		}
	}

	private async checkHasPlaylists(playlistsIds: string[]) {
		if (playlistsIds.length === 0) {
			this.log("No playlists selected!");

			await sleep();

			return false;
		}

		return true;
	}

	private async getPlaylistsTracks(playlistIds: string[]) {
		const tracks: TrackInfo[] = [];

		for (const playlistId of playlistIds) {
			const cachedPlaylist = this.playlists.find((p) => p.id === playlistId);

			if (!cachedPlaylist) {
				console.log("playlist not found", playlistId);
				continue;
			}

			let cachedTracks = this.tracksToPlaylistMap[playlistId];

			if (!cachedTracks) {
				const tracksResponse =
					await this.spotifyApi.getPlaylistTracks(playlistId);

				cachedTracks = tracksResponse.body.items;

				this.tracksToPlaylistMap[playlistId] = cachedTracks;
			}

			const playlistTracks = cachedTracks.map((t) => t.track).filter(Boolean);

			tracks.push(...playlistTracks);
		}

		return tracks;
	}

	async showPlaylistMostPopularsArtists(playlistIds: string[]): Promise<void> {
		this.log("Fetching artists from selected playlists...");

		const tracks = await this.getPlaylistsTracks(playlistIds);

		const artists = tracks.reduce((artistMap, track) => {
			if (!track) return artistMap;

			for (const artist of track.artists) {
				artistMap.set(artist.name, (artistMap.get(artist.name) || 0) + 1);
			}

			return artistMap;
		}, new Map<string, number>());

		const sortedArtists = Array.from(artists.entries()).sort(
			(a, b) => b[1] - a[1],
		);

		if (!sortedArtists.length) {
			this.log("No artists found in selected playlists!");
			return;
		}

		this.log("Most popular artists in selected playlists:");

		for (const [artist, count] of sortedArtists) {
			this.log(`${artist}: ${count} tracks`);
		}
	}

	async showPlaylistTracks(playlistIds: string[]): Promise<void> {
		this.log("Fetching tracks from selected playlists...");

		for (const playlistId of playlistIds) {
			// Find the playlist name
			const playlist = this.playlists.find((p) => p.id === playlistId);

			if (!playlist) continue;

			this.log(`\n=== Tracks in ${playlist.name} ===`);

			const tracksResponse =
				await this.spotifyApi.getPlaylistTracks(playlistId);

			const tracks = tracksResponse.body.items;

			if (tracks.length === 0) {
				this.log("No tracks found in this playlist!");
				continue;
			}

			// Display tracks
			for (let index = 0; index < tracks.length; index++) {
				const item = tracks[index];

				if (item.track) {
					const artists = item.track.artists.map((a) => a.name).join(", ");
					this.log(`${index + 1}. ${item.track.name} - ${artists}`);
				}
			}
		}
	}
}

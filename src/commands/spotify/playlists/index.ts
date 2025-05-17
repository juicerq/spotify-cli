import { checkbox, input, select } from "@inquirer/prompts";
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

	async run() {
		const playlists = await this.spotifyApi.getUserPlaylists();

		this.playlists = playlists.body.items;

		if (this.playlists.length === 0) {
			this.log("No playlists found!");
			return;
		}

		const selectedPlaylistIds = await checkbox({
			message: "Select playlists",
			choices: this.playlists.map((playlist) => ({
				name: playlist.name,
				value: playlist.id,
			})),
			pageSize: 10,
		});

		await this.checkSelectedPlaylists(selectedPlaylistIds);

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
					name: "Merge selected playlists",
					value: "mergePlaylists",
				},
				{
					name: "Cancel",
					value: "cancel",
				},
			] as const,
		});

		switch (action) {
			case "showTracks":
				await this.showPlaylistTracks(selectedPlaylistIds);
				break;
			case "mergePlaylists":
				await this.mergePlaylistsStep(selectedPlaylistIds);
				break;
			case "cancel":
				this.log("Operation canceled");
				break;
		}
	}

	private async mergePlaylistsStep(selectedPlaylistIds: string[]) {
		const mergeAction = await select({
			message: "How would you like to merge the playlists?",
			choices: [
				{
					name: "Create a new playlist",
					value: "createNewPlaylist",
				},
				{
					name: "Add to existing playlist",
					value: "addToExistingPlaylist",
				},
			] as const,
		});

		switch (mergeAction) {
			case "createNewPlaylist":
				await this.createNewPlaylistStep(selectedPlaylistIds);
				break;
			case "addToExistingPlaylist":
				await this.addToExistingPlaylistStep(selectedPlaylistIds);
				break;
		}
	}

	private async addToExistingPlaylistStep(selectedPlaylistIds: string[]) {
		const existingPlaylist = await select({
			message: "Select the playlist to add the tracks to",
			choices: this.playlists.map((p) => ({
				name: p.name,
				value: p.id,
			})),
		});

		await this.addTracksToPlaylists({
			playlistIds: selectedPlaylistIds,
			targetPlaylistId: existingPlaylist,
		});
	}

	private async createNewPlaylistStep(selectedPlaylistIds: string[]) {
		const newPlaylistName = await input({
			message: "Enter the name of the new playlist",
		});

		const viewStatus = await select({
			message: "View status of the new playlist",
			choices: [
				{
					name: "Public",
					value: "public",
				},
				{
					name: "Private",
					value: "private",
				},
			] as const,
		});

		const newPlaylist = await this.spotifyApi
			.createPlaylist(newPlaylistName, {
				public: viewStatus === "public",
			})
			.then((res) => res.body);

		this.playlists.push(newPlaylist);

		await this.addTracksToPlaylists({
			playlistIds: selectedPlaylistIds,
			targetPlaylistId: newPlaylist.id,
		});

		this.log("Successfully merged playlists!");

		await sleep();

		this.backToStart();
	}

	private async addTracksToPlaylists(data: {
		playlistIds: string[];
		targetPlaylistId: string;
	}) {
		const targetPlaylist = this.getPlaylist(data.targetPlaylistId);

		if (!targetPlaylist) {
			this.log(`Playlist ${data.targetPlaylistId} not found!`);
			return this.backToStart();
		}

		for (const playlistId of data.playlistIds) {
			const playlist = this.getPlaylist(playlistId);

			if (!playlist) {
				this.log(`Playlist ${playlistId} not found!`);
				continue;
			}

			const tracksResponse =
				await this.spotifyApi.getPlaylistTracks(playlistId);

			const tracks = tracksResponse.body.items
				.map((item) => item.track)
				.filter((t) => !!t);

			const tracksUris = tracks.map((t) => t.uri);

			await this.spotifyApi.addTracksToPlaylist(
				data.targetPlaylistId,
				tracksUris,
			);

			this.log(
				`Added ${tracksUris.length} from ${playlist.name} to ${targetPlaylist.name}`,
			);
		}
	}

	private async checkSelectedPlaylists(playlistsIds: string[]) {
		if (playlistsIds.length === 0) {
			this.log("No playlists selected!");

			await sleep();

			return this.run();
		}
	}

	private getPlaylist(playlistId: string) {
		return this.playlists.find((p) => p.id === playlistId);
	}

	async showPlaylistTracks(playlistIds: string[]): Promise<void> {
		this.log("Fetching tracks from selected playlists...");

		for (const playlistId of playlistIds) {
			const playlist = this.getPlaylist(playlistId);

			if (!playlist) continue;

			this.log(`\n=== Tracks in ${playlist.name} ===`);

			const tracksResponse =
				await this.spotifyApi.getPlaylistTracks(playlistId);

			const tracks = tracksResponse.body.items;

			if (tracks.length === 0) {
				this.log("No tracks found in this playlist!");
				continue;
			}

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

import { checkbox, select } from "@inquirer/prompts";
import type SpotifyWebApi from "spotify-web-api-node";
import { PlaylistOperations } from "../../../lib/playlists/playlist-operations.js";
import { TrackOperations } from "../../../lib/playlists/track-operations.js";
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
	private trackOperations!: TrackOperations;
	private playlistOperations!: PlaylistOperations;

	async run() {
		// Initialize services
		this.trackOperations = new TrackOperations(
			this.spotifyApi,
			this.log.bind(this),
		);
		this.playlistOperations = new PlaylistOperations(
			this.spotifyApi,
			this.trackOperations,
			this.log.bind(this),
		);

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
					name: "Like all songs",
					value: "likeAllSongs",
				},
				{
					name: "Dislike all songs",
					value: "dislikeAllSongs",
				},
				{
					name: "Cancel",
					value: "cancel",
				},
			] as const,
		});

		switch (action) {
			case "showTracks":
				await this.trackOperations.displayPlaylistTracks(
					selectedPlaylistIds,
					this.getPlaylistName.bind(this),
				);
				break;
			case "mergePlaylists":
				await this.mergePlaylistsStep(selectedPlaylistIds);
				break;
			case "likeAllSongs":
				await this.trackOperations.processLikedSongs(
					selectedPlaylistIds,
					"add",
					this.getPlaylistName.bind(this),
				);
				break;
			case "dislikeAllSongs":
				await this.trackOperations.processLikedSongs(
					selectedPlaylistIds,
					"remove",
					this.getPlaylistName.bind(this),
				);
				break;
			case "cancel":
				this.log("Operation canceled");
				break;
		}
	}

	private async mergePlaylistsStep(selectedPlaylistIds: string[]) {
		const mergeAction = await this.playlistOperations.promptForMergeAction();
		const wantsToExcludeTracks =
			await this.playlistOperations.promptForExcludeTracks();

		let tracksToExcludeIds: string[] = [];

		if (wantsToExcludeTracks) {
			tracksToExcludeIds =
				await this.playlistOperations.excludeTracksStep(selectedPlaylistIds);
		}

		switch (mergeAction) {
			case "createNewPlaylist":
				await this.createNewPlaylistStep(
					selectedPlaylistIds,
					tracksToExcludeIds,
				);
				break;
			case "addToExistingPlaylist":
				await this.addToExistingPlaylistStep(
					selectedPlaylistIds,
					tracksToExcludeIds,
				);
				break;
		}
	}

	private async addToExistingPlaylistStep(
		selectedPlaylistIds: string[],
		tracksToExcludeIds: string[],
	) {
		const existingPlaylistId =
			await this.playlistOperations.promptForExistingPlaylist(this.playlists);

		await this.playlistOperations.addTracksToPlaylist({
			playlistIds: selectedPlaylistIds,
			targetPlaylistId: existingPlaylistId,
			tracksToExcludeIds,
			getPlaylistName: this.getPlaylistName.bind(this),
		});
	}

	private async createNewPlaylistStep(
		selectedPlaylistIds: string[],
		tracksToExcludeIds: string[],
	) {
		const { name, isPublic } =
			await this.playlistOperations.promptForNewPlaylistDetails();

		const newPlaylist = await this.playlistOperations.createNewPlaylist(
			name,
			isPublic,
		);

		this.playlists.push(newPlaylist);

		await this.playlistOperations.addTracksToPlaylist({
			playlistIds: selectedPlaylistIds,
			targetPlaylistId: newPlaylist.id,
			tracksToExcludeIds,
			getPlaylistName: this.getPlaylistName.bind(this),
		});

		this.log("Successfully merged playlists!");
	}

	private async checkSelectedPlaylists(playlistsIds: string[]) {
		if (playlistsIds.length === 0) {
			this.log("No playlists selected!");

			await sleep();

			return this.run();
		}
	}

	private getPlaylistName(playlistId: string): string | undefined {
		return this.playlists.find((p) => p.id === playlistId)?.name;
	}
}

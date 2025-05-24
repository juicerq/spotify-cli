import { checkbox, input, select } from "@inquirer/prompts";
import type SpotifyWebApi from "spotify-web-api-node";
import type { Playlist } from "../../commands/spotify/playlists/index.js";
import type { TrackOperations } from "./track-operations.js";

export class PlaylistOperations {
	constructor(
		private spotifyApi: SpotifyWebApi,
		private trackOperations: TrackOperations,
		private logger: (message: string) => void,
	) {}

	async excludeTracksStep(selectedPlaylistIds: string[]): Promise<string[]> {
		const playlistsTracks = await Promise.all(
			selectedPlaylistIds.flatMap((playlistId) =>
				this.spotifyApi.getPlaylistTracks(playlistId),
			),
		);

		const allTracks = playlistsTracks.flatMap((p) =>
			p.body.items.map((t) => t.track),
		);

		const tracksToExcludeIds = await checkbox({
			message: "Select the tracks to exclude",
			choices: allTracks
				.filter((t) => !!t)
				.map((t) => ({
					name: `${t.name} - ${t.artists.map((a) => a.name).join(", ")}`,
					value: t.id,
				})),
			pageSize: 10,
		});

		return tracksToExcludeIds;
	}

	async createNewPlaylist(name: string, isPublic: boolean): Promise<Playlist> {
		const newPlaylist = await this.spotifyApi
			.createPlaylist(name, {
				public: isPublic,
			})
			.then((res) => res.body);

		return newPlaylist;
	}

	async addTracksToPlaylist(data: {
		playlistIds: string[];
		targetPlaylistId: string;
		tracksToExcludeIds: string[];
		getPlaylistName: (id: string) => string | undefined;
	}): Promise<void> {
		const targetPlaylistName = data.getPlaylistName(data.targetPlaylistId);

		if (!targetPlaylistName) {
			this.logger(`Playlist ${data.targetPlaylistId} not found!`);
			return;
		}

		for (const playlistId of data.playlistIds) {
			const playlistName = data.getPlaylistName(playlistId);

			if (!playlistName) {
				this.logger(`Playlist ${playlistId} not found!`);
				continue;
			}

			let tracks = await this.trackOperations.getPlaylistTracks(playlistId);

			if (data.tracksToExcludeIds.length > 0) {
				tracks = tracks.filter(
					(t) => !!t && !data.tracksToExcludeIds.includes(t.id),
				);
			}

			const tracksUris = tracks.filter((t) => !!t).map((t) => t.uri);

			await this.spotifyApi.addTracksToPlaylist(
				data.targetPlaylistId,
				tracksUris,
			);

			this.logger(
				`Added ${tracksUris.length} from ${playlistName} to ${targetPlaylistName}`,
			);
		}
	}

	async promptForMergeAction(): Promise<
		"createNewPlaylist" | "addToExistingPlaylist"
	> {
		return await select({
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
	}

	async promptForExcludeTracks(): Promise<boolean> {
		const wantsToExcludeTracks = await select({
			message: "Do you want to exclude any tracks?",
			choices: [
				{
					name: "Yes",
					value: "yes",
				},
				{
					name: "No",
					value: "no",
				},
			] as const,
		});

		return wantsToExcludeTracks === "yes";
	}

	async promptForNewPlaylistDetails(): Promise<{
		name: string;
		isPublic: boolean;
	}> {
		const name = await input({
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

		return {
			name,
			isPublic: viewStatus === "public",
		};
	}

	async promptForExistingPlaylist(playlists: Playlist[]): Promise<string> {
		return await select({
			message: "Select the playlist to add the tracks to",
			choices: playlists.map((p) => ({
				name: p.name,
				value: p.id,
			})),
		});
	}
}

import { select } from "@inquirer/prompts";
import { Command } from "@oclif/core";
import type SpotifyWebApi from "spotify-web-api-node";
import { env } from "../../env.js";
import { type MaybePromise, spotifyApi } from "../../index.js";
import { SpotifyAuth } from "../../lib/spotify-auth.js";
import type { Commands } from "../../types/commands.js";

export default class Spotify extends Command {
	static description = "Interactive command to choose a Spotify feature";
	spotifyApi: SpotifyWebApi = spotifyApi;

	async run(): Promise<void> {
		this.log("Welcome to the Spotify CLI!");

		let access_token = env.ACCESS_TOKEN;

		if (!access_token) {
			const authClient = await new SpotifyAuth(this, spotifyApi).run();

			access_token = authClient.access_token;
		}

		this.spotifyApi.setAccessToken(access_token);

		const commandChoice = await select({
			message: "What would you like to do?",
			choices: [
				{
					name: "Playlists",
					value: "playlists",
				},
				{
					name: "Songs",
					value: "songs",
				},
				{
					name: "Exit",
					value: "exit",
				},
			] as const,
		});

		const commandsActions: Record<
			typeof commandChoice,
			() => MaybePromise<void>
		> = {
			playlists: () => this.config.runCommand("spotify:playlists" as Commands),
			songs: () => this.config.runCommand("spotify:song" as Commands),
			exit: () => {
				this.log("Goodbye!");
			},
		};

		await commandsActions[commandChoice]();
	}

	backToStart() {
		this.run();
	}
}

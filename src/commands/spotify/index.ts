import { select } from "@inquirer/prompts";
import { Command } from "@oclif/core";
import type SpotifyWebApi from "spotify-web-api-node";
import { env } from "../../env.js";
import { spotifyApi } from "../../index.js";
import { SpotifyAuth } from "../../lib/spotify-auth.js";
import type { Commands } from "../../types/commands.js";

export default class Spotify extends Command {
	static description = "Interactive command to choose a Spotify feature";
	spotifyApi: SpotifyWebApi = spotifyApi;

	async run(): Promise<void> {
		this.log("Welcome to the Spotify CLI!");

		let access_token = env.ACCESS_TOKEN;
		let refresh_token = env.REFRESH_TOKEN;

		if (!access_token) {
			const authClient = await new SpotifyAuth(this, spotifyApi).run();

			access_token = authClient.access_token;
			refresh_token = authClient.refresh_token;
		}

		this.spotifyApi.setAccessToken(access_token);

		if (refresh_token) {
			this.spotifyApi.setRefreshToken(refresh_token);
		}

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

		try {
			switch (commandChoice) {
				case "playlists":
					await this.config.runCommand("spotify:playlists" as Commands);
					break;
				case "songs":
					await this.config.runCommand("spotify:song" as Commands);
					break;
				case "exit":
					this.log("Goodbye!");
					break;
			}
		} catch (e) {
			if (e instanceof Error) {
				if (e.message.includes("access token expired")) {
					await new SpotifyAuth(this, this.spotifyApi).refreshAccessToken();
					this.backToStart();
				}
			}
		}
	}

	backToStart() {
		this.run();
	}
}

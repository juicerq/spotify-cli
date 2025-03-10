import { select } from "@inquirer/prompts";
import { Command } from "@oclif/core";
import fs from "node:fs";
import path from "node:path";
import type SpotifyWebApi from "spotify-web-api-node";
import { envs } from "../../env.js";
import { type MaybePromise, spotifyApi } from "../../index.js";
import { SpotifyAuth } from "../../lib/spotify-auth.js";
import type { Commands } from "../../types/commands.js";

export default class Spotify extends Command {
	static description = "Interactive command to choose a Spotify feature";
	spotifyApi: SpotifyWebApi = spotifyApi;

	async run() {
		this.log("Welcome to the Spotify CLI!");

		let access_token = envs.ACCESS_TOKEN;

		if (!access_token) {
			const spotifyAuth = await new SpotifyAuth().run(this, spotifyApi);

			access_token = spotifyAuth.access_token;

			await this.saveTokens(spotifyAuth);

			this.spotifyApi.setAccessToken(access_token);
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

	private runCommand(command: Commands) {
		this.config.runCommand(command);
	}

	private async reset() {
		this.runCommand("spotify");
	}

	private async saveTokens({
		access_token,
		refresh_token,
		expires_in,
	}: {
		access_token: string;
		refresh_token: string;
		expires_in: number;
	}) {
		// Save access token to environment variables
		this.log("Saving access token to environment...");

		// Save tokens to .env file for persistence across sessions
		const envFilePath = path.resolve(process.cwd(), ".env");

		try {
			// Read existing .env file content
			let envContent = "";
			try {
				envContent = fs.readFileSync(envFilePath, "utf8");
			} catch (error) {
				// File might not exist yet, which is fine
			}

			// Update or add the token variables
			const updateEnvVar = (name: string, value: string) => {
				const regex = new RegExp(`^${name}=.*`, "m");
				if (regex.test(envContent)) {
					envContent = envContent.replace(regex, `${name}=${value}`);
				} else {
					envContent += `\n${name}=${value}`;
				}
			};

			updateEnvVar("ACCESS_TOKEN", access_token);
			if (refresh_token) updateEnvVar("REFRESH_TOKEN", refresh_token);
			if (expires_in) updateEnvVar("TOKEN_EXPIRES_IN", expires_in.toString());

			// Write back to .env file
			fs.writeFileSync(envFilePath, envContent.trim());
			this.log("Access token saved successfully to .env file!");
		} catch (error) {
			this.error(`Failed to save tokens to .env file: ${error}`);
		}
	}
}

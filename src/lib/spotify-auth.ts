import type { Command } from "@oclif/core";
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import open from "open";
import type SpotifyWebApi from "spotify-web-api-node";

type ValidScopes =
	| "ugc-image-upload"
	| "user-read-playback-state"
	| "user-modify-playback-state"
	| "user-read-currently-playing"
	| "app-remote-control"
	| "streaming"
	| "playlist-read-private"
	| "playlist-read-collaborative"
	| "playlist-modify-private"
	| "playlist-modify-public"
	| "user-follow-modify"
	| "user-follow-read"
	| "user-read-playback-position"
	| "user-top-read"
	| "user-read-recently-played"
	| "user-library-modify"
	| "user-library-read"
	| "user-read-email"
	| "user-read-private"
	| "user-soa-link"
	| "user-soa-unlink"
	| "soa-manage-entitlements"
	| "soa-manage-partner"
	| "soa-create-partner";

const scopes: ValidScopes[] = [
	"user-read-private",
	"user-read-email",
	"playlist-read-private",
	"playlist-modify-private",
	"playlist-modify-public",
];

export class SpotifyAuth {
	command: Command;
	spotifyApi: SpotifyWebApi;

	constructor(command: Command, spotifyApi: SpotifyWebApi) {
		this.command = command;
		this.spotifyApi = spotifyApi;
	}

	async run() {
		this.command.log(
			`Authenticating with Spotify (Scopes: ${scopes.join(", ")})...`,
		);

		const authorizeURL = this.spotifyApi.createAuthorizeURL(scopes, "state");

		await open(authorizeURL);

		const server = createServer();

		const codePromise = new Promise<string>((resolve) => {
			server.on("request", (req, res) => {
				const url = new URL(req.url || "", "http://localhost/");

				const code = url.searchParams.get("code");

				if (code) {
					res.writeHead(200, { "Content-Type": "text/html" });
					res.end(
						"<html><body><h1>Authentication successful!</h1><p>You can close this window now.</p></body></html>",
					);
					resolve(code);
					setTimeout(() => server.close(), 1000);
				}
			});
		});

		server.listen(3000);

		this.command.log("Waiting for authentication...");

		const loadingChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

		let i = 0;

		const loadingInterval = setInterval(() => {
			process.stdout.write(
				`\r${loadingChars[i]} Authenticating with Spotify...`,
			);
			i = (i + 1) % loadingChars.length;
		}, 100);

		const cleanup = () => {
			clearInterval(loadingInterval);
			process.stdout.write("\r\x1b[K");
		};

		codePromise.then(cleanup).catch(cleanup);

		const code = await codePromise;

		const data = await this.spotifyApi.authorizationCodeGrant(code);

		const { access_token, refresh_token, expires_in } = data.body;

		await this.saveTokens({ access_token, refresh_token, expires_in });

		return {
			access_token,
			refresh_token,
			expires_in,
		};
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
		this.command.log("Saving access token to environment...");

		const envFilePath = path.resolve(process.cwd(), ".env");

		try {
			let envContent = "";

			try {
				envContent = fs.readFileSync(envFilePath, "utf8");
			} catch (error) {}

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

			fs.writeFileSync(envFilePath, envContent.trim());
			this.command.log("Access token saved successfully to .env file!");
		} catch (error) {
			this.command.error(`Failed to save tokens to .env file: ${error}`);
		}
	}
}

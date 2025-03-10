import type { Command } from "@oclif/core";
import { createServer } from "node:http";
import open from "open";
import type SpotifyWebApi from "spotify-web-api-node";

export class SpotifyAuth {
	async run(command: Command, spotifyApi: SpotifyWebApi) {
		// Create authorization URL
		const scopes = [
			"user-read-private",
			"user-read-email",
			"playlist-read-private",
		];

		const authorizeURL = spotifyApi.createAuthorizeURL(scopes, "state");

		// Open browser for authentication
		await open(authorizeURL);

		// Create server to handle callback
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

		command.log("Waiting for authentication...");

		// Create a loading animation using inquirer-like spinner
		const loadingChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
		let i = 0;
		const loadingInterval = setInterval(() => {
			process.stdout.write(
				`\r${loadingChars[i]} Authenticating with Spotify...`,
			);
			i = (i + 1) % loadingChars.length;
		}, 100);

		// Ensure we clean up the interval when authentication completes
		const cleanup = () => {
			clearInterval(loadingInterval);
			process.stdout.write("\r\x1b[K"); // Clear the current line
		};

		codePromise.then(cleanup).catch(cleanup);

		const code = await codePromise;

		// Exchange code for tokens
		const data = await spotifyApi.authorizationCodeGrant(code);

		return {
			access_token: data.body.access_token,
			refresh_token: data.body.refresh_token,
			expires_in: data.body.expires_in,
			spotifyApi,
		};
	}
}

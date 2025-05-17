import SpotifyWebApi from "spotify-web-api-node";
import { env } from "./env.js";

export { run } from "@oclif/core";

export const spotifyApi = new SpotifyWebApi({
	clientId: env.SPOTIFY_CLIENT_ID,
	clientSecret: env.SPOTIFY_CLIENT_SECRET,
	redirectUri: env.SPOTIFY_REDIRECT_URI,
});

export type MaybePromise<T> = T | Promise<T>;

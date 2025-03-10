import SpotifyWebApi from "spotify-web-api-node";
import { envs } from "./env.js";

export { run } from "@oclif/core";

export const spotifyApi = new SpotifyWebApi({
	clientId: envs.SPOTIFY_CLIENT_ID,
	clientSecret: envs.SPOTIFY_CLIENT_SECRET,
	redirectUri: envs.SPOTIFY_REDIRECT_URI,
});

export type MaybePromise<T> = T | Promise<T>;

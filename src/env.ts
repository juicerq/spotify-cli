// TODO: fazer com que envs não sejam local, pra outras pessoas poderem usar meu app
export const envs = {
	SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
	SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
	ACCESS_TOKEN: process.env.ACCESS_TOKEN,
	REFRESH_TOKEN: process.env.REFRESH_TOKEN,
} as const;

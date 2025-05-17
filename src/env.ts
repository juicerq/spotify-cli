import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// TODO: fazer com que envs não sejam local, pra outras pessoas poderem usar meu app
const envSchema = z.object({
	SPOTIFY_CLIENT_ID: z.string(),
	SPOTIFY_CLIENT_SECRET: z.string(),
	SPOTIFY_REDIRECT_URI: z.string().url(),
	ACCESS_TOKEN: z.string().optional(),
	REFRESH_TOKEN: z.string().optional(),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
	parsedEnv = envSchema.parse(process.env);
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error(
			"Error validating environment variables:",
			error.flatten().fieldErrors,
		);
	} else {
		console.error(
			"An unexpected error occurred while loading environment variables:",
			error,
		);
	}
	process.exit(1);
}

export const env = parsedEnv;

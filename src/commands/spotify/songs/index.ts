import Spotify from "../index.js";

export default class Songs extends Spotify {
	static description = "Get the current song from Spotify";

	async run(): Promise<void> {
		this.log("Getting current song from Spotify");
	}
}

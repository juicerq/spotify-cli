import { sleep } from "../utils.js";

export async function processBatch<T>(
	items: T[],
	batchSize: number,
	processor: (batch: T[]) => Promise<void>,
	delayMs = 100,
): Promise<void> {
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		await processor(batch);

		if (i + batchSize < items.length) {
			await sleep(delayMs);
		}
	}
}

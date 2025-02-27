
export type FetchedLed = {
	color: {
		red: number,
		green: number,
		blue: number
	},
	timestamp: Date
}

export async function getLeds(): Promise<FetchedLed[]> {
	const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leds`);
	
	if (!response.ok) {
		throw new Error(response.statusText)
	}

	const json = await response.json();

	return json;
}

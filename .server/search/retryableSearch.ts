import axios from "axios";

export async function GET(url: string, options?: any) {
    let attempts = 0;
    let maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            return await axios.get(url, options)
        } catch(e) {
            attempts++;
            console.log(e)
        }
        // backoff retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts * attempts))
    }

    throw new Error(`Could not GET URL ${url} after 5 attempts`);
}

export async function POST(url: string, data: any, options?: any) {
    let attempts = 0;
    let maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            return await axios.post(url, data, options)
        } catch(e) {
            attempts++;
            console.log(e)
        }
        // backoff retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts * attempts))
    }

    // log options for debugging
    console.log(data, options);
    throw new Error(`Could not POST URL ${url} after 5 attempts`);
}
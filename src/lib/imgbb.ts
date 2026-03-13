/**
 * Uploads an image buffer to ImgBB and returns the display URL.
 * Uses Node's built-in fetch (available in Next.js 16 / Node 18+).
 */
export async function uploadToImgBB(
    buffer: Buffer,
    filename: string
): Promise<string> {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
        throw new Error("IMGBB_API_KEY is not set in environment variables");
    }

    const base64Image = buffer.toString("base64");

    const form = new URLSearchParams();
    form.append("key", apiKey);
    form.append("image", base64Image);
    form.append("name", filename);

    const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`ImgBB upload failed (${res.status}): ${errText}`);
    }

    const json = (await res.json()) as {
        success: boolean;
        data: { display_url: string; url: string };
    };

    if (!json.success) {
        throw new Error("ImgBB returned success: false");
    }

    return json.data.display_url;
}

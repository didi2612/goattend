/**
 * Forwards a captured selfie to the external upload.php endpoint. Matches
 * original/upload.php's contract: multipart field named `file`, JSON response
 * `{ success: true, filename, url }` on success or `{ error }` with a non-2xx
 * status on failure.
 */
export async function uploadImage(imageDataUrl: string): Promise<string> {
  const endpoint = process.env.UPLOAD_ENDPOINT_URL;
  if (!endpoint) {
    throw new Error("UPLOAD_ENDPOINT_URL is not set");
  }

  const [, base64] = imageDataUrl.split(";base64,");
  const buffer = Buffer.from(base64, "base64");

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/jpeg" }), `${Date.now()}.jpg`);

  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json()) as { success?: boolean; url?: string; error?: string };

  if (!res.ok || !data.success || !data.url) {
    throw new Error(`upload.php failed: ${data.error ?? res.status}`);
  }

  return data.url;
}

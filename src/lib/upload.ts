/**
 * Forwards a captured selfie to the external upload.php endpoint (URL supplied
 * later via UPLOAD_ENDPOINT_URL) and returns the public URL it stores the
 * image at. Adjust the request/response shape here once the endpoint's real
 * contract is known.
 */
export async function uploadImage(imageDataUrl: string): Promise<string> {
  const endpoint = process.env.UPLOAD_ENDPOINT_URL;
  if (!endpoint) {
    throw new Error("UPLOAD_ENDPOINT_URL is not set");
  }

  const [, base64] = imageDataUrl.split(";base64,");
  const buffer = Buffer.from(base64, "base64");

  const form = new FormData();
  form.append("image", new Blob([buffer], { type: "image/png" }), `${Date.now()}.png`);

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`upload.php responded with ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await res.json()) as { url: string };
    return data.url;
  }
  return (await res.text()).trim();
}

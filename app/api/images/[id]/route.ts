import { readImageAsset } from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9]{64}$/.test(id))
    return new Response("Not found", { status: 404 });
  try {
    const asset = await readImageAsset(id);
    if (!asset.exists()) return new Response("Not found", { status: 404 });
    const data = asset.data();
    return new Response(Buffer.from(data.body, "base64"), {
      headers: {
        "Content-Type": data.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 503 });
  }
}

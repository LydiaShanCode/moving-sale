import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

async function removeBg(file: File): Promise<Buffer | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return null;

  try {
    const form = new FormData();
    form.append("image_file", file);
    form.append("size", "auto");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });

    if (!res.ok) {
      console.warn(`remove.bg failed (${res.status}): ${await res.text()}`);
      return null;
    }

    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn("remove.bg error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of files) {
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const timestamp = Date.now();

      // Try background removal first
      const bgRemoved = await removeBg(file);

      let blob;
      if (bgRemoved) {
        blob = await put(`items/${timestamp}-${baseName}.png`, bgRemoved, {
          access: "public",
          contentType: "image/png",
        });
      } else {
        blob = await put(`items/${timestamp}-${file.name}`, file, {
          access: "public",
        });
      }

      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("POST /api/admin/upload", error);
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN not set. Use base64 upload in dev or configure Vercel Blob.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

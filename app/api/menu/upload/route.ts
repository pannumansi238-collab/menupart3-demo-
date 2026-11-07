import { NextResponse } from "next/server";
import { z } from "zod";
import { hasStaffSession } from "@/lib/auth";
import { databaseUnavailable, errorResponse } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";

const uploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => ["image/webp", "image/jpeg", "image/png"].includes(file.type), "Upload a WebP, JPEG or PNG image.")
    .refine((file) => file.size > 0 && file.size <= 5 * 1024 * 1024, "Image must be no larger than 5 MB."),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export async function POST(request: Request) {
  try {
    if (!await hasStaffSession()) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
    const unavailable = databaseUnavailable();
    if (unavailable) return unavailable;
    const form = await request.formData();
    const parsed = uploadSchema.safeParse({ file: form.get("file"), slug: form.get("slug") });
    if (!parsed.success) return NextResponse.json({ error: "Please upload a valid menu image.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { file, slug } = parsed.data;
    const extension = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const path = `menu/${slug}.${extension}`;
    const { error } = await getSupabase().storage.from("menu-images").upload(path, file, { upsert: true, contentType: file.type });
    if (error) return errorResponse(error, "Could not upload menu image.");
    const { data } = getSupabase().storage.from("menu-images").getPublicUrl(path);
    return NextResponse.json({ image: data.publicUrl });
  } catch (error) {
    return errorResponse(error, "Could not upload menu image.");
  }
}

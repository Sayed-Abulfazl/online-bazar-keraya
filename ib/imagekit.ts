import sharp from "sharp";
import ImageKit from "imagekit";

let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error("ImageKit configuration is missing. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.");
  }
  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
}

async function compressImage(file: File): Promise<Buffer> {
  if (!file.type.startsWith("image/")) throw new Error("فایل انتخاب‌شده باید عکس باشد.");
  const input = Buffer.from(await file.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function uploadImage(file: File, folder: string): Promise<{ url: string; fileId: string; publicId: string }> {
  const bytes = await compressImage(file);
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-") || "image";
  const filename = `${Date.now()}-${baseName}.webp`;
  const result = await getImageKit().upload({
    file: bytes,
    fileName: filename,
    folder: `/keraya-yar/${folder}`,
    useUniqueFileName: true,
  });
  return { url: result.url, fileId: result.fileId, publicId: result.fileId };
}

export async function deleteImageFromImageKit(fileId?: string | null): Promise<void> {
  if (!fileId) return;
  await getImageKit().deleteFile(fileId);
}

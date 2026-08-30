import cloudinary from "cloudinary";

/**
 * Helper Cloudinary — upload gambar dari Buffer (dari mulpart).
 * Membaca konfigurasi dari env CLOUDINARY_URL (cloudinary://key:secret@cloud_name).
 * Singleton agar tidak re-init pada setiap panggilan.
 */

function getCloudinary(): typeof cloudinary.v2 | null {
  if (!process.env.CLOUDINARY_URL) return null;
  return cloudinary.v2;
}

/**
 * Upload buffer gambar ke Cloudinary.
 * Mengembalikan URL pengiriman aman (secure) dari asset.
 * Melempar error bila CLOUDINARY_URL tidak diset atau upload gagal.
 */
export async function uploadImage(
  bytes: Buffer,
  folder: string
): Promise<{ publicId: string; secureUrl: string }> {
  const cld = getCloudinary();
  if (!cld) {
    throw new Error("CLOUDINARY_URL belum diset.");
  }

  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      { folder, unique_filename: true, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload Cloudinary gagal."));
          return;
        }
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      }
    );
    stream.end(bytes);
  });
}

export { cloudinary as cloudinaryV2 };

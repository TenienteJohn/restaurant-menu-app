import { v2 as cloudinary } from 'cloudinary';

// Configurar cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64Image: string): Promise<string> {
  try {
    // Remover el prefijo de data URL si existe
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    // Subir la imagen a Cloudinary
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
      folder: "menu-items",
    });

    // Retornar la URL segura de la imagen
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Failed to upload image");
  }
}

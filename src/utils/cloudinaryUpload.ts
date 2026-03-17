const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryFolder = 'properties' | 'contracts' | 'maintenance';

export const uploadToCloudinary = async (
  file: File,
  folder: CloudinaryFolder = 'properties'
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `hive/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url as string;
};

export const uploadMultiple = async (
  files: File[],
  folder: CloudinaryFolder = 'properties'
): Promise<string[]> => {
  return Promise.all(files.map((f) => uploadToCloudinary(f, folder)));
};

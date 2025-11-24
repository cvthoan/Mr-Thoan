

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // result is "data:image/jpeg;base64,LzlqLzRBQ...". We need to remove the prefix.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as a data URL."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * Fallback function to download a file using a traditional anchor link.
 * This is used when the File System Access API is not available or fails.
 * @param url The URL of the file to download (can be a data URL or a blob URL).
 * @param fileName The desired name for the downloaded file.
 */
export const downloadWithLink = (url: string, fileName: string): void => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // If it's a blob URL, it's good practice to revoke it after use
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};

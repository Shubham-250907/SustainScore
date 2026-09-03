/**
 * Image compression utility — converts a File to a small base64 JPEG
 * stored directly in Firestore (no Firebase Storage needed).
 * 
 * HARDCODED: max width/height 600px, JPEG quality 0.6
 * Keeps images well under Firestore's 1MB document limit (~50–150KB).
 */
export async function compressImageToBase64(file, maxDim = 600, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Calculate scaled dimensions
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width  = maxDim;
        } else {
          width  = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as base64 JPEG
      const base64 = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(url);
      resolve(base64); // full data URL: "data:image/jpeg;base64,..."
    };

    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

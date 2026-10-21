/**
 * Helper untuk memformat URL gambar, terutama tautan Google Drive
 * Mengubah tautan preview Google Drive biasa menjadi direct CDN image (lh3.googleusercontent.com)
 */
export function formatDriveUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Pola 1: https://drive.google.com/file/d/FILE_ID/view...
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }

  // Pola 2: https://drive.google.com/open?id=FILE_ID atau uc?id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes("drive.google.com") && matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }

  return trimmed;
}

export function getAvatarUrl(url, name = "Guru") {
  const formatted = formatDriveUrl(url);
  if (formatted && formatted.trim() !== "") return formatted;
  const cleanName = encodeURIComponent((name || "Guru").replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Guru");
  return `https://ui-avatars.com/api/?name=${cleanName}&background=059669&color=ffffff&bold=true&size=256`;
}

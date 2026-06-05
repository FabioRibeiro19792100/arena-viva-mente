export const toProxiedAssetUrl = (src?: string | null) => {
  if (!src) return "";
  if (src.startsWith("/api/assets/logo?")) return src;
  if (/^https?:\/\/media\.api-sports\.io\//i.test(src)) {
    return `/api/assets/logo?url=${encodeURIComponent(src)}`;
  }
  return src;
};

export const isApiSportsMediaUrl = (src?: string | null) =>
  Boolean(src && /^https?:\/\/media\.api-sports\.io\//i.test(src));

export const toProxiedAssetUrl = (src?: string | null) => {
  if (!src) return "";
  if (src.startsWith("/api/assets/logo?")) return src;
  if (isApiSportsMediaUrl(src)) {
    return `/api/assets/logo?url=${encodeURIComponent(src)}`;
  }
  return src;
};

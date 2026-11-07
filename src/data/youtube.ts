const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function validVideoId(value: string | null | undefined) {
  const videoId = value?.trim();
  return videoId && YOUTUBE_ID_PATTERN.test(videoId) ? videoId : undefined;
}

export function getYouTubeVideoId(value?: string) {
  const source = value?.trim();
  if (!source) return undefined;

  const directId = validVideoId(source);
  if (directId) return directId;

  try {
    const url = new URL(source);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return validVideoId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        return validVideoId(url.searchParams.get("v"));
      }

      const [route, videoId] = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(route)) {
        return validVideoId(videoId);
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function normalizeYouTubeUrl(value?: string) {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;
}

export function getYouTubeEmbedUrl(value?: string) {
  const videoId = getYouTubeVideoId(value);
  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
    : undefined;
}

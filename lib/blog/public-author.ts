export const PUBLIC_BLOG_AUTHOR_NAME = "Echipa TechTots";

const PERSONAL_AUTHOR_EMAIL = "rusu.emanuel.webdeveloper@gmail.com";

type AuthorLike = {
  id?: string;
  name?: string | null;
  email?: string | null;
} | null;

export function toPublicBlogAuthor(author?: AuthorLike) {
  return {
    ...(author?.id ? { id: author.id } : {}),
    name: PUBLIC_BLOG_AUTHOR_NAME,
  };
}

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.split(PERSONAL_AUTHOR_EMAIL).join("");
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map(item => scrubValue(item));
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (key === "email") continue;
      output[key] = scrubValue(child);
    }
    return output;
  }

  return value;
}

/** Public blog payload: team byline, no author email in props or JSON-LD. */
export function toPublicBlogPost<T extends { author?: AuthorLike }>(post: T) {
  const scrubbed = scrubValue(post) as Omit<T, "author">;
  return {
    ...scrubbed,
    author: toPublicBlogAuthor(post.author),
  };
}

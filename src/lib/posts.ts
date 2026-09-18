import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

const POSTS_DIR = join(process.cwd(), "content/posts");

/**
 * `format` is a promise about how the reader gets the explanation, not a difficulty
 * rating -- see docs/editorial.md. `article` is prose that figures support; `visual`
 * is figure-led, and its prose is captions and connective tissue.
 */
export type PostFormat = "article" | "visual";

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  author: string;
  format: PostFormat;
  status: "placeholder" | "draft" | "published";
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
}

export interface Post extends PostMeta {
  content: string;
}

function toMeta(slug: string, data: Record<string, unknown>): PostMeta {
  const format = data.format === "visual" ? "visual" : "article";
  const status = data.status;
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    excerpt: String(data.excerpt ?? ""),
    author: String(data.author ?? "VesselDSP"),
    format,
    status:
      status === "placeholder" || status === "draft" ? status : "published",
  };
}

/** All posts, newest first. */
export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await readdir(POSTS_DIR);
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.mdx?$/, "");
        const raw = await readFile(join(POSTS_DIR, file), "utf8");
        const { data } = matter(raw);
        return toMeta(slug, data);
      }),
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single post by slug, or null if it does not exist. */
export async function getPost(slug: string): Promise<Post | null> {
  for (const extension of [".mdx", ".md"]) {
    try {
      const raw = await readFile(join(POSTS_DIR, `${slug}${extension}`), "utf8");
      const { data, content } = matter(raw);
      return { ...toMeta(slug, data), content };
    } catch {
      // try the next extension
    }
  }
  return null;
}

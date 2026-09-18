import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx";
import { getAllPosts, getPost } from "@/lib/posts";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: `${post.title} — VesselDSP`, description: post.excerpt };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/" className="link link-hover text-xs">
        ← Blog
      </Link>

      <article className="prose-reading mt-10">
        <header className="mx-auto max-w-[38rem]">
          <h1 className="text-4xl sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg opacity-80">{post.excerpt}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[11px] uppercase opacity-60">
            <span>{post.date}</span>
            <span aria-hidden="true">·</span>
            <span>{post.author}</span>
            <span aria-hidden="true">·</span>
            <span>{post.format === "visual" ? "Visual post" : "Article"}</span>
            {post.status !== "published" ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-primary">{post.status}</span>
              </>
            ) : null}
          </p>
        </header>

        <div className="mt-12">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>
    </main>
  );
}

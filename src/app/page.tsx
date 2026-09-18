import { Logo } from "@vessel-dsp/ui-theme";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <header className="flex items-center gap-3 border-base-content border-b pb-6">
        <Logo className="h-7 w-7 text-primary" />
        <h1 className="text-xl sm:text-2xl">VesselDSP</h1>
        <span className="ml-auto text-[11px] opacity-60">Blog</span>
      </header>

      <p className="prose-reading mt-8 max-w-[38rem] text-base opacity-80">
        How a guitar circuit becomes code you can play through. Measurements, not
        assertions — every number here came out of a simulation you can run.
      </p>

      <ul className="mt-12 flex flex-col">
        {posts.map((post) => (
          <li key={post.slug} className="border-base-content/20 border-t">
            <Link href={`/${post.slug}`} className="group block py-6">
              <article className="prose-reading flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-x-3 font-[family-name:var(--font-mono)] text-[11px] uppercase opacity-60">
                  <span>{post.date}</span>
                  <span>
                    {post.format === "visual" ? "Visual post" : "Article"}
                  </span>
                  {post.status !== "published" ? (
                    <span className="text-primary">{post.status}</span>
                  ) : null}
                </div>
                <h2 className="text-2xl group-hover:text-primary sm:text-3xl">
                  {post.title}
                </h2>
                <p className="max-w-[38rem] text-[15px] opacity-80">
                  {post.excerpt}
                </p>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

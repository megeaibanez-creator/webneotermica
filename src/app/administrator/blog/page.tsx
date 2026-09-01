import { getAllPosts, getPublishedPosts } from "@/lib/blog";
import BlogTabla from "./BlogTabla";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog · Administración" };

export default async function AdminBlogPage() {
  const posts = await getAllPosts();
  const publicados = (await getPublishedPosts()).length;
  return <BlogTabla posts={posts} publicados={publicados} />;
}

import {
  PUBLIC_BLOG_AUTHOR_NAME,
  toPublicBlogPost,
} from "@/lib/blog/public-author";

describe("toPublicBlogPost", () => {
  it("replaces the author with the team byline and drops email", () => {
    const post = toPublicBlogPost({
      title: "STEM acasa",
      author: {
        id: "user-1",
        name: "Emanuel",
        email: "rusu.emanuel.webdeveloper@gmail.com",
      },
      metadata: {
        note: "Contact rusu.emanuel.webdeveloper@gmail.com",
      },
    });

    expect(post.author).toEqual({
      id: "user-1",
      name: PUBLIC_BLOG_AUTHOR_NAME,
    });
    expect(JSON.stringify(post)).not.toContain(
      "rusu.emanuel.webdeveloper@gmail.com"
    );
    expect(JSON.stringify(post)).not.toContain("email");
  });

  it("keeps a team author when the source author is missing", () => {
    const post = toPublicBlogPost({ title: "Fara autor", author: null });
    expect(post.author.name).toBe(PUBLIC_BLOG_AUTHOR_NAME);
  });
});

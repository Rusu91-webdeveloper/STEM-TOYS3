"use client";

import { format } from "date-fns";
import {
  PlusCircle,
  Search,
  Calendar,
  Edit2,
  Trash2,
  EyeIcon,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  stemCategory: string;
  isPublished: boolean;
  publishedAt: string | null;
  author: {
    name: string;
  };
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Function to fetch blogs
  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      // Include both published and unpublished blogs for admins
      const response = await fetch("/api/blog?published=all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }

      const data = await response.json();
      console.log("Fetched blogs data:", data);
      setBlogs(data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blog posts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter(
    blog =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.stemCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStemCategoryColor = (category: string) => {
    switch (category) {
      case "SCIENCE":
        return "bg-blue-100 text-blue-800";
      case "TECHNOLOGY":
        return "bg-green-100 text-green-800";
      case "ENGINEERING":
        return "bg-yellow-100 text-yellow-800";
      case "MATHEMATICS":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteBlog = async (blogId: string, blogTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${blogTitle}"?`)) {
      try {
        const blogToDelete = blogs.find(blog => blog.id === blogId);
        if (!blogToDelete) return;

        const response = await fetch(`/api/blog/${blogToDelete.slug}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete blog post");
        }

        // Refresh the blog list instead of manually updating state
        fetchBlogs();
      } catch (err) {
        console.error("Error deleting blog:", err);
        alert("Failed to delete blog post. Please try again.");
      }
    }
  };

  // Add a function to seed blog data
  const handleSeedBlogs = async () => {
    if (confirm("Do you want to create sample blog posts for testing?")) {
      try {
        setIsSeeding(true);

        // Create sample blogs - update to the correct endpoint
        const response = await fetch("/api/seed-blogs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to seed blog posts");
        }

        const result = await response.json();
        console.log("Seed result:", result);

        // Fetch blogs again instead of reloading the page
        await fetchBlogs();
        setIsSeeding(false);
      } catch (err) {
        console.error("Error seeding blogs:", err);
        alert("Failed to seed blog posts. Please try again.");
        setIsSeeding(false);
      }
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <div className="flex gap-4">
          {blogs.length === 0 && (
            <Button
              variant="outline"
              onClick={handleSeedBlogs}
              disabled={isSeeding}
            >
              {isSeeding ? "Creating..." : "Create Sample Blogs"}
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/blog/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Blog Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blog posts..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading blog posts...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Title</TableHead>
                <TableHead>STEM Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map(blog => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium">{blog.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStemCategoryColor(blog.stemCategory)}`}
                      >
                        {blog.stemCategory}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={blog.isPublished ? "default" : "secondary"}
                        className={
                          blog.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {blog.publishedAt ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{blog.author?.name || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/blog/edit/${blog.slug}`)
                            }
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/blog/post/${blog.slug}`)
                            }
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleDeleteBlog(blog.id, blog.title)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No blog posts found.
                    {!isLoading && (
                      <span className="block mt-2 text-sm text-muted-foreground">
                        Click the "Create Sample Blogs" button above to generate
                        some sample content.
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AIBlogGenerator from "@/components/admin/AIBlogGenerator";

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

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BlogsResponse {
  blogs: Blog[];
  pagination: PaginationInfo;
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Fixed page size for admin interface

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<{
    id: string;
    title: string;
    slug: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch blogs
  const fetchBlogs = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);

      // Include both published and unpublished blogs for admins
      const params = new URLSearchParams({
        published: "all",
        page: page.toString(),
        limit: pageSize.toString(),
      });

      const response = await fetch(`/api/blog?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }

      const data: BlogsResponse = await response.json();
      console.log("Fetched blogs data:", data);

      setBlogs(data.blogs);
      setPagination(data.pagination);
      setCurrentPage(page);
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

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      fetchBlogs(page);
    }
  };

  const handlePreviousPage = () => {
    if (pagination?.hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  };

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

  const openDeleteDialog = (
    blogId: string,
    blogTitle: string,
    blogSlug: string
  ) => {
    setBlogToDelete({ id: blogId, title: blogTitle, slug: blogSlug });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;

    setIsDeleting(true);

    // Optimistic update: immediately remove from UI
    const originalBlogs = [...blogs];
    setBlogs(blogs.filter(blog => blog.id !== blogToDelete.id));

    // Update pagination info optimistically
    if (pagination) {
      setPagination({
        ...pagination,
        totalCount: pagination.totalCount - 1,
        totalPages: Math.ceil((pagination.totalCount - 1) / pagination.limit),
      });
    }

    try {
      const response = await fetch(`/api/blog/${blogToDelete.slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog post");
      }

      // Success - refresh the blog list to ensure consistency
      fetchBlogs(currentPage);
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    } catch (err) {
      console.error("Error deleting blog:", err);

      // Revert optimistic update on error
      setBlogs(originalBlogs);
      if (pagination) {
        setPagination({
          ...pagination,
          totalCount: pagination.totalCount + 1,
          totalPages: Math.ceil((pagination.totalCount + 1) / pagination.limit),
        });
      }

      // Keep dialog open to show error
    } finally {
      setIsDeleting(false);
    }
  };

  // Add a function to seed blog data
  const handleSeedBlogs = async () => {
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
    } catch (err) {
      console.error("Error seeding blogs:", err);
      alert("Failed to seed blog posts. Please try again.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Add a function to create sample professional blog
  const handleCreateSampleBlog = async () => {
    try {
      setIsCreatingSample(true);

      const response = await fetch("/api/seed-sample-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create sample blog post");
      }

      const result = await response.json();
      console.log("Sample blog result:", result);

      // Fetch blogs again
      await fetchBlogs();
      alert(
        "Sample professional blog post created successfully! You can now view it at /blog/quantum-biology-plants-photosynthesis-2025"
      );
    } catch (err) {
      console.error("Error creating sample blog:", err);
      alert("Failed to create sample blog post. Please try again.");
    } finally {
      setIsCreatingSample(false);
    }
  };

  // Add a function to create test blog post
  const handleCreateTestBlog = async () => {
    try {
      setIsCreatingTest(true);

      const response = await fetch("/api/test-blog-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create test blog post");
      }

      const result = await response.json();
      console.log("Test blog result:", result);

      // Fetch blogs again
      await fetchBlogs();
      alert(
        "Test blog post created successfully! You can now view it at /blog/test-blog-simple-markdown"
      );
    } catch (err) {
      console.error("Error creating test blog:", err);
      alert("Failed to create test blog post. Please try again.");
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <div className="flex gap-4 flex-wrap">
          {blogs.length === 0 && (
            <Button
              variant="outline"
              onClick={handleSeedBlogs}
              disabled={isSeeding}
            >
              {isSeeding ? "Creating..." : "Create Sample Blogs"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCreateSampleBlog}
            disabled={isCreatingSample}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            {isCreatingSample ? "Creating..." : "Create Professional Sample"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateTestBlog}
            disabled={isCreatingTest}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
          >
            {isCreatingTest ? "Creating..." : "Create Test Blog"}
          </Button>
          <AIBlogGenerator
            onBlogGenerated={blog => {
              console.log("Blog generated:", blog.title);
              // Optionally refresh the blog list
              fetchBlogs();
            }}
          />
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
        <>
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
                      <TableCell className="font-medium">
                        {blog.title}
                      </TableCell>
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
                              onClick={() => router.push(`/blog/${blog.slug}`)}
                            >
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                openDeleteDialog(blog.id, blog.title, blog.slug)
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
                          Click the "Create Sample Blogs" button above to
                          generate some sample content.
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {blogs.length} of {pagination.totalCount} blog posts
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                baseUrl="/admin/blog"
                searchParams={{ published: "all" }}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{blogToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Blog Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

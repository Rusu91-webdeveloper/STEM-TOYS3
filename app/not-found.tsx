import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-lg mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
        Return Home
      </Link>
    </div>
  );
}

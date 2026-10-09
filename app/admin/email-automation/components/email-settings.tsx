import Link from "next/link";
export function EmailSettings() {
  return (
    <Link className="text-blue-700 underline" href="/admin/settings">
      Setări email
    </Link>
  );
}

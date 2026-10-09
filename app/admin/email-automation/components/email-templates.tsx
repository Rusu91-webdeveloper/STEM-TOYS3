import Link from "next/link";
export function EmailTemplates() {
  return (
    <Link className="text-blue-700 underline" href="/admin/email-templates">
      Gestionare șabloane salvate
    </Link>
  );
}

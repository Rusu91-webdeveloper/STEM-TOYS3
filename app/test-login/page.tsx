"use client";

import { useEffect, useState } from "react";

import { useOptimizedSession } from "@/lib/auth/SessionContext";

export default function TestLoginPage() {
  const { data: session, status } = useOptimizedSession();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/email-templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchTemplates();
    }
  }, [session]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login Test Page</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Session Status:</h2>
        <p>Status: {status}</p>
        <p>User: {session?.user?.email || "Not logged in"}</p>
        <p>Role: {session?.user?.role || "No role"}</p>
        <p>Is Admin: {session?.user?.role === "ADMIN" ? "Yes" : "No"}</p>
      </div>

      {session?.user?.role === "ADMIN" ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Email Templates:</h2>
          {loading ? (
            <p>Loading templates...</p>
          ) : (
            <div>
              <p>Found {templates.length} templates</p>
              <ul className="list-disc list-inside">
                {templates.slice(0, 5).map(template => (
                  <li key={template.id}>
                    {template.name} ({template.slug}) - {template.category}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-red-600">
            You need to be logged in as an admin to see templates.
          </p>
          <p>
            Please go to{" "}
            <a href="/auth/login" className="text-blue-600 underline">
              /auth/login
            </a>{" "}
            to log in.
          </p>
        </div>
      )}
    </div>
  );
}

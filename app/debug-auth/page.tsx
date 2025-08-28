"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [supplierData, setSupplierData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSupplierAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/supplier/auth/me");
      const data = await response.json();
      setSupplierData(data);
    } catch (error) {
      console.error("Error checking supplier auth:", error);
      setSupplierData({ error: "Failed to fetch" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      checkSupplierAuth();
    }
  }, [status]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Authenticated:</strong>{" "}
            {status === "authenticated" ? "Yes" : "No"}
          </p>
        </div>

        {session && (
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Session Data</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Supplier Auth Check</h2>
          <button
            onClick={checkSupplierAuth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Supplier Auth"}
          </button>

          {supplierData && (
            <div className="mt-4">
              <h3 className="font-semibold">Response:</h3>
              <pre className="text-sm overflow-auto mt-2">
                {JSON.stringify(supplierData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Links</h2>
          <div className="space-y-2">
            <a
              href="/supplier/dashboard"
              className="block text-blue-600 hover:underline"
            >
              /supplier/dashboard
            </a>
            <a
              href="/supplier/analytics"
              className="block text-blue-600 hover:underline"
            >
              /supplier/analytics
            </a>
            <a
              href="/supplier/invoices"
              className="block text-blue-600 hover:underline"
            >
              /supplier/invoices
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

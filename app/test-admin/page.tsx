"use client";

import { useState } from "react";

export default function TestAdminPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAdminLogin = async () => {
    setLoading(true);
    console.log("🧪 [TEST-ADMIN] Testing admin login...");
    
    try {
      console.log("🧪 [TEST-ADMIN] Sending admin login request...");
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "rusu.jobs@gmail.com",
          password: "admin123",
        }),
      });

      console.log("🧪 [TEST-ADMIN] Admin login response:", { 
        status: response.status, 
        ok: response.ok 
      });

      const data = await response.json();
      console.log("🧪 [TEST-ADMIN] Admin login data:", data);
      
      setResult({ response: response.status, data });
    } catch (error) {
      console.error("❌ [TEST-ADMIN] Admin login error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testEmailTemplates = async () => {
    setLoading(true);
    console.log("🧪 [TEST-ADMIN] Testing email templates API...");
    
    try {
      console.log("🧪 [TEST-ADMIN] Sending email templates request...");
      const response = await fetch("/api/admin/email-templates");
      
      console.log("🧪 [TEST-ADMIN] Email templates response:", { 
        status: response.status, 
        ok: response.ok 
      });
      
      const data = await response.json();
      console.log("🧪 [TEST-ADMIN] Email templates data:", data);
      
      setResult({ response: response.status, data });
    } catch (error) {
      console.error("❌ [TEST-ADMIN] Email templates error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testDebugSession = async () => {
    setLoading(true);
    console.log("🧪 [TEST-ADMIN] Testing debug session API...");
    
    try {
      console.log("🧪 [TEST-ADMIN] Sending debug session request...");
      const response = await fetch("/api/debug-session");
      
      console.log("🧪 [TEST-ADMIN] Debug session response:", { 
        status: response.status, 
        ok: response.ok 
      });
      
      const data = await response.json();
      console.log("🧪 [TEST-ADMIN] Debug session data:", data);
      
      setResult({ response: response.status, data });
    } catch (error) {
      console.error("❌ [TEST-ADMIN] Debug session error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Test Page</h1>

      <div className="space-y-4">
        <button
          onClick={testDebugSession}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Debug Session"}
        </button>

        <button
          onClick={testAdminLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Admin Login"}
        </button>

        <button
          onClick={testEmailTemplates}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Email Templates API"}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-bold mb-2">Available Admin Accounts:</h3>
        <ul className="list-disc list-inside">
          <li>rusu.jobs@gmail.com / admin123 ✅ (Working)</li>
          <li>
            rusu.emanuel.webdeveloper@gmail.com / admin123 ❌ (Not working)
          </li>
        </ul>
      </div>
    </div>
  );
}

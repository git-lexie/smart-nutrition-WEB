"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define the shape of our data so TypeScript is happy!
interface DashboardData {
  totalUsers: number;
  totalMealsLogged: number;
  recentLogs: Array<{
    _id: string;
    action: string;
    createdAt: string;
    userId: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        // 1. Kick them out if they aren't logged in
        if (!token) {
          router.push("/login");
          return;
        }

        // 2. Fetch the stats from your Next.js API
        const response = await fetch("/api/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("You do not have admin access.");
          } else {
            setError("Failed to load dashboard data.");
          }
          setLoading(false);
          return;
        }

        const dashboardStats = await response.json();
        setData(dashboardStats);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("An error occurred while fetching data.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // --- LOADING & ERROR STATES ---
  if (loading)
    return (
      <div className="p-10 text-center text-xl font-semibold">
        Loading Admin Dashboard...
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-center text-red-500 font-semibold">{error}</div>
    );

  // --- MAIN DASHBOARD UI ---
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">
            Welcome back. Here is what is happening in Smart Nutrition.
          </p>
        </header>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
              Total Users
            </h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {data?.totalUsers || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
              Meals Logged
            </h3>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {data?.totalMealsLogged || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
              System Status
            </h3>
            <p className="text-2xl font-bold text-gray-800 mt-2 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
              Online
            </p>
          </div>
        </div>

        {/* Recent Activity Table (Powered by your AuditLogger!) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent User Activity
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">User ID</th>
                  <th className="px-6 py-3 font-medium">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recentLogs && data.recentLogs.length > 0 ? (
                  data.recentLogs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {/* Make successful signups green and deletes red for flair */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            log.action.includes("SIGNUP")
                              ? "bg-green-100 text-green-700"
                              : log.action.includes("DELETE")
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono truncate max-w-[150px]">
                        {log.userId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

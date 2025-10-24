"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserActivityModal from "@/components/UserActivityModal";

type DashboardStats = {
  total_users: number;
  total_movies: number;
  new_users_30_days: number;
  active_users: number;
  timestamp: string;
};

type User = {
  id: number;
  display_name: string;
  email: string;
  is_active: boolean;
  avatar?: string;
  created_at?: string;
  hashed_password?: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [passwordTest, setPasswordTest] = useState<{userId: number, password: string} | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'movies' | 'profile'>('users');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserActivity, setShowUserActivity] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError((data && (data.detail || data.message)) || "Failed to load users");
      }
      const s = await fetch("http://127.0.0.1:8000/api/admin/dashboard");
      const sdata = await s.json();
      if (s.ok) setStats(sdata);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${id}/toggle-active`, { method: "PUT" });
      if (res.ok) load();
    } catch {}
  };

  const del = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) load();
    } catch {}
  };

  const testPassword = async (userId: number, password: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });
      const data = await res.json();
      if (res.ok) setTestResult(data.message);
      else setTestResult((data && (data.detail || data.message)) || "Error testing password");
    } catch {
      setTestResult("Network error");
    }
  };

  const lastUpdated = stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : "Invalid Date";

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movie Discovery Admin</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">Last updated: {lastUpdated}</span>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full">
        <div className="flex border rounded overflow-hidden text-sm">
          <button
            className={`px-4 py-2 flex-1 ${activeTab === 'users' ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </button>
          <button
            className={`px-4 py-2 flex-1 ${activeTab === 'movies' ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            Movies (0)
          </button>
          <button
            className={`px-4 py-2 flex-1 ${activeTab === 'profile' ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-semibold">{stats?.total_users ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Total Movies</div>
            <div className="text-2xl font-semibold">{stats?.total_movies ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">New Users (30d)</div>
            <div className="text-2xl font-semibold">{stats?.new_users_30_days ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Active Users</div>
            <div className="text-2xl font-semibold">{stats?.active_users ?? 0}</div>
          </CardContent>
        </Card>
      </div>
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-2 text-sm">{u.id}</td>
                        <td className="px-4 py-2 text-sm">{u.display_name}</td>
                        <td className="px-4 py-2 text-sm">{u.email}</td>
                        <td className="px-4 py-2 text-sm">
                          {u.hashed_password ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {u.hashed_password.slice(0, 20)}...
                            </code>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">{u.is_active ? "Active" : "Inactive"}</td>
                        <td className="px-4 py-2 text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}</td>
                        <td className="px-4 py-2 text-sm space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setShowUserActivity(true);
                            }}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            Activity
                          </Button>
                          <Button variant="outline" onClick={() => toggle(u.id)}>Toggle</Button>
                          <Button variant="outline" onClick={() => setPasswordTest({userId: u.id, password: ""})}>Test Password</Button>
                          <Button variant="destructive" onClick={() => del(u.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'movies' && (
        <Card>
          <CardHeader>
            <CardTitle>Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">No movies available yet.</div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length ? (
              <div className="space-y-4 text-sm">
                <div><span className="text-gray-500">Name:</span> {users[0].display_name}</div>
                <div><span className="text-gray-500">Email:</span> {users[0].email}</div>
                <div><span className="text-gray-500">Joined:</span> {users[0].created_at ? new Date(users[0].created_at).toLocaleDateString() : ''}</div>
                <div><span className="text-gray-500">Status:</span> {users[0].is_active ? 'Active' : 'Inactive'}</div>

                <div className="pt-2">
                  <div className="font-medium mb-1">Change Password</div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.elements.namedItem('new_password') as HTMLInputElement);
                      const newPassword = input?.value || '';
                      if (!newPassword) return;
                      try {
                        const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${users[0].id}/password`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ new_password: newPassword }),
                        });
                        const data = await res.json();
                        alert(data.message || 'Updated');
                        input.value = '';
                      } catch {
                        alert('Error updating password');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <input name="new_password" type="password" className="border rounded px-3 py-2" placeholder="New password" />
                    <Button type="submit">Update</Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No user loaded.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Password Test Modal */}
      {passwordTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Test User Password</h3>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="Enter password"
              value={passwordTest.password}
              onChange={(e) => setPasswordTest({ ...passwordTest, password: e.target.value })}
            />
            {testResult && (
              <div className={`p-3 rounded ${testResult.includes('valid') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{testResult}</div>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setPasswordTest(null); setTestResult(null); }}>Cancel</Button>
              <Button onClick={() => testPassword(passwordTest.userId, passwordTest.password)} disabled={!passwordTest.password}>Test</Button>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      <UserActivityModal
        userId={selectedUserId}
        isOpen={showUserActivity}
        onClose={() => {
          setShowUserActivity(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}



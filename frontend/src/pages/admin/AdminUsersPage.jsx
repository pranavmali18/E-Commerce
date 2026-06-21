import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminFetchUsers, adminSetUserStatus, adminSetUserRole } from "../../features/admin/adminSlice.js";
import { formatDate } from "../../utils/format.js";

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const { users, error } = useSelector((s) => s.admin);
  const { user: currentUser } = useSelector((s) => s.auth);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(adminFetchUsers({ search }));
  }, [dispatch, search]);

  function toggleStatus(u) {
    if (u._id === currentUser.id) return;
    dispatch(adminSetUserStatus({ id: u._id, isActive: !u.isActive }));
  }

  function toggleRole(u) {
    if (u._id === currentUser.id) return;
    dispatch(adminSetUserRole({ id: u._id, role: u.role === "admin" ? "customer" : "admin" }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50">
                <td className="p-3 text-gray-800">
                  {u.name} {u._id === currentUser.id && <span className="text-gray-400">(you)</span>}
                </td>
                <td className="p-3 text-gray-600">{u.email}</td>
                <td className="p-3 text-gray-600">{formatDate(u.createdAt)}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                      u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={u._id === currentUser.id}
                    className="text-brand-600 hover:underline disabled:opacity-30 disabled:no-underline"
                  >
                    Make {u.role === "admin" ? "customer" : "admin"}
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    disabled={u._id === currentUser.id}
                    className="text-red-600 hover:underline disabled:opacity-30 disabled:no-underline"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

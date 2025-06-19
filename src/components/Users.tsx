// src/components/Users.tsx
"use client";

import React, { useState, useEffect } from "react";
import { User, Search, RefreshCcw, Loader2 } from "lucide-react"; // Contoh ikon
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { supabase } from "../api/supabaseClient"; // Pastikan path ini benar

interface UserProfile {
  id: string;
  full_name: string;
  email?: string; // Asumsi ada email
  role?: string; // Asumsi ada role
  created_at: string;
  // Tambahkan properti lain yang relevan dari tabel profiles
}

const Users: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // Jumlah user per halaman

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Asumsi tabel 'profiles' memiliki kolom 'email'
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          join_date,
          email:auth.users(email),
          role
        `
        )
        .ilike("full_name", `%${searchTerm}%`) // Filter berdasarkan nama
        .order("join_date", { ascending: false })
        .range(
          (currentPage - 1) * usersPerPage,
          currentPage * usersPerPage - 1
        );

      if (error) throw error;

      // Perbaiki format data email jika diperlukan
      const formattedUsers = data.map((user) => ({
        ...user,
        email: user.email ? user.email[0]?.email : undefined, // Mengambil email dari array
      })) as UserProfile[];

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      // Tambahkan toast atau notifikasi error di sini
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset ke halaman 1 saat mencari
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-3 text-gray-700 dark:text-gray-300">
          Loading users...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
        <User className="h-6 w-6 mr-3 text-green-600" />
        {t.users || "User Management"}
      </h2>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchUsers || "Search users..."}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
        >
          <RefreshCcw className="h-5 w-5 mr-2" />
          {t.refresh || "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto">
        {users.length === 0 && searchTerm === "" ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="h-12 w-12 mx-auto mb-3" />
            <p>{t.noUsersYet || "No users found yet."}</p>
          </div>
        ) : users.length === 0 && searchTerm !== "" ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{t.noUsersFound || `No users found for "${searchTerm}".`}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t.name || "Name"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t.email || "Email"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t.role || "Role"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t.joinDate || "Join Date"}
                </th>
                {/* Tambahkan kolom lain jika perlu */}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.role || "user"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  {/* Render data kolom lain */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (Contoh sederhana) */}
      {/* Anda perlu mengimplementasikan logika pagination yang lebih lengkap dengan totalCount dari backend */}
      {users.length === usersPerPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {t.previous || "Previous"}
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            {t.page || "Page"} {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            {t.next || "Next"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Users;

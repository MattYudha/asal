// src/components/DashboardContent.tsx
import React from "react";
import { useLanguage } from "../contexts/LanguageContext"; // Pastikan path ini benar
import { translations } from "../utils/translations"; // Pastikan path ini benar
import AnalyticsCharts from "./AnalyticsCharts"; // Pastikan path ini benar

interface DashboardContentProps {
  // Jika ada props yang diharapkan, tambahkan di sini
}

const DashboardContent: React.FC<DashboardContentProps> = () => {
  const { language } = useLanguage();
  const t = translations[language];

  // Anda bisa menambahkan state atau data fetching di sini
  // Contoh data sederhana
  const totalUsers = 1234;
  const newOrders = 56;
  const revenue = "Rp 123.456.789";

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {t.dashboard || "Dashboard Overview"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-green-800 dark:text-green-300">
          <h3 className="font-semibold">{t.totalUsers || "Total Pengguna"}</h3>
          <p className="text-3xl font-bold">{totalUsers}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg text-blue-800 dark:text-blue-300">
          <h3 className="font-semibold">{t.newOrders || "Pesanan Baru"}</h3>
          <p className="text-3xl font-bold">{newOrders}</p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg text-purple-800 dark:text-purple-300">
          <h3 className="font-semibold">{t.revenue || "Pendapatan"}</h3>
          <p className="text-3xl font-bold">{revenue}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t.analytics || "Analisis"}
        </h3>
        {/* Menggunakan komponen AnalyticsCharts */}
        <AnalyticsCharts isAdmin={true} />{" "}
        {/* Sesuaikan prop isAdmin jika perlu */}
      </div>

      {/* Tambahkan bagian dashboard lainnya di sini */}
    </div>
  );
};

export default DashboardContent;

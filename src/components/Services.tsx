"use client";

import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { analyticsService } from "../services/analyticsService";
import { supabase } from "../api/supabaseClient";
import { useAllServices } from "../hooks/useContentLoader"; // KESALAHAN KETIK DIPERBAIKI DI SINI
import { Link } from "react-router-dom"; // Menggunakan Link untuk navigasi

// Interface untuk data layanan yang akan ditampilkan di card
interface ServiceCardProps {
  name: string;
  description: string;
  imageUrl?: string; // image_url bisa opsional
  slug: string; // Tambahkan slug untuk navigasi ke halaman detail
}

// Komponen ServiceCard
const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  description,
  imageUrl,
  slug,
}) => {
  const handleServiceClick = async (serviceName: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await analyticsService.trackServicePageView(serviceName, user?.id);
  };

  return (
    // Menggunakan Link dari react-router-dom untuk navigasi yang benar
    <Link
      to={`/services/${slug}`} // Arahkan ke halaman detail layanan dinamis
      className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block group" // Tambahkan group untuk hover efek
      onClick={() => handleServiceClick(name)}
    >
      <img
        className="w-full h-48 object-cover object-center transition-transform duration-300 group-hover:scale-105" // Efek zoom pada hover
        src={
          imageUrl || "https://placehold.co/600x400/e0e0e0/808080?text=No+Image"
        } // Fallback image jika imageUrl kosong
        alt={name}
        loading="lazy" // Optimasi loading gambar
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl text-gray-900 dark:text-white mb-2">
          {name}
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-base line-clamp-3">
          {description}
        </p>{" "}
        {/* line-clamp untuk deskripsi panjang */}
      </div>
    </Link>
  );
};

// Komponen Services (Yang akan dipanggil di Home.tsx)
const Services: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  // Mengambil data layanan dari Supabase menggunakan useAllServices
  // useAllServices akan mengembalikan objek dengan data, loading, dan error state
  const { data: fetchedServices, loading, error } = useAllServices();

  // Filter layanan yang diunggulkan (is_featured) dan sesuai dengan bahasa aktif
  // Menggunakan React.useMemo untuk performa, agar tidak recalculate setiap render
  const featuredServices = React.useMemo(() => {
    if (!fetchedServices) return []; // Pastikan fetchedServices adalah array
    return fetchedServices
      .filter((service) => service.is_featured && service.language === language)
      .slice(0, 6); // Batasi hingga 6 layanan unggulan untuk tampilan yang ringkas
  }, [fetchedServices, language]);

  // Tampilkan loading state
  if (loading) {
    return (
      <section id="services" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.ourServices}
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 text-lg mb-12">
            {t.servicesSubtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Skeleton loader untuk tampilan yang lebih baik saat memuat */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 animate-pulse"
              >
                <div className="w-full h-48 bg-gray-300 dark:bg-gray-700"></div>
                <div className="px-6 py-4">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Tampilkan error state
  if (error) {
    return (
      <section id="services" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.ourServices}
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 text-lg mb-12">
            {t.servicesSubtitle}
          </p>
          <p className="text-red-500 dark:text-red-400">
            Error loading services: {error.message || "Something went wrong."}
          </p>
        </div>
      </section>
    );
  }

  // Render layanan jika berhasil dimuat
  return (
    <section id="services" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.ourServices}
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 text-lg">
            {t.servicesSubtitle}
          </p>
        </div>

        {featuredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                description={service.description}
                imageUrl={service.image_url}
                slug={service.slug}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <p>{t.noServicesAvailable || "Belum ada layanan yang tersedia."}</p>
            <p className="mt-2 text-sm">
              Pastikan Anda memiliki data di tabel `services_detail` Supabase
              dan ditandai sebagai `is_featured: true`.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;

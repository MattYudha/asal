import React from "react";
import Navbar from "../components/Navbar"; // Pastikan path ini benar
import Chatbot from "../components/Chatbot"; // Pastikan path ini benar
import Footer from "../components/Footer"; // Pastikan path ini benar
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { Printer, Palette, Package } from "lucide-react"; // Contoh ikon

const Services: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const serviceItems = [
    {
      title: t.digitalPrinting || "Cetak Digital",
      description:
        t.digitalPrintingDesc || "Solusi cetak digital berkualitas tinggi.",
      icon: <Printer className="h-10 w-10 text-green-600 mb-4" />,
    },
    {
      title: t.offsetPrinting || "Cetak Offset",
      description: t.offsetPrintingDesc || "Cetak offset untuk volume besar.",
      icon: <Palette className="h-10 w-10 text-green-600 mb-4" />,
    },
    {
      title: t.packagingSolutions || "Solusi Kemasan",
      description:
        t.packagingSolutionsDesc || "Desain dan produksi kemasan inovatif.",
      icon: <Package className="h-10 w-10 text-green-600 mb-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            {t.ourServices || "Layanan Kami"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            {t.servicesSubtitle ||
              "Kami menawarkan berbagai layanan cetak dan desain untuk memenuhi kebutuhan bisnis Anda."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceItems.map((service, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                {service.icon}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {service.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Chatbot />
    </div>
  );
};

export default Services;

import React from "react";
import Navbar from "../components/Navbar"; // Pastikan path ini benar
import Chatbot from "../components/Chatbot"; // Pastikan path ini benar
import Footer from "../components/Footer"; // Pastikan path ini benar
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";

const About: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center text-center px-4 py-20">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-4">
            {t.aboutTitle || "Tentang Kami"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t.aboutDescription1 ||
              "Kami adalah perusahaan percetakan terkemuka yang menyediakan solusi berkualitas tinggi."}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t.aboutDescription2 ||
              "Dengan teknologi modern dan tim ahli, kami berkomitmen untuk memberikan hasil terbaik."}
          </p>
          <a
            href="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
          >
            {t.home || "Kembali ke Beranda"}
          </a>
        </div>
      </main>
      <Chatbot />
    </div>
  );
};

export default About;

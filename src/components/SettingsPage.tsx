// src/components/SettingsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Settings, Globe, Bell, Sun, Moon, Database } from "lucide-react"; // Contoh ikon
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { useTheme } from "../contexts/ThemeContext"; // Jika Anda memiliki ThemeContext
import { supabase } from "../api/supabaseClient"; // Pastikan path ini benar
import { aiConfigService } from "../services/aiConfigService"; // Untuk pengaturan AI
import { chatbotContentService } from "../services/chatbotContentService"; // Untuk membersihkan cache chatbot

interface SettingsPageProps {
  // Jika ada props yang diharapkan, tambahkan di sini
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const { isDarkMode, toggleTheme } = useTheme(); // Asumsi ada useTheme

  const [aiSettings, setAiSettings] = useState<{ [key: string]: number }>({});
  const [loadingAiSettings, setLoadingAiSettings] = useState(true);
  const [savingAiSettings, setSavingAiSettings] = useState(false);

  const availableLanguages = [
    { code: "id", name: "Bahasa Indonesia" },
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
    { code: "zh", name: "中文" },
    { code: "ar", name: "العربية" },
  ];

  useEffect(() => {
    fetchAiSettings();
  }, []);

  const fetchAiSettings = async () => {
    setLoadingAiSettings(true);
    try {
      const configMap = await aiConfigService.fetchAIConfig(true); // Force refresh
      const settingsObj: { [key: string]: number } = {};
      configMap.forEach((value, key) => {
        settingsObj[key] = value;
      });
      setAiSettings(settingsObj);
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      // Anda bisa menambahkan toast error di sini
    } finally {
      setLoadingAiSettings(false);
    }
  };

  const handleAiSettingChange = (key: string, value: string) => {
    setAiSettings((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const saveAiSettings = async () => {
    setSavingAiSettings(true);
    try {
      // Mengiterasi dan menyimpan setiap pengaturan AI
      for (const key in aiSettings) {
        if (Object.prototype.hasOwnProperty.call(aiSettings, key)) {
          await aiConfigService.updateParameter(key, aiSettings[key]);
        }
      }
      // Anda bisa menambahkan toast sukses di sini
      console.log("AI settings saved successfully!");
    } catch (error) {
      console.error("Error saving AI settings:", error);
      // Anda bisa menambahkan toast error di sini
    } finally {
      setSavingAiSettings(false);
    }
  };

  const handleClearCache = async () => {
    // Implementasi logika pembersihan cache aplikasi/PWA
    // Misalnya, menghapus cache PWA Workbox
    try {
      if (caches) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log("Application caches cleared.");
        // Tambahkan toast sukses
      }
      // Bersihkan cache konten chatbot
      chatbotContentService.clearCache();
      aiConfigService.clearCache();
      console.log("Chatbot content and AI config caches cleared.");
      // Tambahkan toast sukses
    } catch (error) {
      console.error("Error clearing caches:", error);
      // Tambahkan toast error
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
        <Settings className="h-6 w-6 mr-3 text-green-600" />
        {t.appSettings || "Application Settings"}
      </h2>

      {/* General Settings */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
          <Globe className="h-5 w-5 mr-2 text-blue-500" />
          {t.general || "General Settings"}
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.selectLanguage || "Select Language"}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.theme || "Theme"}
          </label>
          <button
            onClick={toggleTheme}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 mr-2" />
            ) : (
              <Moon className="h-5 w-5 mr-2" />
            )}
            {isDarkMode
              ? t.lightMode || "Light Mode"
              : t.darkMode || "Dark Mode"}
          </button>
        </div>
      </div>

      {/* AI Chatbot Settings */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
          <Bell className="h-5 w-5 mr-2 text-purple-500" />
          {t.chatbot || "AI Chatbot Settings"}
        </h3>
        {loadingAiSettings ? (
          <p className="text-gray-500 dark:text-gray-400">
            Loading AI settings...
          </p>
        ) : (
          <>
            {Object.entries(aiSettings).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type="number"
                  step="0.01" // Untuk nilai desimal
                  value={value}
                  onChange={(e) => handleAiSettingChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
            <button
              onClick={saveAiSettings}
              disabled={savingAiSettings}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {savingAiSettings ? "Saving..." : "Save AI Settings"}
            </button>
          </>
        )}
      </div>

      {/* Cache Management */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
          <Database className="h-5 w-5 mr-2 text-orange-500" />
          {t.cacheManagement || "Cache Management"}
        </h3>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          {t.clearAllCaches || "Clear All Caches"}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.cacheWarning ||
            "Hapus semua cache aplikasi, termasuk cache PWA dan data offline."}
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;

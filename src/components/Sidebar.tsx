// src/components/Sidebar.tsx
import React from "react";
import { Link } from "react-router-dom"; // Asumsi Anda menggunakan react-router-dom
import { cn } from "../lib/utils"; // Jika Anda menggunakan utility class helper
import { Button } from "./ui/button"; // Jika Anda menggunakan komponen Button dari ui

interface SidebarProps {
  tabList: { id: string; label: string; icon: React.ElementType }[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  tabList,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="w-64 border-r border-border flex flex-col bg-white dark:bg-gray-800">
      {/* Logo atau Nama Aplikasi */}
      <div className="p-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <span className="font-bold text-xl text-gray-900 dark:text-white">
          Admin Panel
        </span>
      </div>

      {/* Navigasi Sidebar */}
      <nav className="flex-1 px-2 py-4">
        <ul>
          {tabList.map((tab) => (
            <li key={tab.id} className="mb-1">
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full",
                  activeTab === tab.id && "bg-secondary hover:bg-secondary"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bagian Bawah Sidebar (Opsional, seperti info user atau toggle tema) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Anda bisa menambahkan info user, logout, atau pengaturan lain di sini */}
        <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dashboard, People, Settings, Edit } from "@mui/icons-material"
import Sidebar from "../components/Sidebar"
import DashboardContent from "../components/DashboardContent"
import Users from "../components/Users"
import SettingsPage from "../components/SettingsPage"
import ContentManagementSystem from "../components/ContentManagementSystem"

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard")

  const tabList = [
    { id: "dashboard", label: "Dashboard", icon: Dashboard },
    { id: "users", label: "Users", icon: People },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "cms", label: "Content Management", icon: Edit },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar tabList={tabList} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <DashboardContent />
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Users />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <SettingsPage />
            </motion.div>
          )}

          {activeTab === "cms" && (
            <motion.div
              key="cms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <ContentManagementSystem />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminDashboard

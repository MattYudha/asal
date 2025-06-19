"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  X,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Target,
  FileText,
  TrendingUp,
} from "lucide-react"
import { useLanguage } from "../contexts/LanguageContext"
import { translations } from "../utils/translations"
import { supabase } from "../api/supabaseClient"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error" | "rfq_update" | "goal_reminder" | "proactive_suggestion"
  is_read: boolean
  action_url?: string
  action_text?: string
  metadata?: any
  created_at: string
}

interface NotificationSettings {
  notify_activity_reminders: boolean
  notify_progress_updates: boolean
  notify_risk_alerts: boolean
  notify_weekly_summary: boolean
  notify_rfq_updates: boolean
  notify_goal_reminders: boolean
  notify_proactive_suggestions: boolean
}

const NotificationCenter: React.FC = () => {
  const { language } = useLanguage()
  const t = translations[language]

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_activity_reminders: true,
    notify_progress_updates: true,
    notify_risk_alerts: true,
    notify_weekly_summary: true,
    notify_rfq_updates: true,
    notify_goal_reminders: true,
    notify_proactive_suggestions: true,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchNotificationSettings()
    setupRealtimeSubscription()
    checkForProactiveNotifications()
  }, [])

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Notification change received!", payload)
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const checkForProactiveNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Check for goal reminders
      const { data: goals } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "in_progress")

      if (goals) {
        for (const goal of goals) {
          if (goal.target_date) {
            const targetDate = new Date(goal.target_date)
            const today = new Date()
            const daysUntilDeadline = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

            if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
              await createProactiveNotification({
                type: "goal_reminder",
                title: language === "id" ? "Pengingat Tujuan" : "Goal Reminder",
                message:
                  language === "id"
                    ? `Tujuan "${goal.title}" akan berakhir dalam ${daysUntilDeadline} hari`
                    : `Goal "${goal.title}" is due in ${daysUntilDeadline} days`,
                metadata: { goal_id: goal.id, days_remaining: daysUntilDeadline },
              })
            }
          }
        }
      }

      // Check for RFQ follow-ups
      const { data: rfqs } = await supabase
        .from("rfq_submissions")
        .select("*")
        .eq("user_email", user.email)
        .eq("status", "pending")

      if (rfqs && rfqs.length > 0) {
        const oldRfqs = rfqs.filter((rfq) => {
          const createdDate = new Date(rfq.created_at)
          const daysSinceCreated = Math.ceil((Date.now() - createdDate.getTime()) / (1000 * 3600 * 24))
          return daysSinceCreated >= 3
        })

        if (oldRfqs.length > 0) {
          await createProactiveNotification({
            type: "proactive_suggestion",
            title: language === "id" ? "Saran Proaktif" : "Proactive Suggestion",
            message:
              language === "id"
                ? `Anda memiliki ${oldRfqs.length} RFQ yang belum ditanggapi. Gunakan chatbot untuk menanyakan status.`
                : `You have ${oldRfqs.length} pending RFQs. Use our chatbot to inquire about status.`,
            action_text: language === "id" ? "Buka Chatbot" : "Open Chatbot",
            action_url: "#chatbot",
          })
        }
      }

      // Check for low activity
      const { data: recentActivities } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (!recentActivities || recentActivities.length < 3) {
        await createProactiveNotification({
          type: "proactive_suggestion",
          title: language === "id" ? "Tingkatkan Aktivitas" : "Boost Your Activity",
          message:
            language === "id"
              ? "Anda belum banyak beraktivitas minggu ini. Coba jelajahi layanan baru kami!"
              : "You've been less active this week. Try exploring our new services!",
          action_text: language === "id" ? "Lihat Layanan" : "View Services",
          action_url: "/services",
        })
      }
    } catch (error) {
      console.error("Error checking proactive notifications:", error)
    }
  }

  const createProactiveNotification = async (notificationData: {
    type: string
    title: string
    message: string
    action_text?: string
    action_url?: string
    metadata?: any
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Check if similar notification already exists
      const { data: existing } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", notificationData.type)
        .eq("title", notificationData.title)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (existing && existing.length > 0) return // Don't create duplicate

      const { error } = await supabase.from("notifications").insert([
        {
          user_id: user.id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          action_text: notificationData.action_text,
          action_url: notificationData.action_url,
          metadata: notificationData.metadata,
          is_read: false,
        },
      ])

      if (error) throw error
    } catch (error) {
      console.error("Error creating proactive notification:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") throw error
      if (data) {
        setSettings({
          notify_activity_reminders: data.notify_activity_reminders,
          notify_progress_updates: data.notify_progress_updates,
          notify_risk_alerts: data.notify_risk_alerts,
          notify_weekly_summary: data.notify_weekly_summary,
          notify_rfq_updates: data.notify_rfq_updates || true,
          notify_goal_reminders: data.notify_goal_reminders || true,
          notify_proactive_suggestions: data.notify_proactive_suggestions || true,
        })
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const updateNotificationSettings = async (newSettings: NotificationSettings) => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("notification_settings").upsert({
        user_id: user.id,
        ...newSettings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setSettings(newSettings)
    } catch (error) {
      console.error("Error updating notification settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationAction = (notification: Notification) => {
    if (notification.action_url) {
      if (notification.action_url === "#chatbot") {
        // Trigger chatbot open
        const chatbotButton = document.querySelector('[aria-label="Chat with Emran Assistant"]') as HTMLButtonElement
        if (chatbotButton) {
          chatbotButton.click()
        }
      } else {
        window.location.href = notification.action_url
      }
      markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "rfq_update":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "goal_reminder":
        return <Target className="h-5 w-5 text-purple-500" />
      case "proactive_suggestion":
        return <TrendingUp className="h-5 w-5 text-orange-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50 dark:bg-green-900/20"
      case "warning":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      case "error":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20"
      case "rfq_update":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20"
      case "goal_reminder":
        return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20"
      case "proactive_suggestion":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20"
      default:
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20"
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {language === "id" ? "Notifikasi" : "Notifications"}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors mt-2"
                >
                  {language === "id" ? "Tandai semua sudah dibaca" : "Mark all as read"}
                </button>
              )}
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {language === "id" ? "Preferensi Notifikasi" : "Notification Preferences"}
                    </h4>
                    {Object.entries(settings).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {key
                            .replace("notify_", "")
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            updateNotificationSettings({
                              ...settings,
                              [key]: e.target.checked,
                            })
                          }
                          disabled={loading}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {language === "id" ? "Belum ada notifikasi" : "No notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.is_read ? "font-medium" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  !notification.is_read
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>

                              {/* Action Button */}
                              {notification.action_text && notification.action_url && (
                                <button
                                  onClick={() => handleNotificationAction(notification)}
                                  className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors"
                                >
                                  {notification.action_text}
                                </button>
                              )}
                            </div>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter

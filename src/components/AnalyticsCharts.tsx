"use client"

// src/components/AnalyticsCharts.tsx
import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Users, Filter } from "lucide-react"
import { useLanguage } from "../contexts/LanguageContext"
import { translations } from "../utils/translations"
import { analyticsService, type ChartData } from "../services/analyticsService"

interface AnalyticsChartsProps {
  userId?: string // If provided, shows user-specific analytics
  isAdmin?: boolean
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ userId, isAdmin = false }) => {
  const { language } = useLanguage()
  const t = translations[language]

  const [chatbotData, setChatbotData] = useState<ChartData>({ labels: [], datasets: [] })
  const [serviceViewsData, setServiceViewsData] = useState<ChartData>({ labels: [], datasets: [] })
  const [rfqTrendsData, setRfqTrendsData] = useState<ChartData>({ labels: [], datasets: [] })
  const [userActivityData, setUserActivityData] = useState<ChartData>({ labels: [], datasets: [] })
  const [realtimeStats, setRealtimeStats] = useState({
    activeUsers: 0,
    todayEvents: 0,
    topEventTypes: [] as { type: string; count: number }[],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    fetchAnalyticsData()
    if (isAdmin) {
      fetchRealtimeStats()
      // Set up interval for realtime stats
      const interval = setInterval(fetchRealtimeStats, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [timeRange, userId, isAdmin])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      const [chatbot, serviceViews, rfqTrends, userActivity] = await Promise.all([
        analyticsService.getChatbotInteractionsChart(timeRange),
        analyticsService.getServicePageViewsChart(),
        analyticsService.getRFQTrendsChart(timeRange),
        analyticsService.getUserActivityChart(timeRange),
      ])

      setChatbotData(chatbot)
      setServiceViewsData(serviceViews)
      setRfqTrendsData(rfqTrends)
      setUserActivityData(userActivity)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRealtimeStats = async () => {
    try {
      const stats = await analyticsService.getRealtimeStats()
      setRealtimeStats(stats)
    } catch (error) {
      console.error("Error fetching realtime stats:", error)
    }
  }

  const renderLineChart = (data: ChartData, title: string, color: string) => {
    if (!data.datasets.length || !data.labels.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          {language === "id" ? "Tidak ada data" : "No data available"}
        </div>
      )
    }

    const maxValue = Math.max(...data.datasets[0].data)
    const chartHeight = 200

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width="100%" height={chartHeight} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <line
                key={index}
                x1="0"
                y1={chartHeight * ratio}
                x2="100%"
                y2={chartHeight * ratio}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
                opacity="0.5"
              />
            ))}

            {/* Data line */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="3"
              points={data.datasets[0].data
                .map((value, index) => {
                  const x = (index / (data.labels.length - 1)) * 100
                  const y = chartHeight - (value / maxValue) * chartHeight
                  return `${x}%,${y}`
                })
                .join(" ")}
            />

            {/* Data points */}
            {data.datasets[0].data.map((value, index) => {
              const x = (index / (data.labels.length - 1)) * 100
              const y = chartHeight - (value / maxValue) * chartHeight
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${data.labels[index]}: ${value}`}</title>
                </circle>
              )
            })}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            {data.labels.map((label, index) => {
              // Show only every nth label to avoid crowding
              const showLabel = index % Math.ceil(data.labels.length / 6) === 0
              return (
                <span key={index} className={showLabel ? "" : "invisible"}>
                  {new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderBarChart = (data: ChartData, title: string) => {
    if (!data.datasets.length || !data.labels.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          {language === "id" ? "Tidak ada data" : "No data available"}
        </div>
      )
    }

    const maxValue = Math.max(...data.datasets[0].data)
    const colors = data.datasets[0].backgroundColor as string[]

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="space-y-3">
          {data.labels.map((label, index) => {
            const value = data.datasets[0].data[index]
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
            const color = colors?.[index] || "#10B981"

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{label}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{value}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    color,
  }: {
    icon: React.ReactNode
    title: string
    value: string | number
    subtitle?: string
    color: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === "id" ? "Analytics Dashboard" : "Analytics Dashboard"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {userId
              ? language === "id"
                ? "Analytics personal Anda"
                : "Your personal analytics"
              : language === "id"
                ? "Overview analytics website"
                : "Website analytics overview"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number.parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={7}>{language === "id" ? "7 Hari Terakhir" : "Last 7 Days"}</option>
              <option value={30}>{language === "id" ? "30 Hari Terakhir" : "Last 30 Days"}</option>
              <option value={90}>{language === "id" ? "90 Hari Terakhir" : "Last 90 Days"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Realtime Stats (Admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<Users className="h-6 w-6 text-white" />}
            title={language === "id" ? "Pengguna Aktif" : "Active Users"}
            value={realtimeStats.activeUsers}
            subtitle={language === "id" ? "Dalam 1 jam terakhir" : "In the last hour"}
            color="bg-blue-500"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            title={language === "id" ? "Event Hari Ini" : "Today's Events"}
            value={realtimeStats.todayEvents}
            subtitle={language === "id" ? "Total aktivitas" : "Total activities"}
            color="bg-green-500"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-white" />}
            title={language === "id" ? "Event Teratas" : "Top Event"}
            value={realtimeStats.topEventTypes[0]?.type.replace("_", " ") || "N/A"}
            subtitle={`${realtimeStats.topEventTypes[0]?.count || 0} ${language === "id" ? "kali" : "times"}`}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chatbot Interactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {renderLineChart(chatbotData, language === "id" ? "Interaksi Chatbot" : "Chatbot Interactions", "#10B981")}
        </div>

        {/* Service Page Views */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {renderBarChart(serviceViewsData, language === "id" ? "Halaman Layanan Populer" : "Popular Service Pages")}
        </div>

        {/* RFQ Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {renderLineChart(rfqTrendsData, language === "id" ? "Tren RFQ" : "RFQ Trends", "#8B5CF6")}
        </div>

        {/* User Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {renderLineChart(userActivityData, language === "id" ? "Aktivitas Pengguna" : "User Activity", "#F59E0B")}
        </div>
      </div>

      {/* Top Event Types (Admin only) */}
      {isAdmin && realtimeStats.topEventTypes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === "id" ? "Jenis Event Teratas Hari Ini" : "Top Event Types Today"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {realtimeStats.topEventTypes.map((eventType, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{eventType.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                  {eventType.type.replace("_", " ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsCharts

// src/services/analyticsService.ts
import { supabase } from "../api/supabaseClient"

export interface AnalyticsEvent {
  id?: string
  event_type: string
  event_data: Record<string, any>
  user_id?: string
  session_id: string
  timestamp: string
  user_agent?: string
  ip_address?: string
}

export interface DashboardAnalyticsSummary {
  totalChatbotInteractions: number
  totalServicePageViews: number
  totalRFQSubmissions: number
  totalContactSubmissions: number
  weeklyGrowthRate: number
  topServices: { service: string; views: number }[]
  userEngagementScore: number
}

export interface UserAnalyticsSummary {
  totalChatbotInteractions: number
  totalServicePageViews: number
  totalRFQSubmissions: number
  totalContactSubmissions: number
  lastActivityDate: string
  favoriteServices: string[]
  engagementScore: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }[]
}

class AnalyticsService {
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async trackEvent(eventType: string, eventData: Record<string, any> = {}, userId?: string): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: await this.getClientIP(),
      }

      const { error } = await supabase.from("analytics_events").insert([event])

      if (error) {
        console.error("Error tracking analytics event:", error)
      }
    } catch (error) {
      console.error("Error in trackEvent:", error)
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json")
      const data = await response.json()
      return data.ip
    } catch (error) {
      return "unknown"
    }
  }

  // Track specific events
  async trackPageView(pageName: string, userId?: string): Promise<void> {
    await this.trackEvent("page_view", { page: pageName }, userId)
  }

  async trackServicePageView(serviceName: string, userId?: string): Promise<void> {
    await this.trackEvent("service_page_visited", { serviceName }, userId)
  }

  async trackChatbotInteraction(messageType: "user" | "bot", message: string, userId?: string): Promise<void> {
    await this.trackEvent(
      "chatbot_message_sent",
      {
        messageType,
        message: message.substring(0, 100), // Limit message length for storage
        messageLength: message.length,
      },
      userId,
    )
  }

  async trackRFQSubmission(rfqData: any, userId?: string): Promise<void> {
    await this.trackEvent(
      "rfq_submitted",
      {
        projectName: rfqData.project_name,
        category: rfqData.product_category,
        quantity: rfqData.quantity,
        hasDesignFiles: rfqData.design_file_urls && rfqData.design_file_urls.length > 0,
      },
      userId,
    )
  }

  async trackContactSubmission(contactData: any, userId?: string): Promise<void> {
    await this.trackEvent(
      "contact_submitted",
      {
        subject: contactData.subject,
        hasMessage: !!contactData.message,
        language: contactData.lang,
      },
      userId,
    )
  }

  async trackUserGoalCreated(goalData: any, userId?: string): Promise<void> {
    await this.trackEvent(
      "user_goal_created",
      {
        title: goalData.title,
        hasTargetDate: !!goalData.target_date,
        hasTargetValue: !!goalData.target_value,
      },
      userId,
    )
  }

  async trackUserActivityLogged(activityData: any, userId?: string): Promise<void> {
    await this.trackEvent(
      "user_activity_logged",
      {
        activityType: activityData.activity_type,
        hasMoodScore: !!activityData.mood_score,
        hasDescription: !!activityData.description,
      },
      userId,
    )
  }

  async trackFeatureUsage(featureName: string, userId?: string): Promise<void> {
    await this.trackEvent("feature_used", { featureName }, userId)
  }

  async trackSearchQuery(query: string, resultsCount: number, userId?: string): Promise<void> {
    await this.trackEvent(
      "search_performed",
      {
        query: query.substring(0, 50), // Limit query length
        resultsCount,
      },
      userId,
    )
  }

  async trackDownload(fileName: string, fileType: string, userId?: string): Promise<void> {
    await this.trackEvent("file_downloaded", { fileName, fileType }, userId)
  }

  async trackError(errorType: string, errorMessage: string, userId?: string): Promise<void> {
    await this.trackEvent(
      "error_occurred",
      {
        errorType,
        errorMessage: errorMessage.substring(0, 200),
      },
      userId,
    )
  }

  // Analytics retrieval methods
  async getDashboardAnalyticsSummary(): Promise<DashboardAnalyticsSummary> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Get all events from last 30 days
      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", thirtyDaysAgo)

      if (error) throw error

      const chatbotInteractions = events?.filter((e) => e.event_type === "chatbot_message_sent").length || 0
      const servicePageViews = events?.filter((e) => e.event_type === "service_page_visited").length || 0
      const rfqSubmissions = events?.filter((e) => e.event_type === "rfq_submitted").length || 0
      const contactSubmissions = events?.filter((e) => e.event_type === "contact_submitted").length || 0

      // Calculate weekly growth rate
      const lastWeekEvents = events?.filter((e) => new Date(e.timestamp) >= new Date(sevenDaysAgo)) || []
      const previousWeekEvents =
        events?.filter((e) => {
          const eventDate = new Date(e.timestamp)
          const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          return eventDate >= fourteenDaysAgo && eventDate < new Date(sevenDaysAgo)
        }) || []

      const weeklyGrowthRate =
        previousWeekEvents.length > 0
          ? ((lastWeekEvents.length - previousWeekEvents.length) / previousWeekEvents.length) * 100
          : 0

      // Get top services
      const serviceViews = events?.filter((e) => e.event_type === "service_page_visited") || []
      const serviceCount: { [key: string]: number } = {}
      serviceViews.forEach((event) => {
        const serviceName = event.event_data?.serviceName || "Unknown"
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
      })

      const topServices = Object.entries(serviceCount)
        .map(([service, views]) => ({ service, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)

      // Calculate user engagement score (simplified)
      const uniqueUsers = new Set(events?.map((e) => e.user_id).filter(Boolean)).size
      const totalEvents = events?.length || 0
      const userEngagementScore = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0

      return {
        totalChatbotInteractions: chatbotInteractions,
        totalServicePageViews: servicePageViews,
        totalRFQSubmissions: rfqSubmissions,
        totalContactSubmissions: contactSubmissions,
        weeklyGrowthRate,
        topServices,
        userEngagementScore,
      }
    } catch (error) {
      console.error("Error getting dashboard analytics summary:", error)
      return {
        totalChatbotInteractions: 0,
        totalServicePageViews: 0,
        totalRFQSubmissions: 0,
        totalContactSubmissions: 0,
        weeklyGrowthRate: 0,
        topServices: [],
        userEngagementScore: 0,
      }
    }
  }

  async getDashboardAnalyticsSummaryForUser(
    userId: string,
  ): Promise<{ totalChatbotInteractions: number; totalServicePageViews: number }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", thirtyDaysAgo)

      if (error) throw error

      const chatbotInteractions = events?.filter((e) => e.event_type === "chatbot_message_sent").length || 0
      const servicePageViews = events?.filter((e) => e.event_type === "service_page_visited").length || 0

      return {
        totalChatbotInteractions: chatbotInteractions,
        totalServicePageViews: servicePageViews,
      }
    } catch (error) {
      console.error("Error getting user analytics summary:", error)
      return {
        totalChatbotInteractions: 0,
        totalServicePageViews: 0,
      }
    }
  }

  async getUserAnalyticsSummary(userId: string): Promise<UserAnalyticsSummary> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", thirtyDaysAgo)
        .order("timestamp", { ascending: false })

      if (error) throw error

      const chatbotInteractions = events?.filter((e) => e.event_type === "chatbot_message_sent").length || 0
      const servicePageViews = events?.filter((e) => e.event_type === "service_page_visited").length || 0
      const rfqSubmissions = events?.filter((e) => e.event_type === "rfq_submitted").length || 0
      const contactSubmissions = events?.filter((e) => e.event_type === "contact_submitted").length || 0

      const lastActivityDate = events && events.length > 0 ? events[0].timestamp : ""

      // Get favorite services
      const serviceViews = events?.filter((e) => e.event_type === "service_page_visited") || []
      const serviceCount: { [key: string]: number } = {}
      serviceViews.forEach((event) => {
        const serviceName = event.event_data?.serviceName || "Unknown"
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
      })

      const favoriteServices = Object.entries(serviceCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([service]) => service)

      // Calculate engagement score
      const totalEvents = events?.length || 0
      const daysSinceFirstEvent =
        events && events.length > 0
          ? Math.ceil((Date.now() - new Date(events[events.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24))
          : 1
      const engagementScore = totalEvents / daysSinceFirstEvent

      return {
        totalChatbotInteractions: chatbotInteractions,
        totalServicePageViews: servicePageViews,
        totalRFQSubmissions: rfqSubmissions,
        totalContactSubmissions: contactSubmissions,
        lastActivityDate,
        favoriteServices,
        engagementScore,
      }
    } catch (error) {
      console.error("Error getting user analytics summary:", error)
      return {
        totalChatbotInteractions: 0,
        totalServicePageViews: 0,
        totalRFQSubmissions: 0,
        totalContactSubmissions: 0,
        lastActivityDate: "",
        favoriteServices: [],
        engagementScore: 0,
      }
    }
  }

  async getChatbotInteractionsChart(days = 30): Promise<ChartData> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("timestamp")
        .eq("event_type", "chatbot_message_sent")
        .gte("timestamp", startDate)
        .order("timestamp", { ascending: true })

      if (error) throw error

      // Group by date
      const dailyCounts: { [key: string]: number } = {}
      events?.forEach((event) => {
        const date = new Date(event.timestamp).toISOString().split("T")[0]
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      // Fill in missing dates with 0
      const labels: string[] = []
      const data: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        labels.push(date)
        data.push(dailyCounts[date] || 0)
      }

      return {
        labels,
        datasets: [
          {
            label: "Chatbot Interactions",
            data,
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 2,
          },
        ],
      }
    } catch (error) {
      console.error("Error getting chatbot interactions chart:", error)
      return { labels: [], datasets: [] }
    }
  }

  async getServicePageViewsChart(): Promise<ChartData> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("event_data")
        .eq("event_type", "service_page_visited")
        .gte("timestamp", thirtyDaysAgo)

      if (error) throw error

      const serviceCount: { [key: string]: number } = {}
      events?.forEach((event) => {
        const serviceName = event.event_data?.serviceName || "Unknown"
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
      })

      const sortedServices = Object.entries(serviceCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)

      return {
        labels: sortedServices.map(([service]) => service),
        datasets: [
          {
            label: "Page Views",
            data: sortedServices.map(([, views]) => views),
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(245, 158, 11, 0.8)",
              "rgba(239, 68, 68, 0.8)",
              "rgba(139, 92, 246, 0.8)",
              "rgba(236, 72, 153, 0.8)",
              "rgba(34, 197, 94, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(168, 85, 247, 0.8)",
              "rgba(14, 165, 233, 0.8)",
            ],
          },
        ],
      }
    } catch (error) {
      console.error("Error getting service page views chart:", error)
      return { labels: [], datasets: [] }
    }
  }

  async getRFQTrendsChart(days = 30): Promise<ChartData> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("timestamp")
        .eq("event_type", "rfq_submitted")
        .gte("timestamp", startDate)
        .order("timestamp", { ascending: true })

      if (error) throw error

      // Group by date
      const dailyCounts: { [key: string]: number } = {}
      events?.forEach((event) => {
        const date = new Date(event.timestamp).toISOString().split("T")[0]
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      // Fill in missing dates with 0
      const labels: string[] = []
      const data: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        labels.push(date)
        data.push(dailyCounts[date] || 0)
      }

      return {
        labels,
        datasets: [
          {
            label: "RFQ Submissions",
            data,
            backgroundColor: "rgba(168, 85, 247, 0.2)",
            borderColor: "rgba(168, 85, 247, 1)",
            borderWidth: 2,
          },
        ],
      }
    } catch (error) {
      console.error("Error getting RFQ trends chart:", error)
      return { labels: [], datasets: [] }
    }
  }

  async getUserActivityChart(days = 30): Promise<ChartData> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("timestamp, user_id")
        .gte("timestamp", startDate)
        .not("user_id", "is", null)
        .order("timestamp", { ascending: true })

      if (error) throw error

      // Group by date and count unique users
      const dailyUsers: { [key: string]: Set<string> } = {}
      events?.forEach((event) => {
        const date = new Date(event.timestamp).toISOString().split("T")[0]
        if (!dailyUsers[date]) {
          dailyUsers[date] = new Set()
        }
        dailyUsers[date].add(event.user_id)
      })

      // Fill in missing dates with 0
      const labels: string[] = []
      const data: number[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        labels.push(date)
        data.push(dailyUsers[date]?.size || 0)
      }

      return {
        labels,
        datasets: [
          {
            label: "Active Users",
            data,
            backgroundColor: "rgba(236, 72, 153, 0.2)",
            borderColor: "rgba(236, 72, 153, 1)",
            borderWidth: 2,
          },
        ],
      }
    } catch (error) {
      console.error("Error getting user activity chart:", error)
      return { labels: [], datasets: [] }
    }
  }

  // Cleanup old events (should be run periodically)
  async cleanupOldEvents(daysToKeep = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase.from("analytics_events").delete().lt("timestamp", cutoffDate)

      if (error) throw error
      console.log(`Cleaned up analytics events older than ${daysToKeep} days`)
    } catch (error) {
      console.error("Error cleaning up old events:", error)
    }
  }

  // Get real-time analytics (for admin dashboard)
  async getRealtimeStats(): Promise<{
    activeUsers: number
    todayEvents: number
    topEventTypes: { type: string; count: number }[]
  }> {
    try {
      const today = new Date().toISOString().split("T")[0]
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Get active users in last hour
      const { data: activeUserEvents, error: activeUsersError } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("timestamp", oneHourAgo)
        .not("user_id", "is", null)

      if (activeUsersError) throw activeUsersError

      const activeUsers = new Set(activeUserEvents?.map((e) => e.user_id)).size

      // Get today's events
      const { data: todayEvents, error: todayError } = await supabase
        .from("analytics_events")
        .select("event_type")
        .gte("timestamp", today)

      if (todayError) throw todayError

      const todayEventsCount = todayEvents?.length || 0

      // Get top event types today
      const eventTypeCount: { [key: string]: number } = {}
      todayEvents?.forEach((event) => {
        eventTypeCount[event.event_type] = (eventTypeCount[event.event_type] || 0) + 1
      })

      const topEventTypes = Object.entries(eventTypeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        activeUsers,
        todayEvents: todayEventsCount,
        topEventTypes,
      }
    } catch (error) {
      console.error("Error getting realtime stats:", error)
      return {
        activeUsers: 0,
        todayEvents: 0,
        topEventTypes: [],
      }
    }
  }
}

export const analyticsService = new AnalyticsService()

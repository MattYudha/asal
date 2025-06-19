"use client";

// src/pages/Dashboard.tsx
import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Eye,
  FileText,
  Home,
  User,
  Settings,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../utils/translations";
import { supabase } from "../api/supabaseClient";
import { analyticsService } from "../services/analyticsService";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/mode-toggle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AnalyticsCharts from "../components/AnalyticsCharts";

interface UserGoal {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  target_value?: number;
  current_value?: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface UserActivity {
  id: string;
  activity_type: string;
  description?: string;
  mood_score?: number;
  goal_id?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  join_date: string;
  streak: number;
  completed_activities: number;
  risk_score_current: number;
  risk_score_previous: number;
  billing_addresses?: any[];
  shipping_addresses?: any[];
}

interface RFQSubmission {
  id: string;
  user_name: string;
  user_email: string;
  project_name: string;
  product_category?: string;
  size_specifications?: string;
  quantity: number;
  deadline?: string;
  design_file_urls?: string[];
  additional_notes?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  currency?: string;
  status: "pending" | "reviewed" | "quoted" | "completed" | "cancelled";
  quote_amount?: number;
  quote_file_url?: string;
  assigned_to?: string;
  communication_log?: any[];
  created_at: string;
  updated_at: string;
}

interface DashboardAnalyticsSummary {
  totalChatbotInteractions: number;
  totalServicePageViews: number;
}

const Dashboard: React.FC = () => {
  const { language } = useLanguage();
  const tOriginal = translations[language];
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const currentLanguage = i18n.language;

  const [activeTab, setActiveTab] = useState("home");
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [rfqs, setRfqs] = useState<RFQSubmission[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analyticsSummary, setAnalyticsSummary] =
    useState<DashboardAnalyticsSummary>({
      totalChatbotInteractions: 0,
      totalServicePageViews: 0,
    });
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<RFQSubmission | null>(null);
  const [expandedRfq, setExpandedRfq] = useState<string | null>(null);
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [rfqStatusFilter, setRfqStatusFilter] = useState("all");
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    target_date: "",
    target_value: 0,
  });
  const [newAddress, setNewAddress] = useState({
    type: "billing" as "billing" | "shipping",
    name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Indonesia",
    is_default: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user goals
      const { data: goalsData } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch user RFQs
      const { data: rfqsData } = await supabase
        .from("rfq_submissions")
        .select("*")
        .eq("user_email", user.email)
        .order("created_at", { ascending: false });

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Fetch dashboard analytics summary
      const dashboardAnalytics =
        await analyticsService.getDashboardAnalyticsSummaryForUser(user.id);

      setGoals(goalsData || []);
      setActivities(activitiesData || []);
      setRfqs(rfqsData || []);
      setProfile(profileData);
      setAnalyticsSummary(dashboardAnalytics);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_goals")
        .insert([
          {
            user_id: user.id,
            title: newGoal.title,
            description: newGoal.description,
            target_date: newGoal.target_date || null,
            target_value: newGoal.target_value || null,
            current_value: 0,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => [data, ...prev]);
      setNewGoal({
        title: "",
        description: "",
        target_date: "",
        target_value: 0,
      });
      setShowGoalForm(false);
      fetchUserData();
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("user_goals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", goalId);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId ? { ...goal, status: status as any } : goal
        )
      );
      fetchUserData();
    } catch (error) {
      console.error("Error updating goal status:", error);
    }
  };

  const handleLinkActivityToGoal = async (
    activityId: string,
    goalId: string | null
  ) => {
    try {
      const { error } = await supabase
        .from("user_activities")
        .update({ goal_id: goalId })
        .eq("id", activityId);

      if (error) throw error;

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? { ...activity, goal_id: goalId }
            : activity
        )
      );

      // Update goal progress if linked
      if (goalId) {
        const goal = goals.find((g) => g.id === goalId);
        if (goal && goal.target_value) {
          const linkedActivities =
            activities.filter((a) => a.goal_id === goalId).length + 1;
          const progress = Math.min(
            (linkedActivities / goal.target_value) * 100,
            100
          );

          await supabase
            .from("user_goals")
            .update({
              current_value: linkedActivities,
              status: progress >= 100 ? "completed" : "in_progress",
            })
            .eq("id", goalId);
        }
      }

      fetchUserData();
    } catch (error) {
      console.error("Error linking activity to goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("user_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
      fetchUserData();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleAddAddress = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const addressField =
        newAddress.type === "billing"
          ? "billing_addresses"
          : "shipping_addresses";
      const currentAddresses = profile?.[addressField] || [];

      const updatedAddresses = [
        ...currentAddresses,
        {
          ...newAddress,
          id: Date.now().toString(),
        },
      ];

      const { error } = await supabase
        .from("profiles")
        .update({ [addressField]: updatedAddresses })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) =>
        prev ? { ...prev, [addressField]: updatedAddresses } : null
      );
      setNewAddress({
        type: "billing",
        name: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Indonesia",
        is_default: false,
      });
      setShowAddressForm(false);
    } catch (error) {
      console.error("Error adding address:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "in_progress":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "cancelled":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      case "reviewed":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
      case "quoted":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
      default:
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      case "reviewed":
        return <Eye className="h-4 w-4" />;
      case "quoted":
        return <FileText className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: { [key: string]: { id: string; en: string } } = {
      printing_project: { id: "Proyek Cetak", en: "Printing Project" },
      design_work: { id: "Pekerjaan Desain", en: "Design Work" },
      client_meeting: { id: "Pertemuan Klien", en: "Client Meeting" },
      quality_check: { id: "Pemeriksaan Kualitas", en: "Quality Check" },
      learning: { id: "Pembelajaran", en: "Learning" },
      planning: { id: "Perencanaan", en: "Planning" },
    };
    return labels[type]?.[language] || type;
  };

  const calculateRiskScoreInfo = () => {
    const current = profile?.risk_score_current || 0;
    const previous = profile?.risk_score_previous || 0;
    const trend = current - previous;

    let level = "Low";
    let color = "text-green-600";
    let tips = [];

    if (current > 7) {
      level = "High";
      color = "text-red-600";
      tips = [
        language === "id"
          ? "Tingkatkan aktivitas harian"
          : "Increase daily activities",
        language === "id"
          ? "Tetapkan tujuan yang realistis"
          : "Set realistic goals",
        language === "id"
          ? "Gunakan chatbot untuk bantuan"
          : "Use chatbot for assistance",
      ];
    } else if (current > 4) {
      level = "Medium";
      color = "text-yellow-600";
      tips = [
        language === "id"
          ? "Pertahankan konsistensi aktivitas"
          : "Maintain activity consistency",
        language === "id"
          ? "Tinjau kemajuan tujuan secara berkala"
          : "Review goal progress regularly",
      ];
    } else {
      tips = [
        language === "id"
          ? "Pertahankan performa yang baik"
          : "Keep up the good performance",
        language === "id"
          ? "Tetap aktif dan konsisten"
          : "Stay active and consistent",
      ];
    }

    return { level, color, trend, tips };
  };

  // Calculate goal status counts and activity type distribution
  const goalStatusCounts = goals.reduce((acc, goal) => {
    acc[goal.status] = (acc[goal.status] || 0) + 1;
    return acc;
  }, {} as Record<UserGoal["status"], number>);

  const activityTypeDistribution = activities.reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalGoals = goals.length;
  const completedGoals = goalStatusCounts.completed || 0;
  const goalCompletionRate =
    totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(1) : "0.0";

  const filteredActivities = activities.filter(
    (activity) =>
      activityTypeFilter === "all" ||
      activity.activity_type === activityTypeFilter
  );

  const filteredRfqs = rfqs.filter(
    (rfq) => rfqStatusFilter === "all" || rfq.status === rfqStatusFilter
  );

  const riskInfo = calculateRiskScoreInfo();

  const navigationTabs = [
    {
      id: "home",
      label: currentLanguage === "id" ? "Beranda" : "Home",
      icon: Home,
    },
    {
      id: "profile",
      label: currentLanguage === "id" ? "Profil" : "Profile",
      icon: User,
    },
    {
      id: "settings",
      label: currentLanguage === "id" ? "Pengaturan" : "Settings",
      icon: Settings,
    },
    {
      id: "analytics",
      label: currentLanguage === "id" ? "Analytics" : "Analytics",
      icon: BarChart3,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-4 flex items-center justify-center">
          <span className="font-bold text-xl">{t("appName")}</span>
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul>
            {navigationTabs.map((tab) => (
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
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src={user?.image || "/placeholder.svg"} />
                  <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || <Skeleton className="h-4 w-24" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || <Skeleton className="h-4 w-32" />}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <ModeToggle />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <p>{t("welcomeMessage", { name: user?.name })}</p>
            </motion.div>
          )}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <p>{t("profileSettings")}</p>
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
              <p>{t("appSettings")}</p>
            </motion.div>
          )}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <AnalyticsCharts userId={user?.id} isAdmin={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;

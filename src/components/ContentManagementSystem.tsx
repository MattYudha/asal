"use client"

// src/components/ContentManagementSystem.tsx
import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit, Trash2, X, Upload, ImageIcon, FileText, Users, Briefcase, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "../contexts/LanguageContext"
import { translations } from "../utils/translations"
import { supabase } from "../api/supabaseClient"

interface CompanyInfo {
  id: string
  section: "about" | "mission" | "vision" | "values"
  title: string
  content: string
  image_url?: string
  order_index: number
  is_active: boolean
  language: "id" | "en"
  created_at: string
  updated_at: string
}

interface ServiceDetail {
  id: string
  name: string
  slug: string
  description: string
  detailed_description: string
  features: string[]
  pricing_info?: string
  image_url?: string
  gallery_urls?: string[]
  category: string
  is_featured: boolean
  is_active: boolean
  order_index: number
  meta_title?: string
  meta_description?: string
  language: "id" | "en"
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  name: string
  position: string
  bio: string
  image_url?: string
  social_links?: {
    linkedin?: string
    twitter?: string
    email?: string
  }
  is_active: boolean
  order_index: number
  language: "id" | "en"
  created_at: string
  updated_at: string
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  category: string
  client_name?: string
  project_date?: string
  image_url?: string
  gallery_urls?: string[]
  tags: string[]
  is_featured: boolean
  is_active: boolean
  order_index: number
  language: "id" | "en"
  created_at: string
  updated_at: string
}

type ContentType = "company_info" | "services" | "team" | "portfolio"

const ContentManagementSystem: React.FC = () => {
  const { language } = useLanguage()
  const t = translations[language]

  const [activeTab, setActiveTab] = useState<ContentType>("company_info")
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo[]>([])
  const [services, setServices] = useState<ServiceDetail[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])

  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<"create" | "edit">("create")

  // Form states
  const [formData, setFormData] = useState<any>({})
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [activeTab, language])

  const fetchContent = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case "company_info":
          await fetchCompanyInfo()
          break
        case "services":
          await fetchServices()
          break
        case "team":
          await fetchTeam()
          break
        case "portfolio":
          await fetchPortfolio()
          break
      }
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyInfo = async () => {
    const { data, error } = await supabase
      .from("company_info")
      .select("*")
      .eq("language", language)
      .order("order_index", { ascending: true })

    if (error) throw error
    setCompanyInfo(data || [])
  }

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services_detail")
      .select("*")
      .eq("language", language)
      .order("order_index", { ascending: true })

    if (error) throw error
    setServices(data || [])
  }

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("language", language)
      .order("order_index", { ascending: true })

    if (error) throw error
    setTeam(data || [])
  }

  const fetchPortfolio = async () => {
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("language", language)
      .order("order_index", { ascending: true })

    if (error) throw error
    setPortfolio(data || [])
  }

  const handleCreate = () => {
    setModalType("create")
    setEditingItem(null)
    setFormData(getDefaultFormData())
    setShowModal(true)
  }

  const handleEdit = (item: any) => {
    setModalType("edit")
    setEditingItem(item)
    setFormData({ ...item })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return
    }

    try {
      const tableName = getTableName()
      const { error } = await supabase.from(tableName).delete().eq("id", id)

      if (error) throw error
      await fetchContent()
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const tableName = getTableName()

      if (modalType === "create") {
        const { error } = await supabase.from(tableName).insert([{ ...formData, language }])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from(tableName)
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", editingItem.id)

        if (error) throw error
      }

      setShowModal(false)
      await fetchContent()
    } catch (error) {
      console.error("Error saving item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, fieldName: string) => {
    try {
      setUploadingImage(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `cms/${activeTab}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("assets").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("assets").getPublicUrl(filePath)

      setFormData((prev) => ({
        ...prev,
        [fieldName]: publicUrl,
      }))
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setUploadingImage(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const tableName = getTableName()
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      await fetchContent()
    } catch (error) {
      console.error("Error toggling active status:", error)
    }
  }

  const getTableName = (): string => {
    switch (activeTab) {
      case "company_info":
        return "company_info"
      case "services":
        return "services_detail"
      case "team":
        return "team_members"
      case "portfolio":
        return "portfolio_items"
      default:
        return ""
    }
  }

  const getDefaultFormData = () => {
    switch (activeTab) {
      case "company_info":
        return {
          section: "about",
          title: "",
          content: "",
          image_url: "",
          order_index: 0,
          is_active: true,
        }
      case "services":
        return {
          name: "",
          slug: "",
          description: "",
          detailed_description: "",
          features: [],
          pricing_info: "",
          image_url: "",
          gallery_urls: [],
          category: "",
          is_featured: false,
          is_active: true,
          order_index: 0,
          meta_title: "",
          meta_description: "",
        }
      case "team":
        return {
          name: "",
          position: "",
          bio: "",
          image_url: "",
          social_links: {},
          is_active: true,
          order_index: 0,
        }
      case "portfolio":
        return {
          title: "",
          description: "",
          category: "",
          client_name: "",
          project_date: "",
          image_url: "",
          gallery_urls: [],
          tags: [],
          is_featured: false,
          is_active: true,
          order_index: 0,
        }
      default:
        return {}
    }
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case "company_info":
        return companyInfo
      case "services":
        return services
      case "team":
        return team
      case "portfolio":
        return portfolio
      default:
        return []
    }
  }

  const renderTable = () => {
    const data = getCurrentData()

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">{getEmptyIcon()}</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {language === "id" ? "Belum ada konten" : "No content yet"}
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === "id" ? "Tambah Konten" : "Add Content"}
          </button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {getTableHeaders().map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {renderTableRow(item)}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className={`p-1 rounded ${
                        item.is_active
                          ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={item.is_active ? "Active" : "Inactive"}
                    >
                      {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const getEmptyIcon = () => {
    switch (activeTab) {
      case "company_info":
        return <FileText className="h-12 w-12 mx-auto" />
      case "services":
        return <Briefcase className="h-12 w-12 mx-auto" />
      case "team":
        return <Users className="h-12 w-12 mx-auto" />
      case "portfolio":
        return <ImageIcon className="h-12 w-12 mx-auto" />
      default:
        return <FileText className="h-12 w-12 mx-auto" />
    }
  }

  const getTableHeaders = (): string[] => {
    switch (activeTab) {
      case "company_info":
        return ["Section", "Title", "Content Preview", "Order", "Status"]
      case "services":
        return ["Name", "Category", "Description", "Featured", "Status"]
      case "team":
        return ["Name", "Position", "Bio Preview", "Order", "Status"]
      case "portfolio":
        return ["Title", "Category", "Client", "Date", "Featured", "Status"]
      default:
        return []
    }
  }

  const renderTableRow = (item: any) => {
    switch (activeTab) {
      case "company_info":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
              {item.section}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.title}</td>
            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
              <div className="max-w-xs truncate">{item.content}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.order_index}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_active
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {item.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </>
        )
      case "services":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.category}</td>
            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
              <div className="max-w-xs truncate">{item.description}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_featured
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {item.is_featured ? "Featured" : "Regular"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_active
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {item.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </>
        )
      case "team":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {item.image_url && (
                  <img
                    className="h-8 w-8 rounded-full mr-3"
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                  />
                )}
                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.position}</td>
            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
              <div className="max-w-xs truncate">{item.bio}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.order_index}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_active
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {item.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </>
        )
      case "portfolio":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {item.image_url && (
                  <img
                    className="h-8 w-8 rounded mr-3 object-cover"
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.title}
                  />
                )}
                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {item.client_name || "-"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {item.project_date ? new Date(item.project_date).toLocaleDateString() : "-"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_featured
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {item.is_featured ? "Featured" : "Regular"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_active
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {item.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </>
        )
      default:
        return null
    }
  }

  const renderModal = () => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {modalType === "create" ? "Create" : "Edit"} {activeTab.replace("_", " ").toUpperCase()}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">{renderFormFields()}</div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderFormFields = () => {
    switch (activeTab) {
      case "company_info":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
              <select
                value={formData.section || "about"}
                onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="about">About</option>
                <option value="mission">Mission</option>
                <option value="vision">Vision</option>
                <option value="values">Values</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
              <textarea
                value={formData.content || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "image_url")
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                </label>
                {formData.image_url && (
                  <img
                    src={formData.image_url || "/placeholder.svg"}
                    alt="Preview"
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Index</label>
              <input
                type="number"
                value={formData.order_index || 0}
                onChange={(e) => setFormData((prev) => ({ ...prev, order_index: Number.parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </>
        )
      // Add other form fields for services, team, portfolio...
      default:
        return <div>Form fields for {activeTab} coming soon...</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management System</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your website content dynamically</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: "company_info", label: "Company Info", icon: FileText },
            { id: "services", label: "Services", icon: Briefcase },
            { id: "team", label: "Team", icon: Users },
            { id: "portfolio", label: "Portfolio", icon: ImageIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ContentType)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">{renderTable()}</div>
      </div>

      {/* Modal */}
      <AnimatePresence>{showModal && renderModal()}</AnimatePresence>
    </div>
  )
}

export default ContentManagementSystem

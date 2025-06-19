"use client"

// src/components/DynamicServicePage.tsx
import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Star, Check, Download, Share2, Heart, MessageCircle, Phone, Mail } from "lucide-react"
import { useLanguage } from "../contexts/LanguageContext"
import { translations } from "../utils/translations"
import { supabase } from "../api/supabaseClient"
import { analyticsService } from "../services/analyticsService"

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

const DynamicServicePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]

  const [service, setService] = useState<ServiceDetail | null>(null)
  const [relatedServices, setRelatedServices] = useState<ServiceDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [showRFQModal, setShowRFQModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchServiceDetails()
    }
  }, [slug, language])

  useEffect(() => {
    if (service) {
      // Track service page view
      trackPageView()
      // Set page title and meta description
      document.title = service.meta_title || service.name
      if (service.meta_description) {
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
          metaDescription.setAttribute("content", service.meta_description)
        }
      }
    }
  }, [service])

  const fetchServiceDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch main service
      const { data: serviceData, error: serviceError } = await supabase
        .from("services_detail")
        .select("*")
        .eq("slug", slug)
        .eq("language", language)
        .eq("is_active", true)
        .single()

      if (serviceError) {
        if (serviceError.code === "PGRST116") {
          setError("Service not found")
        } else {
          throw serviceError
        }
        return
      }

      setService(serviceData)
      setSelectedImage(serviceData.image_url || "")

      // Fetch related services
      const { data: relatedData, error: relatedError } = await supabase
        .from("services_detail")
        .select("*")
        .eq("language", language)
        .eq("is_active", true)
        .eq("category", serviceData.category)
        .neq("id", serviceData.id)
        .limit(3)

      if (relatedError) throw relatedError
      setRelatedServices(relatedData || [])
    } catch (error) {
      console.error("Error fetching service details:", error)
      setError("Failed to load service details")
    } finally {
      setLoading(false)
    }
  }

  const trackPageView = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      await analyticsService.trackServicePageView(service?.name || "", user?.id)
      await analyticsService.trackPageView(`service-${slug}`, user?.id)
    } catch (error) {
      console.error("Error tracking page view:", error)
    }
  }

  const handleRFQRequest = () => {
    setShowRFQModal(true)
    analyticsService.trackFeatureUsage("rfq_from_service_page")
  }

  const handleContactUs = () => {
    navigate("/contact")
    analyticsService.trackFeatureUsage("contact_from_service_page")
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: service?.name,
          text: service?.description,
          url: window.location.href,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        // You could show a toast notification here
      }
      analyticsService.trackFeatureUsage("share_service_page")
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    analyticsService.trackFeatureUsage("favorite_service")
  }

  const handleDownloadBrochure = () => {
    // This would typically download a PDF brochure
    analyticsService.trackDownload("service_brochure.pdf", "pdf")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error || "Service not found"}</h1>
            <button
              onClick={() => navigate("/services")}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "id" ? "Kembali ke Layanan" : "Back to Services"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <button
            onClick={() => navigate("/")}
            className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            {language === "id" ? "Beranda" : "Home"}
          </button>
          <span>/</span>
          <button
            onClick={() => navigate("/services")}
            className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            {language === "id" ? "Layanan" : "Services"}
          </button>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{service.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mr-4">{service.name}</h1>
                    {service.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{service.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
                      {service.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="mb-4">
                <img
                  src={selectedImage || service.image_url || "/placeholder.svg?height=400&width=600"}
                  alt={service.name}
                  className="w-full h-64 md:h-96 object-cover rounded-lg"
                />
              </div>
              {service.gallery_urls && service.gallery_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setSelectedImage(service.image_url || "")}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === service.image_url
                        ? "border-green-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={service.image_url || "/placeholder.svg?height=100&width=100"}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {service.gallery_urls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(url)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === url
                          ? "border-green-500"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <img
                        src={url || "/placeholder.svg?height=100&width=100"}
                        alt={`${service.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {language === "id" ? "Deskripsi Detail" : "Detailed Description"}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {service.detailed_description || service.description}
                </p>
              </div>
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {language === "id" ? "Fitur & Keunggulan" : "Features & Benefits"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Info */}
            {service.pricing_info && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {language === "id" ? "Informasi Harga" : "Pricing Information"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{service.pricing_info}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Action Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === "id" ? "Tertarik dengan layanan ini?" : "Interested in this service?"}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleRFQRequest}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {language === "id" ? "Minta Penawaran" : "Request Quote"}
                </button>
                <button
                  onClick={handleContactUs}
                  className="w-full flex items-center justify-center px-4 py-3 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors font-medium"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  {language === "id" ? "Hubungi Kami" : "Contact Us"}
                </button>
                <button
                  onClick={handleDownloadBrochure}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {language === "id" ? "Download Brosur" : "Download Brochure"}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === "id" ? "Butuh bantuan?" : "Need help?"}
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>+62 21 1234 5678</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>info@emranghanim.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Services */}
            {relatedServices.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === "id" ? "Layanan Terkait" : "Related Services"}
                </h3>
                <div className="space-y-4">
                  {relatedServices.map((relatedService) => (
                    <motion.div
                      key={relatedService.id}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-pointer"
                      onClick={() => navigate(`/services/${relatedService.slug}`)}
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <img
                          src={relatedService.image_url || "/placeholder.svg?height=60&width=60"}
                          alt={relatedService.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{relatedService.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {relatedService.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicServicePage

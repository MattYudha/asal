// scripts/maintenance-tasks.ts
// This script should be run periodically (e.g., daily via cron job)

import { supabase } from "../src/api/supabaseClient"

async function updateUserRiskScores() {
  console.log("Starting user risk score update...")

  try {
    const { error } = await supabase.rpc("update_user_risk_scores")

    if (error) {
      console.error("Error updating user risk scores:", error)
      return false
    }

    console.log("User risk scores updated successfully")
    return true
  } catch (error) {
    console.error("Error during user risk score update:", error)
    return false
  }
}

async function generateProactiveNotifications() {
  console.log("Starting proactive notification generation...")

  try {
    const { error } = await supabase.rpc("generate_proactive_notifications")

    if (error) {
      console.error("Error generating proactive notifications:", error)
      return false
    }

    console.log("Proactive notifications generated successfully")
    return true
  } catch (error) {
    console.error("Error during proactive notification generation:", error)
    return false
  }
}

async function cleanupOldAnalyticsEvents(daysToKeep = 90) {
  console.log(`Starting cleanup of analytics events older than ${daysToKeep} days...`)

  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from("analytics_events").delete().lt("timestamp", cutoffDate)

    if (error) {
      console.error("Error cleaning up old analytics events:", error)
      return false
    }

    console.log(`Cleaned up analytics events older than ${daysToKeep} days`)
    return true
  } catch (error) {
    console.error("Error during analytics event cleanup:", error)
    return false
  }
}

async function main() {
  console.log("Running maintenance tasks...")

  const riskScoreUpdateSuccess = await updateUserRiskScores()
  const notificationGenerationSuccess = await generateProactiveNotifications()
  const analyticsCleanupSuccess = await cleanupOldAnalyticsEvents()

  if (riskScoreUpdateSuccess && notificationGenerationSuccess && analyticsCleanupSuccess) {
    console.log("All maintenance tasks completed successfully.")
  } else {
    console.log("One or more maintenance tasks failed.")
  }
}

main()

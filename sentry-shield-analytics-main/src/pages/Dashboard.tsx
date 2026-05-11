import AlertsList from "../components/dashboard/AlertsList"
import StatsCard from "../components/dashboard/StatsCard"
import TopAttackers from "../components/dashboard/TopAttackersX"
import TrafficChart from "../components/dashboard/TrafficChart"
import TrafficPieChart from "../components/dashboard/TrafficPieChart"
import { getAlerts } from "../api/idsApi"
import { useEffect, useState } from "react"


import { ShieldAlert, ShieldCheck } from "lucide-react"

type Alert = {
  id: string
  type: "critical" | "warning" | "info"
  message: string
  source: string
  timestamp: string
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const result = await getAlerts()
        setAlerts(result)
      } catch (error) {
        console.error("Failed to load alerts", error)
      }
    }

    loadAlerts()
    const interval = setInterval(loadAlerts, 5000)

    return () => clearInterval(interval)
  }, [])

  const criticalCount = alerts.filter((alert) => alert.type === "critical").length
  const warningCount = alerts.filter((alert) => alert.type === "warning").length

  return (
    <div className="p-6 space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Critical Alerts"
          value={criticalCount}
          icon={<ShieldAlert className="text-red-500" />}
        />
        <StatsCard
          title="Warnings"
          value={warningCount}
          icon={<ShieldCheck className="text-green-500" />}
        />
        <StatsCard
          title="Critical Alerts"
          value={criticalCount}
          icon={<ShieldAlert className="text-red-500" />}
        />
        <StatsCard
          title="Warnings"
          value={warningCount}
          icon={<ShieldCheck className="text-green-500" />}
        />
      </div>

      {/* Charts + Attackers */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <TrafficChart />
        </div>

        <TrafficPieChart />

        <TopAttackers />
      </div>

      {/* Alerts */}
      <AlertsList />

    </div>
  )
}

import { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: number
  icon: ReactNode
}

export default function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>

      <div className="text-2xl font-bold mt-2">
        {value}
      </div>
    </div>
  )
}
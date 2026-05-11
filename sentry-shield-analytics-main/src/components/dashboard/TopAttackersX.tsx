import { useEffect, useState } from "react"

interface Attacker {
  ip: string
  count: number
}

export default function TopAttackers() {
  const [attackers, setAttackers] = useState<Attacker[]>([])

  useEffect(() => {
    const fetchAttackers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/top-attackers")
        const data = await res.json()
        setAttackers(data)
      } catch (err) {
        console.error("Error fetching attackers:", err)
      }
    }

    fetchAttackers()
    const interval = setInterval(fetchAttackers, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl border p-4 bg-card">
      <h2 className="text-lg font-semibold mb-2">Top Attacking IPs</h2>

      {attackers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attacks detected</p>
      ) : (
        <ul className="space-y-2">
          {attackers.map((attacker, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span>{attacker.ip}</span>
              <span className="text-red-500 font-semibold">
                {attacker.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
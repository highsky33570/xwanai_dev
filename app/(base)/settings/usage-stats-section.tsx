/**
 * 设置页面 - 使用统计部分
 */

"use client"

import { UsageStatsCard } from "@/components/usage/usage-stats-card"

export function UsageStatsSection() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">使用情况</h2>
        <p className="text-sm text-default-500 mb-4">
          查看您的各项功能使用情况和配额限制
        </p>
      </div>
      
      <UsageStatsCard />
    </div>
  )
}


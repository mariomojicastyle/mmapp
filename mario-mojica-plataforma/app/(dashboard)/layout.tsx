import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/topnav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="ml-[52px] flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

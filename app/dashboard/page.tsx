
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return <DashboardContent user={session?.user} />
}

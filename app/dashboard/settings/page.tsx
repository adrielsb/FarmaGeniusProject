
import { SettingsContent } from "@/components/dashboard/settings-content"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/login")
  }

  return <SettingsContent user={session.user} />
}

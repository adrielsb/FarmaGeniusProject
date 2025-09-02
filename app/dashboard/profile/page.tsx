
import { ProfileContent } from "@/components/dashboard/profile-content"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/login")
  }

  return <ProfileContent user={session.user} />
}

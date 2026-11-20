import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEvent, getRSVPCount, getRSVPs } from "@/lib/events";
import AdminDashboardClient from "@/app/components/AdminDashboard";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    redirect("/admin/login");
  }

  const [event, count, rsvps] = await Promise.all([getEvent(), getRSVPCount(), getRSVPs()]);

  return <AdminDashboardClient rsvps={rsvps} count={count} eventDate={event?.date ?? ""} eventVenue={event?.venue ?? ""} />;
}
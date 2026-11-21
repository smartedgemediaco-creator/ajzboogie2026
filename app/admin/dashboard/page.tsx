import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEvent, getRSVPs } from "@/lib/events";
import AdminDashboardClient from "@/app/components/AdminDashboard";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token) {
    redirect("/admin/login");
  }

  const [event, rsvps] = await Promise.all([getEvent(), getRSVPs()]);

  return (
    <AdminDashboardClient
      rsvps={rsvps}
      eventDate={event?.date ?? ""}
      eventVenue={event?.venue ?? ""}
      kicker={event?.kicker ?? ""}
    />
  );
}
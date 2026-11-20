import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — AJZ 2026",
};

export default function AdminPage() {
  redirect("/admin/login");
}
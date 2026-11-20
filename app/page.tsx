import { redirect } from "next/navigation";
import { EVENT_SLUG } from "@/lib/events";

export default function Home() {
  redirect(`/${EVENT_SLUG}`);
}
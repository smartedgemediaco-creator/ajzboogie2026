"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, Save } from "lucide-react";
import type { RSVP } from "@/lib/events";

interface AdminDashboardClientProps {
  rsvps: RSVP[];
  count: number;
  eventDate: string;
  eventVenue: string;
}

export default function AdminDashboardClient({ rsvps, count, eventDate, eventVenue }: AdminDashboardClientProps) {
  const router = useRouter();
  const [dateInput, setDateInput] = useState(eventDate);
  const [venueInput, setVenueInput] = useState(eventVenue);
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [rsvpList, setRsvpList] = useState(rsvps);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const body: { date: string; venue?: string } = { date: dateInput };
      if (venueInput && !venueInput.toLowerCase().includes("enter event location")) {
        body.venue = venueInput;
      }

      const res = await fetch("/api/admin/event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setMessageType("success");
        setMessage("Event details updated.");
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to update event details.");
      }
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setInviting(true);

    try {
      const res = await fetch("/api/admin/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          phone: invitePhone.trim(),
          email: inviteEmail.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessageType("success");
        setMessage(`${inviteName} has been invited.`);
        setInviteName("");
        setInvitePhone("");
        setInviteEmail("");
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to invite guest.");
      }
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeRSVP = async (id: string) => {
    setRevokeId(id);
  };

  const handleConfirmRevoke = async () => {
    if (!revokeId) return;

    setMessage("");

    try {
      const res = await fetch(`/api/admin/rsvp/${revokeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessageType("success");
        setMessage("Invite revoked.");
        setRsvpList(rsvpList.filter((r) => r.id !== revokeId));
      } else {
        setMessageType("error");
        setMessage("Failed to revoke invite.");
      }
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setRevokeId(null);
    }
  };

  const handleCancelRevoke = () => {
    setRevokeId(null);
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-[#f5efe6]">
      <header className="border-b border-gray-800 bg-[#161520]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 cursor-pointer hover:text-gray-300 transition-colors text-gray-400" onClick={() => router.push("/")} />
              <h1 className="text-xl font-serif font-light tracking-tight">Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs tracking-widest uppercase text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-light tracking-tight mb-4">RSVP Management</h2>
          <p className="text-gray-400 text-sm">
            Manage guest responses for AJZ 2026
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${messageType === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {message}
          </div>
        )}

        {/* Invite Guest */}
        <div className="bg-[#161520] border border-gray-800 rounded-xl p-6 mb-8 min-w-0">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Invite Guest</p>
                <p className="text-lg font-serif font-light">Personally invite a guest</p>
              </div>
            </div>
            <form onSubmit={handleInviteGuest} className="flex flex-col gap-3 w-full min-w-0">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name"
                className="w-full min-w-0 bg-[#1a1922] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full min-w-0 bg-[#1a1922] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full min-w-0 bg-[#1a1922] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <button
                type="submit"
                disabled={inviting}
                className="w-full min-w-0 bg-[#d4af37] hover:bg-[#c49a2a] disabled:bg-gray-700 text-[#0b0d13] font-medium tracking-widest uppercase text-xs py-3 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? "Inviting…" : "Invite"}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-[#161520] border border-gray-800 rounded-xl p-6 mb-8 min-w-0">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Event Date</p>
                <p className="text-lg font-serif font-light">{dateInput || "To be announced"}</p>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Event Venue</p>
                <p className="text-lg font-serif font-light">{venueInput || "To be announced"}</p>
              </div>
            </div>
            <form onSubmit={handleSaveDate} className="flex flex-col gap-3 w-full min-w-0">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full min-w-0 bg-[#1a1922] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition-colors"
              />
              <input
                type="text"
                value={venueInput}
                placeholder={
                  !venueInput ||
                  venueInput.toLowerCase().includes("to be announced") ||
                  venueInput.toLowerCase().includes("tbd")
                    ? "enter event location"
                    : "e.g. The Grand Ballroom, Eko Hotel, Lagos"
                }
                onChange={(e) => setVenueInput(e.target.value)}
                className="w-full min-w-0 bg-[#1a1922] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition-colors"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full min-w-0 bg-[#d4af37] hover:bg-[#c49a2a] disabled:bg-gray-700 text-[#0b0d13] font-medium tracking-widest uppercase text-xs py-3 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? "Saving…" : (<><Save className="h-4 w-4" /><span>Set Details</span></>)}
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#161520] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Total Confirmed</p>
                <p className="text-3xl font-serif font-light">{count}</p>
              </div>
                <div className="p-3 bg-gray-500/10 rounded-lg text-gray-300">
                  <User className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-[#161520] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Event Date</p>
                <p className="text-lg font-serif font-light">{dateInput || "TBD"}</p>
              </div>
              <div className="p-3 bg-gray-500/10 rounded-lg text-gray-300">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-[#161520] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Venue</p>
                <p className="text-sm font-serif font-light">{venueInput || "TBD"}</p>
              </div>
              <div className="p-3 bg-gray-500/10 rounded-lg text-gray-300">
                <Mail className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-[#161520] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Status</p>
                <p className="text-sm text-green-400 font-medium">Live</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#161520] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-6 py-4 text-xs tracking-widest uppercase text-gray-400 font-medium">
                  Guest Name
                </th>
                <th className="px-6 py-4 text-xs tracking-widest uppercase text-gray-400 font-medium">
                  Phone
                </th>
                <th className="px-6 py-4 text-xs tracking-widest uppercase text-gray-400 font-medium">
                  Email
                </th>
                <th className="px-6 py-4 text-xs tracking-widest uppercase text-gray-400 font-medium">
                  RSVP Time
                </th>
                <th className="px-6 py-4 text-xs tracking-widest uppercase text-gray-400 font-medium">
                  Status
                </th>
                <th className="px-6 py-4 text-xs tracking-widest uppercase text-gray-400 font-medium">
                  Action
                </th>
                </tr>
              </thead>
              <tbody>
                {rsvpList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No RSVPs yet.
                    </td>
                  </tr>
                ) : (
                  rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-300">
                        {rsvp.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {rsvp.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {rsvp.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rsvp.createdAt ? (
                          <>
                            <span className="text-[#d4af37] font-medium">
                              {new Date(rsvp.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-400 font-medium">
                        Accepted
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRevokeRSVP(rsvp.id)}
                          className="text-xs text-red-400 hover:text-red-300 underline hover:underline"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Revoke Confirmation Modal */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleCancelRevoke}>
          <div className="bg-[#161520] border border-gray-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Revoke Invite</p>
            <p className="text-sm text-gray-300 mb-6">Are you sure you want to revoke this invite? This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelRevoke}
                className="flex-1 py-3 rounded-xl text-xs text-gray-400 uppercase tracking-widest border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="flex-1 py-3 rounded-xl text-xs text-[#0b0d13] uppercase tracking-widest bg-[#d4af37] hover:bg-[#c49a2a] transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
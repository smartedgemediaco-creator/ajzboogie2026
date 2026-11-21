"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Inbox,
  LogOut,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { RSVP } from "@/lib/events";

interface AdminDashboardClientProps {
  rsvps: RSVP[];
  eventDate: string;
  eventVenue: string;
  kicker: string;
}

type StatusFilter = "all" | "confirmed" | "pending";
type Toast = { id: number; text: string; tone: "success" | "error" };

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#11111a] px-4 py-3 text-sm text-[#f5efe6] outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-[#d4af37]/70 focus:ring-2 focus:ring-[#d4af37]/10";

const goldButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b0d13] transition hover:bg-[#e7c65a] hover:shadow-[0_0_24px_rgba(212,175,55,0.25)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none";

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#1a1923] to-[#14131b] shadow-[0_16px_50px_rgba(0,0,0,0.25)]";

const formatDate = (value?: Date | string | null) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AdminDashboardClient({
  rsvps,
  eventDate,
  eventVenue,
  kicker,
}: AdminDashboardClientProps) {
  const router = useRouter();

  const [rsvpList, setRsvpList] = useState(rsvps);
  const [dateInput, setDateInput] = useState(eventDate);
  const [venueInput, setVenueInput] = useState(eventVenue);
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [smsId, setSmsId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (!token) router.push("/admin/login");
  }, [router]);

  const notify = (text: string, tone: "success" | "error" = "success") => {
    const id = toastId.current++;
    setToasts((current) => [...current, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  };

  const confirmed = rsvpList.filter((guest) => guest.accepted).length;
  const pending = rsvpList.length - confirmed;
  const delivered = rsvpList.filter((guest) => guest.smsSent).length;
  const responseRate = rsvpList.length ? Math.round((confirmed / rsvpList.length) * 100) : 0;

  const visibleGuests = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rsvpList
      .filter((guest) => status === "all" || (status === "confirmed" ? guest.accepted : !guest.accepted))
      .filter(
        (guest) =>
          !search ||
          guest.name.toLowerCase().includes(search) ||
          guest.phone.toLowerCase().includes(search)
      )
      .sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return newestFirst ? diff : -diff;
      });
  }, [rsvpList, query, status, newestFirst]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
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
        notify("Event details updated.");
        router.refresh();
      } else {
        notify(data.error || "Failed to update event details.", "error");
      }
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const res = await fetch("/api/admin/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inviteName.trim(), phone: invitePhone.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setRsvpList((current) => [data.rsvp as RSVP, ...current]);
        notify(`${inviteName.trim()} added to the guest list.`);
        setInviteName("");
        setInvitePhone("");
        router.refresh();
      } else {
        notify(data.error || "Failed to invite guest.", "error");
      }
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeId) return;
    const guest = rsvpList.find((rsvp) => rsvp.id === revokeId);
    setRevokeId(null);

    try {
      const res = await fetch(`/api/admin/rsvp/${revokeId}`, { method: "DELETE" });

      if (res.ok) {
        setRsvpList((current) => current.filter((rsvp) => rsvp.id !== revokeId));
        notify(guest ? `${guest.name} removed from the guest list.` : "Invite revoked.");
        router.refresh();
      } else {
        notify("Failed to revoke invite.", "error");
      }
    } catch {
      notify("Something went wrong. Please try again.", "error");
    }
  };

  const handleSendSMS = async (guest: RSVP) => {
    setSmsId(guest.id);

    try {
      const res = await fetch(`/api/admin/rsvp/${guest.id}/sms`, { method: "PATCH" });

      if (res.ok) {
        setRsvpList((current) =>
          current.map((rsvp) => (rsvp.id === guest.id ? { ...rsvp, smsSent: true } : rsvp))
        );
        notify(`SMS invite sent to ${guest.name}.`);
      } else {
        const data = await res.json().catch(() => null);
        notify(data?.error || "Failed to send SMS.", "error");
      }
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setSmsId(null);
    }
  };

  const handleCopyLink = async (guest: RSVP) => {
    const link = `${window.location.origin}/ajzboogie-2026?invite=1&phone=${encodeURIComponent(guest.phone)}`;

    try {
      await navigator.clipboard.writeText(link);
      notify(`Invite link copied for ${guest.name}.`);
    } catch {
      notify("Could not copy the invite link.", "error");
    }
  };

  const handleExport = () => {
    if (!visibleGuests.length) {
      notify("There are no guests to export.", "error");
      return;
    }

    const rows = [
      ["Name", "Phone", "RSVP Date", "Status", "SMS"],
      ...visibleGuests.map((guest) => [
        guest.name,
        guest.phone,
        new Date(guest.createdAt).toISOString(),
        guest.accepted ? "Confirmed" : "Pending",
        guest.smsSent ? "Sent" : "Pending",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ajz-2026-guests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`${visibleGuests.length} guest${visibleGuests.length === 1 ? "" : "s"} exported.`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    notify("Guest list refreshed.");
    window.setTimeout(() => setRefreshing(false), 700);
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  const stats = [
    {
      label: "Confirmed",
      value: confirmed,
      hint: `${pending} awaiting response`,
      icon: CheckCircle2,
      accent: "text-[#d4af37]",
      glow: "bg-[#d4af37]/10 text-[#d4af37]",
    },
    {
      label: "Invited guests",
      value: rsvpList.length,
      hint: "Total on the guest list",
      icon: Users,
      accent: "text-white",
      glow: "bg-white/5 text-white/60",
    },
    {
      label: "SMS sent",
      value: delivered,
      hint: `${rsvpList.length - delivered} still to send`,
      icon: MessageCircle,
      accent: "text-emerald-300",
      glow: "bg-emerald-400/10 text-emerald-300",
    },
    {
      label: "Response rate",
      value: `${responseRate}%`,
      hint: "Guests who confirmed",
      icon: TrendingUp,
      accent: "text-white",
      glow: "bg-sky-400/10 text-sky-300",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d13] text-[#f5efe6] bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.12),transparent_38%)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0d13]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push("/")}
              aria-label="Back to invite"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg leading-none tracking-wide">AJZ 2026</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.35em] text-[#d4af37]/70">Admin console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
            <button
              onClick={handleRefresh}
              title="Refresh guest list"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <a
              href="/ajzboogie-2026"
              target="_blank"
              rel="noreferrer"
              title="Preview invite"
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:border-[#d4af37]/40 hover:text-[#d4af37] sm:flex"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55 transition hover:border-red-400/30 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#d4af37]">
              <span className="h-px w-8 bg-[#d4af37]/60" />
              Command center
            </p>
            <h1 className="font-serif text-3xl font-light tracking-tight sm:text-4xl">
              Guest management
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
              {kicker || "Every response, invite and event detail in one place."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white/65 transition hover:border-[#d4af37]/40 hover:text-[#d4af37]">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button onClick={handleRefresh} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white/65 transition hover:border-[#d4af37]/40 hover:text-[#d4af37]">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`${cardClass} group p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#d4af37]/25 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.glow}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">Live</span>
                </div>
                <p className={`mt-5 font-serif text-3xl leading-none ${stat.accent}`}>{stat.value}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">{stat.label}</p>
                <p className="mt-1 truncate text-[11px] text-white/30">{stat.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className={`${cardClass} min-w-0 overflow-hidden`}>
            <div className="border-b border-white/[0.06] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-light">Guest list</h2>
                  <p className="mt-1 text-xs text-white/40">
                    {visibleGuests.length} of {rsvpList.length} guests shown
                  </p>
                </div>
                <button
                  onClick={() => setNewestFirst((current) => !current)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/50 transition hover:text-[#d4af37]"
                >
                  {newestFirst ? "Newest first" : "Oldest first"}
                  <ArrowUpRight className={`h-3 w-3 transition-transform ${newestFirst ? "" : "rotate-180"}`} />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or phone…"
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-[#11111a] p-1">
                  {(["all", "confirmed", "pending"] as StatusFilter[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setStatus(option)}
                      className={`rounded-lg px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition ${
                        status === option
                          ? "bg-[#d4af37]/15 text-[#d4af37]"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {visibleGuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/30">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="mt-4 font-serif text-lg">No guests found</p>
                <p className="mt-1 max-w-xs text-xs text-white/35">
                  {rsvpList.length
                    ? "Try a different search or status filter."
                    : "Add your first guest using the quick invite panel."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.015] text-[9px] uppercase tracking-[0.2em] text-white/35">
                      <th className="px-6 py-4 font-medium">Guest</th>
                      <th className="px-4 py-4 font-medium">Phone</th>
                      <th className="px-4 py-4 font-medium">RSVP date</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Invite</th>
                      <th className="px-6 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGuests.map((guest) => (
                      <tr
                        key={guest.id}
                        className="border-b border-white/[0.04] transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 font-serif text-sm text-[#d4af37]">
                              {guest.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white/85">{guest.name}</p>
                              <p className="mt-0.5 text-[10px] text-white/30">AJZ 2026</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-white/55">{guest.phone}</td>
                        <td className="px-4 py-4 text-xs text-white/45">{formatDate(guest.createdAt)}</td>
                        <td className="px-4 py-4">
                          {guest.accepted ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                              <Check className="h-3 w-3" /> Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">
                              <Clock3 className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {guest.smsSent ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                            </span>
                          ) : (
                            <span className="text-[11px] text-white/30">Not sent</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopyLink(guest)}
                              title="Copy invite link"
                              aria-label="Copy invite link"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/5 hover:text-[#d4af37]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendSMS(guest)}
                              disabled={guest.smsSent || smsId === guest.id}
                              title="Send SMS invite"
                              aria-label="Send SMS invite"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-emerald-400/10 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/35"
                            >
                              <Send className={`h-3.5 w-3.5 ${smsId === guest.id ? "animate-pulse" : ""}`} />
                            </button>
                            <button
                              onClick={() => setRevokeId(guest.id)}
                              title="Remove guest"
                              aria-label="Remove guest"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-red-400/10 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-light">Quick invite</h2>
                  <p className="text-[11px] text-white/40">Add a guest to the list</p>
                </div>
              </div>

              <form onSubmit={handleInviteGuest} className="mt-5 space-y-3">
                <div>
                  <label className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Guest name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Tunde Adebayo"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    required
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={inviting} className={`${goldButtonClass} w-full`}>
                  <UserPlus className="h-3.5 w-3.5" />
                  {inviting ? "Adding…" : "Add guest"}
                </button>
              </form>
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-light">Event setup</h2>
                  <p className="text-[11px] text-white/40">Update invited details</p>
                </div>
              </div>

              <form onSubmit={handleSaveEvent} className="mt-5 space-y-3">
                <div>
                  <label className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Date
                  </label>
                  <input
                    type="date"
                    value={
                      dateInput &&
                      !dateInput.toLowerCase().includes("to be announced") &&
                      !dateInput.toLowerCase().includes("tbd")
                        ? dateInput
                        : ""
                    }
                    onChange={(e) => setDateInput(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={venueInput}
                    onChange={(e) => setVenueInput(e.target.value)}
                    placeholder="Enter event location"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={saving} className={`${goldButtonClass} w-full`}>
                  <Check className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save details"}
                </button>
              </form>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/[0.09] via-[#161520] to-[#14131b] p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#d4af37]/10 blur-2xl" />
              <p className="relative text-[9px] uppercase tracking-[0.3em] text-[#d4af37]">Event snapshot</p>
              <h3 className="relative mt-2 font-serif text-2xl font-light">AJZ 2026</h3>
              <div className="relative mt-4 space-y-2 text-xs text-white/50">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-[#d4af37]/70" />
                  {eventDate || "To be announced"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#d4af37]/70" />
                  {eventVenue || "To be announced"}
                </p>
              </div>
              <a
                href="/ajzboogie-2026"
                target="_blank"
                rel="noreferrer"
                className="relative mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#d4af37] transition hover:text-[#e7c65a]"
              >
                Preview invite <ArrowUpRight className="h-3 w-3" />
              </a>
            </section>
          </aside>
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl ${
              toast.tone === "success"
                ? "border-emerald-400/20 bg-[#111a17]/95 text-emerald-200"
                : "border-red-400/20 bg-[#1a1113]/95 text-red-200"
            }`}
          >
            <span className="flex-1">{toast.text}</span>
            <button
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              aria-label="Dismiss notification"
              className="text-white/40 transition hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {revokeId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setRevokeId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#17161f] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-xl font-light">Remove this guest?</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              {rsvpList.find((guest) => guest.id === revokeId)?.name} will be removed from the guest list. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRevokeId(null)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="flex-1 rounded-xl bg-red-500/90 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

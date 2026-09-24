"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setCount(data.unreadCount ?? 0);
    } catch {
      // silencieux en cas d'erreur
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Poll toutes les 30 secondes pour les nouvelles notifications
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    const supabase = createClient();
    if (count > 0) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
    }
    setCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (!open) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-[2px] transition-colors hover:bg-paper/10"
          aria-label={`Notifications ${count > 0 ? count + " non lues" : ""}`}
        >
          <Bell className="h-5 w-5 text-steel/60" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold text-[0.5625rem] font-bold text-ink">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[2px] border border-paper/10 bg-ink shadow-xl sm:w-96">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
          <span className="t-meta text-sm text-paper">Notifications</span>
          {count > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-ochre hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Liste */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-steel/50">Chargement…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-steel/50">
              Aucune notification pour le moment.
            </p>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper/5 ${
                  !notif.read ? "bg-paper/5" : ""
                }`}
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    !notif.read ? "bg-gold" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-paper">{notif.message}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-steel/50">
                    {new Date(notif.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-paper/10 px-4 py-2 text-center">
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-steel/60 hover:text-paper"
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}

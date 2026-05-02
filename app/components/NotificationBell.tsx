"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/client";

interface Notification {
  id: string;
  type: "like" | "comment";
  message: string;
  read: boolean;
  created_at: string;
  post_id: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data);
    };

    fetchNotifications();
  }, [userId]);

  // Suscripción a nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    if (!userId) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => (type === "like" ? "❤️" : "💬");

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "ahora";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  if (!userId) return null;

  return (
    <div className="relative">
      {/* Botón campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-foreground/10 rounded-full transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-card-bg border border-border rounded-xl shadow-xl z-50">
            {/* Header */}
            <div className="sticky top-0 bg-card-bg border-b border-border p-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Marcar como leídas
                </button>
              )}
            </div>

            {/* Lista */}
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-foreground/50">
                No tienes notificaciones
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 flex items-start gap-3 hover:bg-foreground/5 transition-colors ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="text-xl">{getIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{notification.message}</p>
                      <p className="text-xs text-foreground/50 mt-1">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Info, AlertTriangle, ShieldCheck } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const eventSource = new EventSource("/api/sse/notifications");
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "connected" && data.type !== "ping") {
        setNotifications((prev) => [data, ...prev]);
      }
    };

    eventSource.onerror = () => {
      console.debug("SSE disconnected, attempting native reconnect...");
      // Note: We do NOT call eventSource.close() here so the browser will automatically 
      // attempt to reconnect via its native retry logic.
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      markAllRead();
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "COURSE_REMOVED":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "REPORT_RESOLVED":
        return <ShieldCheck className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="p-2 rounded-full hover:bg-surface-2 transition-colors relative text-on-surface-variant hover:text-primary outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-surface shadow-glow-primary"></span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-1 border border-white/10 shadow-2xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="font-headline-md text-text-primary px-4 py-3 flex justify-between items-center border-b border-white/5">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm flex flex-col items-center">
                <Bell className="w-8 h-8 opacity-20 mb-2" />
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={(e) => {
                    if (!notif.read) markAsRead(notif.id, e);
                  }}
                  className={`flex gap-3 items-start p-3 hover:bg-surface-2 transition-colors cursor-pointer border-b border-white/5 last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'} line-clamp-1`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-text-muted whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

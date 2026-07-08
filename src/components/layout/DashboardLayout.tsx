import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Compass, LayoutDashboard, Plane, LogOut, BarChart3, Heart, MapPin, User, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ChatWidget } from "@/components/chat/ChatWidget";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Trips", to: "/trips", icon: Plane },
  { label: "Destinations", to: "/destinations", icon: MapPin },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Favorites", to: "/favorites", icon: Heart },
  { label: "Profile", to: "/profile", icon: User },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-border bg-card px-4 py-6">
        <div className="flex items-center gap-2 px-2 font-display text-lg font-semibold">
          <Compass className="h-5 w-5 text-accent" />
          VoyageAI
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <p className="truncate px-2 text-xs text-muted-foreground">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-end gap-2 border-b border-border px-8 py-3">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell />
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}

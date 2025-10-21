import { Home, Users, BookOpen, DoorOpen, GraduationCap, Calendar, Eye } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Teachers", url: "/manage/teachers", icon: Users },
  { title: "Subjects", url: "/manage/subjects", icon: BookOpen },
  { title: "Rooms", url: "/manage/rooms", icon: DoorOpen },
  { title: "Batches", url: "/manage/batches", icon: GraduationCap },
  { title: "Generate", url: "/generate", icon: Calendar },
  { title: "View Timetable", url: "/view", icon: Eye },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-6">
          <h2 className="text-xl font-bold text-sidebar-foreground">Academa Scheduler</h2>
          <p className="text-xs text-sidebar-foreground/70 mt-1">Timetable Generator</p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  BotMessageSquare,
  CalendarCheck,
  Home,
  LogOut,
  Trash2,
} from "lucide-react";

import { auth, signOut } from "@/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultSidebarOpen = sidebarState ? sidebarState === "true" : true;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  async function logout() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <a href="/bookings">
                  <Home />
                  <span>Resort Admin</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <a href="/bookings">
                      <CalendarCheck />
                      <span>Bookings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/bin">
                      <Trash2 />
                      <span>Recycle Bin</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/chatbot-management">
                      <BotMessageSquare />
                      <span>Chatbot Nodes</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <form action={logout}>
                <SidebarMenuButton type="submit">
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">Admin</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {session.user.email ?? session.user.name ?? "Signed in"}
            </p>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

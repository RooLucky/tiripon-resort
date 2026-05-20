import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LogOut } from "lucide-react";

import { auth, signOut } from "@/auth";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import {
  Sidebar,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
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
        <AdminSidebarNav />
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/80 bg-background/90 px-5 shadow-[0_1px_0_0_rgba(92,77,60,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="font-googlesansflex text-sm font-semibold uppercase tracking-[0.08em] text-olive">
              Admin Console
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {session.user.email ?? session.user.name ?? "Signed in"}
            </p>
          </div>
        </header>
        <div className="min-h-[calc(100dvh-4rem)] bg-[linear-gradient(180deg,oklch(0.985_0.008_84)_0%,oklch(0.95_0.015_80)_100%)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

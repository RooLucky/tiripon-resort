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

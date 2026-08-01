import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Dashboard from "./pages/Dashboard";
import ManageTeachers from "./pages/ManageTeachers";
import ManageSubjects from "./pages/ManageSubjects";
import ManageRooms from "./pages/ManageRooms";
import ManageBatches from "./pages/ManageBatches";
import ManageTimeslots from "./pages/ManageTimeslots";
import GenerateTimetable from "./pages/GenerateTimetable";
import ViewTimetable from "./pages/ViewTimetable";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, session }: { children: React.ReactNode; session: Session | null }) => {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              {session && <AppSidebar />}
              <div className="flex-1 flex flex-col">
                {session && (
                  <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
                    <SidebarTrigger />
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </header>
                )}
                <main className="flex-1">
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

                    <Route path="/" element={
                      <ProtectedRoute session={session}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/manage/teachers" element={
                      <ProtectedRoute session={session}>
                        <ManageTeachers />
                      </ProtectedRoute>
                    } />
                    <Route path="/manage/subjects" element={
                      <ProtectedRoute session={session}>
                        <ManageSubjects />
                      </ProtectedRoute>
                    } />
                    <Route path="/manage/rooms" element={
                      <ProtectedRoute session={session}>
                        <ManageRooms />
                      </ProtectedRoute>
                    } />
                    <Route path="/manage/batches" element={
                      <ProtectedRoute session={session}>
                        <ManageBatches />
                      </ProtectedRoute>
                    } />
                    <Route path="/manage/timeslots" element={
                      <ProtectedRoute session={session}>
                        <ManageTimeslots />
                      </ProtectedRoute>
                    } />
                    <Route path="/generate" element={
                      <ProtectedRoute session={session}>
                        <GenerateTimetable />
                      </ProtectedRoute>
                    } />
                    <Route path="/view" element={
                      <ProtectedRoute session={session}>
                        <ViewTimetable />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute session={session}>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

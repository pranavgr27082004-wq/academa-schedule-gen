import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import ManageTeachers from "./pages/ManageTeachers";
import ManageSubjects from "./pages/ManageSubjects";
import ManageRooms from "./pages/ManageRooms";
import ManageBatches from "./pages/ManageBatches";
import GenerateTimetable from "./pages/GenerateTimetable";
import ViewTimetable from "./pages/ViewTimetable";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-14 border-b border-border bg-background flex items-center px-4">
                <SidebarTrigger />
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/manage/teachers" element={<ManageTeachers />} />
                  <Route path="/manage/subjects" element={<ManageSubjects />} />
                  <Route path="/manage/rooms" element={<ManageRooms />} />
                  <Route path="/manage/batches" element={<ManageBatches />} />
                  <Route path="/generate" element={<GenerateTimetable />} />
                  <Route path="/view" element={<ViewTimetable />} />
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

export default App;

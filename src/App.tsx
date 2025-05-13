
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { InventoryProvider } from "./features/inventory/context/InventoryContext";
import { QuestsProvider } from "./features/quests/context/QuestsContext";
import { CombatProvider } from "./features/combat/context/CombatContext";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { initializeUserStats, addVerificationQuest, generateTimeBasedQuests } from "./utils/xpUtils";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MapExplorer from "./pages/MapExplorer";

const queryClient = new QueryClient();

// User Initialization Component
const UserInitializer = () => {
  const { user, updateCurrentUser } = useAuth();
  
  useEffect(() => {
    if (user) {
      let updatedUser = { ...user };
      let needsUpdate = false;
      
      // Make sure user has stats
      if (!user.stats) {
        updatedUser = initializeUserStats(updatedUser);
        needsUpdate = true;
      }
      
      // Check if user needs verification quest
      if (!user.achievements.some(a => a.achievementId === 'email-verification')) {
        updatedUser = addVerificationQuest(updatedUser);
        needsUpdate = true;
      }
      
      // Generate time-based quests
      updatedUser = generateTimeBasedQuests(updatedUser);
      
      // Update user if needed
      if (needsUpdate) {
        updateCurrentUser(updatedUser);
      }
    }
  }, [user]);
  
  return null;
};

const AppContent = () => (
  <>
    <UserInitializer />
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapExplorer />} />
        <Route path="/about" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <InventoryProvider>
        <QuestsProvider>
          <CombatProvider>
            <TooltipProvider>
              <AppContent />
            </TooltipProvider>
          </CombatProvider>
        </QuestsProvider>
      </InventoryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SnippetView from "./pages/SnippetView";
import Visualizer from "./pages/Visualizer";
import Developer from "./pages/Developer";
import Contributors from "./pages/Contributors";
import NotFound from "./pages/NotFound";
import CustomCursor from "@/components/CustomCursor"; // Import the cursor
import Docs from "./pages/Docs";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* The cursor sits above everything else */}
      <CustomCursor />
      
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/view/:id" element={<SnippetView />} />
          <Route path="/visualizer" element={<Visualizer />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/contributors" element={<Contributors />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
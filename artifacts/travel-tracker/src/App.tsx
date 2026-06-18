import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Nav from "@/components/nav";
import Dashboard from "@/pages/dashboard";
import Timeline from "@/pages/timeline";
import Visits from "@/pages/visits";
import NewVisit from "@/pages/new-visit";
import EditVisit from "@/pages/edit-visit";
import Stats from "@/pages/stats";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Nav />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/timeline" component={Timeline} />
          <Route path="/visits" component={Visits} />
          <Route path="/visits/new" component={NewVisit} />
          <Route path="/visits/:id/edit" component={EditVisit} />
          <Route path="/stats" component={Stats} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

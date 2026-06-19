import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Nav from "@/components/nav";
import Dashboard from "@/pages/dashboard";
import Timeline from "@/pages/timeline";
import Visits from "@/pages/visits";
import NewVisit from "@/pages/new-visit";
import EditVisit from "@/pages/edit-visit";
import Stats from "@/pages/stats";
import Countries from "@/pages/countries";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { isAdmin } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <Nav />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/timeline" component={Timeline} />
          <Route path="/visits" component={Visits} />
          <Route path="/stats" component={Stats} />
          <Route path="/countries" component={Countries} />
          <Route path="/login">
            {isAdmin ? <Redirect to="/" /> : <Login />}
          </Route>
          <Route path="/visits/new">
            <ProtectedRoute component={NewVisit} />
          </Route>
          <Route path="/visits/:id/edit">
            <ProtectedRoute component={EditVisit} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

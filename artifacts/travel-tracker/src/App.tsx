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
import Links from "@/pages/links";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Landing from "@/pages/landing";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isEditor } = useAuth();
  if (!isEditor) return <Redirect to="/login" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  const { session } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {session && <Nav />}
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/login">
            {session ? <Redirect to="/" /> : <Login />}
          </Route>
          <Route path="/register">
            {session ? <Redirect to="/" /> : <Register />}
          </Route>
          <Route path="/">
            {session ? <Dashboard /> : <Landing />}
          </Route>
          <Route path="/timeline">
            <ProtectedRoute component={Timeline} />
          </Route>
          <Route path="/visits">
            <ProtectedRoute component={Visits} />
          </Route>
          <Route path="/stats">
            <ProtectedRoute component={Stats} />
          </Route>
          <Route path="/countries">
            <ProtectedRoute component={Countries} />
          </Route>
          <Route path="/links">
            <ProtectedRoute component={Links} />
          </Route>
          <Route path="/users">
            <AdminRoute component={Users} />
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

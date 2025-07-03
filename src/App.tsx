import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Suspense, lazy } from "react";

// Critical pages loaded immediately (login, dashboard, notfound)
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Lazy load all other pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const CalendarInstructions = lazy(() => import("@/pages/CalendarInstructions"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Patients = lazy(() => import("@/pages/Patients"));
const Reservations = lazy(() => import("@/pages/Reservations"));
const Settings = lazy(() => import("@/pages/Settings"));
const Teams = lazy(() => import("@/pages/Teams"));
const DataVisualization = lazy(() => import("@/pages/DataVisualization"));
const PendingSubmissions = lazy(() => import("@/pages/PendingSubmissions"));
const Papers = lazy(() => import("@/pages/Papers"));
const BioBanks = lazy(() => import("@/pages/BioBanks"));
const DBS = lazy(() => import("@/pages/DBS"));
const Plaquettes = lazy(() => import("@/pages/Plaquettes"));
const TodoList = lazy(() => import("@/pages/TodoList"));
const ButtonProject = lazy(() => import("@/pages/ButtonProject"));
const Finance = lazy(() => import("@/pages/Finance"));

// Lazy load heavy components
const PaperDetail = lazy(() => import("@/components/papers/PaperDetail").then(module => ({ default: module.PaperDetail })));

// Fast loading component for lazy-loaded routes
const PageSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Reusable protected route wrapper to reduce bundle size and improve performance
const ProtectedPageRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => (
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={allowedRoles}>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </RoleProtectedRoute>
  </ProtectedRoute>
);

// Optimized React Query configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
      refetchOnMount: false, // Only refetch if data is stale
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const { showRoleSelection, currentUser, onRoleSelected, loading } = useAuth();

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Critical route - Dashboard loaded immediately */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['president', 'admin', 'lab', 'general_director', 'manager', 'field', 'front_desk', 'financial']}>
              <Dashboard />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } />
        
        {/* Lazy-loaded Protected Routes - Super Fast Loading */}
        <Route path="/todo-list" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab', 'general_director', 'manager', 'field', 'front_desk', 'financial']}>
            <TodoList />
          </ProtectedPageRoute>
        } />
        
        <Route path="/patients" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab', 'field']}>
            <Patients />
          </ProtectedPageRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'financial', 'general_director', 'manager']}>
            <Inventory />
          </ProtectedPageRoute>
        } />
        
        <Route path="/papers" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin']}>
            <Papers />
          </ProtectedPageRoute>
        } />
        
        <Route path="/bio-banks" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab']}>
            <BioBanks />
          </ProtectedPageRoute>
        } />
        
        <Route path="/dbs" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab']}>
            <DBS />
          </ProtectedPageRoute>
        } />
        
        <Route path="/plaquettes" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab']}>
            <Plaquettes />
          </ProtectedPageRoute>
        } />
        
        <Route path="/calendar" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'financial', 'general_director', 'manager']}>
            <Calendar />
          </ProtectedPageRoute>
        } />
        
        <Route path="/calendar-instructions" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'financial', 'general_director', 'manager']}>
            <CalendarInstructions />
          </ProtectedPageRoute>
        } />
        
        <Route path="/reservations" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'financial', 'lab']}>
            <Reservations />
          </ProtectedPageRoute>
        } />
        
        <Route path="/finance" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'financial', 'general_director', 'manager']}>
            <Finance />
          </ProtectedPageRoute>
        } />
        
        <Route path="/teams" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'general_director', 'manager', 'front_desk']}>
            <Teams />
          </ProtectedPageRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin']}>
            <Settings />
          </ProtectedPageRoute>
        } />
        
        <Route path="/data-visualization" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab']}>
            <DataVisualization />
          </ProtectedPageRoute>
        } />
        
        <Route path="/pending-submissions" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'lab']}>
            <PendingSubmissions />
          </ProtectedPageRoute>
        } />
        
        <Route path="/papers/:id" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin']}>
            <PaperDetail />
          </ProtectedPageRoute>
        } />
        
        <Route path="/button-project" element={
          <ProtectedPageRoute allowedRoles={['president', 'admin', 'general_director', 'manager', 'field', 'front_desk', 'financial']}>
            <ButtonProject />
          </ProtectedPageRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Role Selection Dialog */}
      {showRoleSelection && currentUser && (
        <RoleSelectionDialog 
          open={showRoleSelection}
          userId={currentUser.id}
          onRoleSelected={onRoleSelected}
        />
      )}
      
      <Toaster />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

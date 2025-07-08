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
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </RoleProtectedRoute>
  </ProtectedRoute>
);

// Optimized React Query configuration for background loading and optimistic updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness settings
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time
      
      // Retry configuration with smart error handling
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx client errors (bad request, unauthorized, etc.)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Don't retry on network errors after 2 attempts
        if (error?.message?.includes('Network Error') && failureCount >= 2) {
          return false;
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      
      // Background refetching settings
      refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: 'always', // Always refetch on component mount for fresh data
      
      // Background loading optimizations
      placeholderData: (previousData) => previousData, // Show stale data while loading
      
      // Performance optimizations
      notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes
      structuralSharing: true, // Enable structural sharing for better performance
      
      // Query invalidation settings
      refetchInterval: false, // Disable automatic refetching intervals
    },
    mutations: {
      // Retry configuration for mutations
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
      
      // Optimistic updates configuration
      onMutate: async (variables) => {
        // Cancel any outgoing refetches to avoid overwriting optimistic update
        await queryClient.cancelQueries();
        
        // Return context with the snapshotted value for rollback
        return { 
          previousData: queryClient.getQueryData(['data']),
          timestamp: Date.now()
        };
      },
      
      onError: (err, variables, context: any) => {
        // Rollback optimistic update on error
        if (context?.previousData) {
          queryClient.setQueryData(['data'], context.previousData);
        }
        
        // Log error for debugging
        console.error('Mutation failed:', err);
      },
      
      onSuccess: (data, variables, context) => {
        // Invalidate and refetch related queries
        queryClient.invalidateQueries();
        
        // Show success notification
        console.log('Mutation successful:', data);
      },
      
      onSettled: (data, error, variables, context: any) => {
        // Always refetch after mutation settles (success or error)
        queryClient.invalidateQueries();
        
        // Clean up any temporary data
        if (context?.timestamp) {
          // Remove any temporary optimistic data older than 5 minutes
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          if (context.timestamp < fiveMinutesAgo) {
            queryClient.removeQueries();
          }
        }
      },
    },
  },
});

function AppContent() {
  const { showRoleSelection, currentUser, onRoleSelected, loading } = useAuth();

  // Show nothing while auth is initializing
  if (loading) {
    return null;
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

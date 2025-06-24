import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "./components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ThemeProvider } from "./components/theme-provider"
import AppRouter from "./routes/AppRouter"
import "./styles/globals.css"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="healthcare-ui-theme">
        <AppRouter />

        {/* Existing shadcn/ui Toaster */}
        <Toaster />

        {/* Sonner Toaster for notifications */}
        <SonnerToaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
            className: 'sonner-toast',
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BridgesReport } from './pages/BridgesReport.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'bridges-query-cache',
  throttleTime: 2_000,
})

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BridgesReport />} />
          <Route path="*" element={<BridgesReport />} />
        </Routes>
      </BrowserRouter>
    </PersistQueryClientProvider>
  )
}

import React from 'react';
import AppContent from '@/components/AppContent';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabaseClient';

const Root = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 🔥 récupérer session actuelle
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });

    // 🔥 écouter login / logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <App user={user} />
      <Toaster />
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
);
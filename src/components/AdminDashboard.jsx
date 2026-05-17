import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8 text-foreground">
      <div className="container mx-auto px-4">
        <Button onClick={() => navigate('/')} variant="ghost" className="mb-6 hover:bg-accent"><ArrowLeft size={20} className="mr-2" />Retour à l'accueil</Button>

        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center justify-center text-center py-20"
        >
          <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center mb-6">
            <Shield className="text-white" size={48} />
          </div>
          <h1 className="text-5xl font-bold">Espace Administrateur</h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Bienvenue dans votre tableau de bord. C'est ici que vous gérez la plateforme.
          </p>
          <p className="mt-2 text-muted-foreground">Cette page est prête à accueillir vos outils de gestion !</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleGoBack}
      className={`group flex items-center gap-2 pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-primary hover:bg-transparent mb-4 ${className}`}
    >
      <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
      <span className="font-medium">Retour</span>
    </Button>
  );
};

export default BackButton;
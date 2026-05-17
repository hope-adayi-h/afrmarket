import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VerificationCheckModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-xl text-center">Vérification requise</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Vous devez vérifier votre compte pour publier ou accéder à cette fonctionnalité.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Plus tard
          </Button>
          <Button 
            className="w-full sm:w-auto" 
            onClick={() => {
              onClose();
              navigate('/profile');
            }}
          >
            Vérifier maintenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
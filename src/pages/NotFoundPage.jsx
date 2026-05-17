import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-9xl font-black gradient-text">404</h1>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Page non trouvée</h2>
            <p className="mt-6 text-base leading-7 text-muted-foreground">Désolé, nous n'avons pas trouvé la page que vous recherchez.</p>
            <div className="mt-10">
                <Button asChild>
                    <Link to="/">Retour à l'accueil</Link>
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;
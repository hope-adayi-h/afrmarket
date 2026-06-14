import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SignupVideoPage = () => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'registration_video_url')
          .single();
        
        if (error) throw error;
        if (data && data.value) {
          setVideoUrl(data.value);
        }
      } catch (error) {
        console.error('Error fetching video URL:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, []);

  const getYoutubeEmbedId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderVideoPlayer = () => {
    if (!videoUrl) return null;

    const youtubeId = getYoutubeEmbedId(videoUrl);

    if (youtubeId) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="Tutoriel d'inscription"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black flex items-center justify-center">
        <video 
          src={videoUrl} 
          controls 
          className="w-full h-full object-contain"
          poster="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop"
        >
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Tutoriel d'Inscription - AFRMARKET</title>
        <meta name="description" content="Découvrez comment créer votre compte sur AFRMARKET avec notre tutoriel vidéo." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
              <ArrowLeft size={20} /> Retour à l'accueil
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <PlayCircle className="text-primary h-8 w-8" />
            Comment s'inscrire sur AFRMARKET
          </h1>
          <p className="text-muted-foreground">
            Suivez ce guide étape par étape pour créer votre compte et commencer à vendre ou acheter.
          </p>
        </div>

        <Card className="border-2 border-primary/10 overflow-hidden bg-card/50 backdrop-blur">
          <CardContent className="p-6 md:p-10">
            {loading ? (
              <div className="aspect-video flex items-center justify-center bg-muted/30 rounded-xl">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : videoUrl ? (
              renderVideoPlayer()
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center bg-muted/30 rounded-xl text-center p-6 space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold">Vidéo non disponible</h3>
                <p className="text-muted-foreground max-w-md">
                  Le tutoriel vidéo n'a pas encore été configuré. Veuillez consulter notre page d'aide ou contacter le support.
                </p>
                <Link to="/contact">
                  <Button>Contacter le support</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">1</div>
            <h3 className="font-semibold mb-2">Créez votre compte</h3>
            <p className="text-sm text-muted-foreground">Remplissez le formulaire avec vos informations personnelles.</p>
          </div>
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">2</div>
            <h3 className="font-semibold mb-2">Validez votre identité</h3>
            <p className="text-sm text-muted-foreground">Confirmez votre email ou numéro de téléphone pour sécuriser votre profil.</p>
          </div>
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">3</div>
            <h3 className="font-semibold mb-2">Publiez vos annonces</h3>
            <p className="text-sm text-muted-foreground">Commencez à vendre vos produits ou services en toute simplicité.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupVideoPage;
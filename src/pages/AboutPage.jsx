import React from 'react';
import { Helmet } from 'react-helmet';
import { Users, Target, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '@/components/BackButton';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>À propos de nous - AFRMARKET</title>
        <meta name="description" content="Découvrez l'histoire, la mission et les valeurs d'AFRMARKET, la plateforme leader de petites annonces en Afrique." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-muted/30 py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <BackButton />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Notre Mission</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Connecter les acheteurs et les vendeurs à travers l'Afrique pour créer des opportunités économiques accessibles à tous, en toute simplicité et sécurité.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-20 px-4 container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Communauté", desc: "Nous bâtissons une communauté forte basée sur la confiance et l'entraide." },
              { icon: Target, title: "Simplicité", desc: "Une expérience utilisateur fluide et intuitive pour tous nos utilisateurs." },
              { icon: Shield, title: "Sécurité", desc: "Votre sécurité est notre priorité absolue avec des vérifications rigoureuses." },
              { icon: Globe, title: "Accessibilité", desc: "Une plateforme ouverte à tous, partout en Afrique." }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-muted/30 py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <h2 className="text-3xl font-bold text-center mb-10">Notre Histoire</h2>
              <p>
                Fondé avec la vision de transformer le commerce en ligne en Afrique, AFRMARKET est né de la volonté de simplifier les échanges locaux. Nous avons constaté qu'il manquait une plateforme centralisée, fiable et moderne pour permettre aux Africains d'acheter et de vendre facilement.
              </p>
              <p>
                Depuis nos débuts, nous n'avons cessé d'innover pour offrir les meilleures fonctionnalités à nos utilisateurs : de la recherche géolocalisée à la messagerie instantanée sécurisée. Aujourd'hui, nous sommes fiers de faciliter des milliers de transactions chaque jour.
              </p>
              <p>
                L'avenir du e-commerce en Afrique est prometteur, et nous sommes déterminés à en être les acteurs principaux, en soutenant les petits entrepreneurs comme les particuliers dans leurs projets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
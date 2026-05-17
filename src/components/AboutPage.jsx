import React from 'react';
import { ArrowLeft, Target, Users, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const AboutPage = ({ onBack }) => {
  const values = [
    {
      icon: Target,
      title: 'Notre Mission',
      description: 'Faciliter les échanges commerciaux en Afrique en offrant une plateforme simple, sécurisée et accessible à tous.',
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Plus de 100,000 utilisateurs actifs à travers l\'Afrique font confiance à AFRMARKET pour leurs transactions.',
    },
    {
      icon: Shield,
      title: 'Sécurité',
      description: 'Protection des données et vérification des utilisateurs pour garantir des transactions en toute confiance.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Technologie de pointe pour une expérience utilisateur fluide et des fonctionnalités toujours plus performantes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            À propos d'AFRMARKET
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La plateforme de petites annonces qui révolutionne le commerce en Afrique
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Notre Histoire</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              AFRMARKET est née d'une vision simple : créer un espace où chaque Africain peut acheter, vendre et échanger facilement. Depuis notre lancement, nous avons connecté des millions de personnes à travers le continent, facilitant des milliers de transactions chaque jour.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Notre plateforme couvre tous les secteurs : de l'immobilier aux véhicules, de l'électronique à la mode, en passant par l'agriculture et les services professionnels. Nous sommes fiers d'être le partenaire de confiance des entrepreneurs, des familles et des particuliers dans toute l'Afrique.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center mb-6">
                  <Icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-green-500 rounded-2xl shadow-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Rejoignez-nous aujourd'hui</h2>
          <p className="text-xl mb-8 text-white/90">
            Faites partie de la plus grande communauté de commerce en Afrique
          </p>
          <Button
            onClick={onBack}
            className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Commencer maintenant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
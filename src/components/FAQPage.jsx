import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'Comment créer un compte sur AFRMARKET ?',
    answer: 'Cliquez sur le bouton "Se connecter" en haut de la page, puis sélectionnez "S\'inscrire". Remplissez le formulaire avec vos informations (nom, email, téléphone, mot de passe) et validez. Vous pouvez également vous inscrire via Google.',
  },
  {
    question: 'Comment publier une annonce ?',
    answer: 'Une fois connecté, cliquez sur "Publier une annonce" dans le menu. Remplissez tous les champs requis : titre, prix, catégorie, localisation, description et ajoutez une image. Validez pour publier votre annonce.',
  },
  {
    question: 'Est-ce que AFRMARKET est gratuit ?',
    answer: 'Oui, AFRMARKET est entièrement gratuit pour publier et consulter des annonces. Nous ne facturons aucun frais pour l\'utilisation de la plateforme.',
  },
  {
    question: 'Comment contacter un vendeur ?',
    answer: 'Sur chaque annonce, vous trouverez un bouton "Contacter via WhatsApp" ou "Envoyer un message". Cliquez dessus pour entrer en contact directement avec le vendeur.',
  },
  {
    question: 'Comment modifier ou supprimer mon annonce ?',
    answer: 'Allez dans "Mon profil" pour voir toutes vos annonces. Vous pouvez les modifier ou les supprimer en cliquant sur les boutons correspondants.',
  },
  {
    question: 'Comment signaler une annonce frauduleuse ?',
    answer: 'Si vous détectez une annonce suspecte, contactez-nous immédiatement via la page Contact. Notre équipe vérifiera et prendra les mesures nécessaires.',
  },
  {
    question: 'Puis-je vendre dans plusieurs pays ?',
    answer: 'Oui, AFRMARKET couvre toute l\'Afrique. Vous pouvez publier des annonces dans n\'importe quel pays africain en précisant la localisation.',
  },
  {
    question: 'Comment sécuriser mes transactions ?',
    answer: 'Privilégiez les rencontres en personne dans des lieux publics. Ne partagez jamais vos informations bancaires avant d\'avoir vérifié l\'article. Méfiez-vous des offres trop alléchantes.',
  },
];

const FAQPage = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Questions Fréquentes
          </h1>
          <p className="text-xl text-gray-600">
            Trouvez rapidement les réponses à vos questions
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800 text-left pr-4">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp className="text-orange-500 flex-shrink-0" size={24} />
                ) : (
                  <ChevronDown className="text-gray-400 flex-shrink-0" size={24} />
                )}
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-white/90 mb-6">
            Notre équipe support est là pour vous aider
          </p>
          <Button
            onClick={() => onBack()}
            className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Contactez-nous
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
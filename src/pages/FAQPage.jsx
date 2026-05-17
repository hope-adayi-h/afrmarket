import React from 'react';
import { Helmet } from 'react-helmet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import BackButton from '@/components/BackButton';

const FAQPage = () => {
  const faqs = [
    {
      question: "Comment publier une annonce ?",
      answer: "Pour publier une annonce, cliquez sur le bouton 'Publier une annonce' en haut à droite. Vous devrez créer un compte ou vous connecter. Ensuite, remplissez le formulaire avec les détails de votre article et ajoutez des photos."
    },
    {
      question: "Est-ce que c'est gratuit ?",
      answer: "Oui, la publication d'annonces standard est entièrement gratuite sur AFRMARKET. Nous proposons également des options payantes pour mettre en avant vos annonces."
    },
    {
      question: "Comment contacter un vendeur ?",
      answer: "Sur la page d'une annonce, vous trouverez un bouton 'Contacter' ou 'Envoyer un message'. Vous pouvez également voir le numéro de téléphone du vendeur si celui-ci a choisi de l'afficher."
    },
    {
      question: "Comment modifier mon annonce ?",
      answer: "Allez dans votre profil, section 'Mes Annonces'. Trouvez l'annonce que vous souhaitez modifier et cliquez sur le bouton 'Modifier'."
    },
    {
      question: "Comment signaler une annonce suspecte ?",
      answer: "Si vous voyez une annonce qui ne respecte pas nos règles ou qui semble frauduleuse, utilisez le bouton 'Signaler' présent sur la page de l'annonce. Notre équipe examinera le signalement rapidement."
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Questions Fréquentes - AFRMARKET</title>
        <meta name="description" content="Trouvez les réponses à vos questions sur l'utilisation d'AFRMARKET." />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <BackButton />
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Questions Fréquentes</h1>
            <p className="text-muted-foreground">Tout ce que vous devez savoir pour utiliser AFRMARKET.</p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-10">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;
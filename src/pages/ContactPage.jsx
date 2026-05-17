import React from 'react';
import { Helmet } from 'react-helmet';
import { Mail, Phone, MapPin, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import BackButton from '@/components/BackButton';

const ContactPage = () => {
  const { toast } = useToast();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander lors de votre prochaine requête ! 🚀",
      variant: "default",
    });
  };

  return (
    <>
      <Helmet>
        <title>Contactez-nous - AFRMARKET</title>
        <meta name="description" content="Contactez l'équipe AFRMARKET pour toute question, suggestion ou support. Nous sommes là pour vous aider." />
      </Helmet>

      <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-extrabold text-foreground mb-4">Contactez AFRMARKET</h1>
            <p className="text-xl text-muted-foreground">Nous sommes là pour vous aider. N'hésitez pas à nous contacter.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card p-8 rounded-2xl shadow-lg border border-border"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <MessageSquare size={24} className="text-primary" /> Envoyez-nous un message
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">Votre nom</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="Votre nom complet"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">Votre email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-2">Sujet</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="Sujet de votre message"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-2">Votre message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="Écrivez votre message ici..."
                    required
                  ></textarea>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 rounded-xl text-lg font-semibold shadow-lg"
                >
                  Envoyer le message
                </Button>
              </form>
            </motion.div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-card p-8 rounded-2xl shadow-lg border border-border"
              >
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <Phone size={24} className="text-primary" /> Informations de contact
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground">
                  <p className="flex items-center">
                    <Mail size={20} className="mr-3 text-orange-500" />
                    contact@afrmarket.com
                  </p>
                  <p className="flex items-center">
                    <Phone size={20} className="mr-3 text-orange-500" />
                    +221 77 123 45 67
                  </p>
                  <p className="flex items-start">
                    <MapPin size={20} className="mr-3 text-orange-500 flex-shrink-0 mt-1" />
                    Dakar, Sénégal
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-card p-8 rounded-2xl shadow-lg border border-border"
              >
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <Clock size={24} className="text-primary" /> ASSISTENCE
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground">
                  <p>Du lundi au vendredi: 9h00 - 18h00 (GMT)</p>
                  <p>Samedi: 10h00 - 14h00 (GMT)</p>
                  <p>Dimanche: Fermé</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      const subscribers = JSON.parse(localStorage.getItem('afrmarket_subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('afrmarket_subscribers', JSON.stringify(subscribers));
        toast({
          title: "Inscription réussie ! 🎉",
          description: "Vous recevrez nos dernières actualités et offres.",
        });
        setEmail('');
      } else {
        toast({
          title: "Déjà inscrit",
          description: "Cette adresse email est déjà dans notre liste.",
        });
      }
    }
  };

  return (
    <section className="py-16 gradient-bg pattern-bg">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Mail className="text-white" size={40} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Restez informé des meilleures offres
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Inscrivez-vous à notre newsletter et recevez les dernières annonces directement dans votre boîte mail
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-6 py-4 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white focus:outline-none transition-colors"
            />
            <Button
              type="submit"
              className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              S'inscrire
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
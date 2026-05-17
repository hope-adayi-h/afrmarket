import React from 'react';
import { NavLink } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
const Footer = ({
  onNavigate
}) => {
  return <footer className="bg-card border-t text-card-foreground pt-16 pb-8">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
             <NavLink to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                A
              </div>
              <span className="text-2xl font-extrabold tracking-tight">AFRMARKET</span>
            </NavLink>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La première plateforme de commerce en ligne dédiée à l'Afrique de l'Ouest. Achetez, vendez et échangez en toute sécurité.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-colors"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-colors"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-colors"><Twitter size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Navigation</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors">Accueil</button></li>
              <li><button onClick={() => onNavigate('listings')} className="hover:text-primary transition-colors">Toutes les annonces</button></li>
              <li><button onClick={() => onNavigate('blog')} className="hover:text-primary transition-colors">Blog & Conseils</button></li>
              <li><button onClick={() => onNavigate('abonnements')} className="hover:text-primary transition-colors flex items-center gap-2">Nos Offres <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">New</span></button></li>
              <li><button onClick={() => onNavigate('about')} className="hover:text-primary transition-colors">À propos de nous</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Support Client</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><button onClick={() => onNavigate('contact')} className="hover:text-primary transition-colors">Centre d'aide</button></li>
              <li><button onClick={() => onNavigate('faq')} className="hover:text-primary transition-colors">Questions fréquentes</button></li>
              <li><button onClick={() => onNavigate('conditions')} className="hover:text-primary transition-colors">Conditions d'utilisation</button></li>
              <li><button onClick={() => onNavigate('confidentialite')} className="hover:text-primary transition-colors">Politique de confidentialité</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Nous contacter</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Dakar, Sénégal<br />Sacré Cœur 3, VDN</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+228 96087237</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>support@afrmarket.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 border-t border-b border-border/50 mb-8">
             <div className="flex items-center justify-center gap-3 text-muted-foreground">
                 <ShieldCheck className="w-6 h-6 text-green-500" />
                 <span className="text-sm font-medium">Paiements Sécurisés</span>
             </div>
             <div className="flex items-center justify-center gap-3 text-muted-foreground">
                 <CreditCard className="w-6 h-6 text-blue-500" />
                 <span className="text-sm font-medium">Transaction Facile</span>
             </div>
             <div className="flex items-center justify-center gap-3 text-muted-foreground">
                 <Truck className="w-6 h-6 text-orange-500" />
                 <span className="text-sm font-medium">Livraison Rapide</span>
             </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AFRMARKET. Tous droits réservés.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;
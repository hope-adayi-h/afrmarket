import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Hero = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery, null);
  };

  return (
    <section className="relative min-h-[650px] flex items-center justify-center overflow-hidden py-20">
      <img className="absolute inset-0 w-full h-full object-cover z-0" alt="African cityscape with vibrant colors" src="https://images.unsplash.com/photo-1418844261040-c1a54e01d48b" />
      {/* Darkened overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="container mx-auto px-4 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-xl leading-tight">
            Achetez, Vendez <br className="hidden sm:block" /> & Échangez en Afrique
          </h1>
          <p className="text-xl sm:text-2xl text-white/95 mb-12 drop-shadow-md font-medium max-w-2xl mx-auto leading-relaxed">
            La plateforme d'annonces la plus populaire d'Afrique. Trouvez tout ce dont vous avez besoin près de chez vous.
          </p>

          <div className="glass-effect rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-orange-400 transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="Que recherchez-vous ?" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                  className="w-full pl-14 pr-4 py-4 sm:py-5 rounded-2xl border-2 border-white/10 bg-white/10 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-orange-500 focus:outline-none transition-all text-lg font-medium" 
                />
              </div>
              <div className="flex-1 relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-orange-400 transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="Localisation" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                  className="w-full pl-14 pr-4 py-4 sm:py-5 rounded-2xl border-2 border-white/10 bg-white/10 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-orange-500 focus:outline-none transition-all text-lg font-medium" 
                />
              </div>
              <Button 
                onClick={handleSearch} 
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 sm:py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-orange-500/25 transition-all transform hover:scale-[1.02] w-full md:w-auto min-h-[60px]"
              >
                Rechercher
              </Button>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {['Immobilier', 'Véhicules', 'Électronique', 'Mode', 'Emplois'].map(tag => (
              <button 
                key={tag} 
                onClick={() => onSearch(null, tag)}
                className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-base font-medium hover:bg-white/20 hover:border-white/40 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent z-10"></div>
    </section>
  );
};

export default Hero;
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Search, MapPin, ArrowRight, Filter, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Categories from '@/components/Categories';
import FeaturedListings from '@/components/FeaturedListings';

const HomePage = ({ onSearch, onListingClick, currentUser, onLikeToggle, forceUpdateKey, likedListingIds }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedListings();
  }, [forceUpdateKey]);

  const fetchFeaturedListings = async () => {
    try {
      setLoading(true);
      // Ensures only approved listings are shown on the public homepage.
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved') 
        .order('average_rating', { ascending: false, nullsFirst: false })
        .order('ratings_count', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setFeaturedListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 px-4 h-[700px] flex items-center justify-center overflow-hidden">
        <img className="absolute inset-0 w-full h-full object-cover z-0" alt="African cityscape with vibrant colors" src="https://images.unsplash.com/photo-1519396653448-212e3c1566aa" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10"></div> {/* Gradient overlay for depth */}
        
        <div className="container mx-auto relative z-20 max-w-5xl text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 relative inline-block"
          >
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 text-yellow-400 hidden md:block"
            >
              <Sparkles size={48} />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4 drop-shadow-2xl leading-tight sm:leading-none">
              Trouvez tout <br className="sm:hidden"/> ce qu'il vous <br className="sm:hidden"/> faut <br className="sm:hidden"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 filter drop-shadow-lg">
                sur AFR. MARKET
              </span>
            </h1>
            <div className="h-2 w-32 bg-orange-500 mx-auto rounded-full mt-6 shadow-[0_0_20px_rgba(249,115,22,0.6)]"></div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-gray-200 mb-12 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md px-2"
          >
            La référence pour acheter, vendre et échanger en toute confiance à travers l'Afrique.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="bg-white/10 backdrop-blur-md p-3 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 max-w-4xl mx-auto hover:bg-white/15 transition-all duration-300"
          >
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 p-1">
              <div className="flex-grow relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Search className="h-6 w-6 text-white/70 group-focus-within:text-orange-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Que cherchez-vous aujourd'hui ?"
                  className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-lg text-white placeholder:text-white/60 outline-none focus:bg-black/40 focus:ring-2 focus:ring-orange-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative md:w-1/3 group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <MapPin className="h-6 w-6 text-white/70 group-focus-within:text-orange-400 transition-colors" />
                 </div>
                <input
                  type="text"
                  placeholder="Localisation"
                  className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-lg text-white placeholder:text-white/60 outline-none focus:bg-black/40 focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>
              
              <Button type="submit" className="h-auto py-4 px-10 text-lg font-bold rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-105">
                Rechercher
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      <Categories onCategoryClick={(id) => onSearch(null, id)} />

      <section className="py-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
             <h2 className="text-3xl font-bold text-foreground">Annonces à la Une</h2>
             <p className="text-muted-foreground">Les annonces les mieux notées par notre communauté</p>
          </div>
          <Button variant="ghost" className="text-primary hover:bg-primary/10 font-medium" onClick={() => onSearch(null, null)}>
            Voir tout <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <FeaturedListings 
            listings={featuredListings} 
            onListingClick={onListingClick} 
            currentUser={currentUser}
            onLikeToggle={onLikeToggle}
            likedListingIds={likedListingIds}
          />
        )}
      </section>
      
      <section className="py-20 bg-gradient-to-b from-background to-orange-50/30 border-t border-border">
        <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
             <motion.div 
               whileHover={{ y: -5 }}
               className="p-8 bg-card rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-all"
             >
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <Filter size={32}/>
                </div>
                <h3 className="text-xl font-bold mb-3">Filtrage Intelligent</h3>
                <p className="text-muted-foreground leading-relaxed">Trouvez exactement ce que vous cherchez grâce à notre système de catégories précis.</p>
             </motion.div>
             <motion.div 
               whileHover={{ y: -5 }}
               className="p-8 bg-card rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-all"
             >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <MapPin size={32}/>
                </div>
                <h3 className="text-xl font-bold mb-3">Proximité Immédiate</h3>
                <p className="text-muted-foreground leading-relaxed">Découvrez les meilleures affaires disponibles juste à côté de chez vous.</p>
             </motion.div>
             <motion.div 
               whileHover={{ y: -5 }}
               className="p-8 bg-card rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-all"
             >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <Loader2 size={32}/>
                </div>
                <h3 className="text-xl font-bold mb-3">Publication Instantanée</h3>
                <p className="text-muted-foreground leading-relaxed">Publiez vos annonces en quelques secondes et connectez-vous avec des acheteurs.</p>
             </motion.div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
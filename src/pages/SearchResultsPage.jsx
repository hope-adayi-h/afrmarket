import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { Loader2, Filter, Search, Frown } from 'lucide-react';
import { categories } from '@/data/categories';
import FeaturedListings from '@/components/FeaturedListings';
import BackButton from '@/components/BackButton';

const SearchResultsPage = ({ onListingClick, currentUser, onLikeToggle, likedListingIds }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';

  const selectedCategory = categories.find(c => c.id === categoryId);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let supabaseQuery = supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (categoryId) {
          supabaseQuery = supabaseQuery.eq('category', categoryId);
        }

        if (query) {
          supabaseQuery = supabaseQuery.ilike('title', `%${query}%`); 
        }

        const { data, error } = await supabaseQuery;

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [query, categoryId]);

  const handleCategoryChange = (id) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set('category', id);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  return (
    <>
      <Helmet>
        <title>
          {query ? `Recherche : ${query}` : 'Annonces'} {selectedCategory ? `- ${selectedCategory.name}` : ''} | AFRMARKET
        </title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <BackButton />
          
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 sticky top-24">
                <div className="flex items-center gap-2 font-bold text-lg mb-4">
                  <Filter size={20} /> Filtres
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground tracking-wider">Catégories</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCategoryChange('')}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!categoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}`}
                      >
                        Toutes les catégories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${categoryId === cat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}`}
                        >
                          <cat.icon size={16} />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-grow">
              <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {categoryId ? (
                    <>
                       {selectedCategory?.icon && <selectedCategory.icon className="text-primary" />} 
                       {selectedCategory?.name}
                    </>
                  ) : (
                    query ? `Résultats pour "${query}"` : 'Toutes les annonces'
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {loading ? 'Recherche en cours...' : `${listings.length} annonce${listings.length !== 1 ? 's' : ''} trouvée${listings.length !== 1 ? 's' : ''}`}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : listings.length > 0 ? (
                <FeaturedListings 
                  listings={listings} 
                  onListingClick={onListingClick} 
                  currentUser={currentUser}
                  onLikeToggle={onLikeToggle}
                  likedListingIds={likedListingIds}
                />
              ) : (
                <div className="bg-card rounded-xl p-12 text-center border border-dashed border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Frown size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aucune annonce trouvée</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Nous n'avons trouvé aucune annonce correspondant à vos critères. Essayez une autre catégorie ou changez vos termes de recherche.
                  </p>
                  <button 
                    onClick={() => { setSearchParams({}); }}
                    className="mt-6 text-primary font-medium hover:underline"
                  >
                    Voir toutes les annonces
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResultsPage;
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { blogPosts } from '@/data/blogPosts';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import BackButton from '@/components/BackButton';

const BlogPage = () => {
  return (
    <>
      <Helmet>
        <title>Blog - AFRMARKET</title>
        <meta name="description" content="Découvrez les derniers articles, conseils et astuces sur l'achat, la vente et les tendances du marché en Afrique sur le blog AFRMARKET." />
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-foreground mb-4">Le Blog AFRMARKET</h1>
            <p className="text-xl text-muted-foreground">Conseils, astuces et actualités pour mieux acheter et vendre.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                   <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                   <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                     {post.category}
                   </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-xs text-muted-foreground mb-3 gap-4">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-3 text-card-foreground line-clamp-2 hover:text-primary transition-colors">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </h2>
                  
                  <p className="text-muted-foreground mb-6 line-clamp-3 text-sm flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <Link 
                    to={`/blog/${post.id}`} 
                    className="inline-flex items-center text-primary font-semibold hover:underline mt-auto"
                  >
                    Lire la suite <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPage;
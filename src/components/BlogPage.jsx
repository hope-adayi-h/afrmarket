import React from 'react';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { blogPosts } from '@/data/blogPosts';

const BlogPage = ({ onBack, onPostClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            Blog & Actualités
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Conseils, astuces et actualités du marché africain
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow cursor-pointer"
              onClick={() => onPostClick(post.id)}
            >
              <div className="h-56 w-full overflow-hidden">
                <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 hover:text-orange-500 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User size={16} className="mr-1" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
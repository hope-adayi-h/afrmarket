import React from 'react';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { blogPosts } from '@/data/blogPosts';

const BlogPostPage = ({ postId, onBack }) => {
  const post = blogPosts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex flex-col items-center justify-center text-center px-4">
         <h1 className="text-3xl font-bold text-red-500 mb-4">Article non trouvé</h1>
         <p className="text-gray-600 dark:text-gray-400 mb-6">Désolé, l'article que vous recherchez n'existe pas.</p>
         <Button
          onClick={onBack}
          variant="ghost"
          className="hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour au blog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour au blog
        </Button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            {post.title}
          </h1>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div className="flex items-center mr-4">
              <User size={16} className="mr-1" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-full object-cover" />
          </div>

          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </motion.article>
      </div>
    </div>
  );
};

export default BlogPostPage;
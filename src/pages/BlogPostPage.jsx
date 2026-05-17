import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { blogPosts } from '@/data/blogPosts';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';

const BlogPostPage = () => {
  const { postId } = useParams();
  const post = blogPosts.find(p => p.id === postId);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
        <Link to="/blog">
          <Button>Retour au blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} - Blog AFRMARKET</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
          <BackButton />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
             <div className="mb-8">
               <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                 {post.category}
               </span>
               <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                 {post.title}
               </h1>
               
               <div className="flex items-center gap-6 text-muted-foreground text-sm border-b border-border pb-8">
                 <div className="flex items-center gap-2">
                   <User size={16} />
                   <span>{post.author}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Calendar size={16} />
                   <span>{post.date}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Clock size={16} />
                   <span>{post.readTime}</span>
                 </div>
               </div>
             </div>

             <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
               <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover max-h-[500px]" />
             </div>

             <div className="prose prose-lg dark:prose-invert max-w-none">
               {/* This is a placeholder for actual rich text content. 
                   In a real app, this would likely be parsed from Markdown or HTML */}
               <div className="space-y-6 text-muted-foreground leading-relaxed">
                 <p className="text-xl font-medium text-foreground">
                   {post.excerpt}
                 </p>
                 
                 <p>
                   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                 </p>
                 
                 <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Pourquoi c'est important</h2>
                 <p>
                   Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                 </p>
                 
                 <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Nos conseils d'experts</h2>
                 <ul className="list-disc pl-6 space-y-2">
                   <li>Premier point important à considérer lors de votre achat ou vente.</li>
                   <li>Deuxième aspect crucial pour maximiser vos résultats sur AFRMARKET.</li>
                   <li>Troisième conseil pour garantir une transaction sécurisée.</li>
                 </ul>
                 
                 <p>
                   Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                 </p>
               </div>
             </div>
          </motion.div>
        </article>
      </div>
    </>
  );
};

export default BlogPostPage;
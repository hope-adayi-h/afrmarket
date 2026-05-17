import React from 'react';
import { categories } from '@/data/categories';
import { motion } from 'framer-motion';

const Categories = ({ onCategoryClick }) => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Parcourir par Catégorie</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onCategoryClick(category.id)}
                className="flex flex-col items-center justify-center p-6 bg-card hover:bg-accent hover:shadow-md rounded-xl border border-border transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-full ${category.bg} ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} />
                </div>
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{category.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
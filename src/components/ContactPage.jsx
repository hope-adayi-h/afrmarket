import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
const ContactPage = ({
  onBack
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const handleSubmit = e => {
    e.preventDefault();
    const messages = JSON.parse(localStorage.getItem('afrmarket_messages') || '[]');
    messages.push({
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('afrmarket_messages', JSON.stringify(messages));
    toast({
      title: "Message envoyé ! 📧",
      description: "Nous vous répondrons dans les plus brefs délais"
    });
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };
  return <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Button onClick={onBack} variant="ghost" className="mb-6 hover:bg-gray-100">
          <ArrowLeft size={20} className="mr-2" />
          Retour
        </Button>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Contactez-nous
          </h1>
          <p className="text-xl text-gray-600">
            Notre équipe est là pour vous aider
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.2
        }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors" placeholder="Votre nom" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors" placeholder="votre@email.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                <input type="text" required value={formData.subject} onChange={e => setFormData({
                ...formData,
                subject: e.target.value
              })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors" placeholder="Sujet de votre message" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea required value={formData.message} onChange={e => setFormData({
                ...formData,
                message: e.target.value
              })} rows={6} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none" placeholder="Votre message..." />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <Send size={20} className="mr-2" />
                Envoyer le message
              </Button>
            </form>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.3
        }} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Informations de contact</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                    <p className="text-gray-600">contact@afrmarket.com</p>
                    <p className="text-gray-600">support@afrmarket.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Téléphone</h3>
                    <p className="text-gray-600">+228 97512239</p>
                    <p className="text-gray-600"></p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Adresse</h3>
                    <p className="text-gray-600">Togo, Lomé</p>
                    <p className="text-gray-600"></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-green-500 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">ASSISTENCE </h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span>Lundi - Vendredi:</span>
                  <span className="font-semibold">8h - 18h</span>
                </p>
                <p className="flex justify-between">
                  <span>Samedi:</span>
                  <span className="font-semibold">9h - 14h</span>
                </p>
                <p className="flex justify-between">
                  <span>Dimanche:</span>
                  <span className="font-semibold">Fermé</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>;
};
export default ContactPage;
import React from 'react';
import { Helmet } from 'react-helmet';

const ConditionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Helmet>
        <title>Conditions d'utilisation - AFRMARKET</title>
        <meta name="description" content="Découvrez les conditions d'utilisation d'AFRMARKET, votre plateforme de petites annonces en Afrique. Informations importantes pour les utilisateurs." />
      </Helmet>

      <h1 className="text-4xl font-extrabold text-center text-primary mb-8">
        Conditions d'utilisation
      </h1>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          1. Introduction
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Bienvenue sur AFRMARKET ! En accédant ou en utilisant notre site web et nos services, vous acceptez d'être lié par les présentes Conditions d'utilisation, toutes les lois et réglementations applicables, et reconnaissez que vous êtes responsable du respect de toutes les lois locales applicables. Si vous n'êtes pas d'accord avec l'une de ces conditions, il vous est interdit d'utiliser ou d'accéder à ce site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          2. Utilisation du service
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          AFRMARKET est une plateforme de petites annonces en ligne. Vous devez avoir au moins 18 ans pour utiliser nos services. Vous vous engagez à ne pas utiliser le site à des fins illégales ou interdites par les présentes conditions. Toute information que vous soumettez sur le site doit être exacte, véridique et ne pas enfreindre les droits d'autrui.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          3. Comptes utilisateurs
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Lors de la création d'un compte, vous êtes responsable du maintien de la confidentialité de votre mot de passe et de votre compte, et êtes entièrement responsable de toutes les activités qui se produisent sous votre mot de passe ou votre compte. Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre mot de passe ou de votre compte ou de toute autre violation de la sécurité.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          4. Contenu des annonces
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Vous êtes seul responsable du contenu que vous publiez sur AFRMARKET. Le contenu doit être conforme à nos directives, y compris, mais sans s'y limiter, ne pas contenir de matériel offensant, illégal, trompeur ou portant atteinte aux droits de propriété intellectuelle d'autrui. Nous nous réservons le droit de supprimer tout contenu jugé inapproprié sans préavis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          5. Modifications des conditions
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          AFRMARKET se réserve le droit de modifier les présentes Conditions d'utilisation à tout moment. Toute modification entrera en vigueur dès sa publication sur le site. Votre utilisation continue du site après la publication de modifications constitue votre acceptation de ces modifications.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          6. Droit applicable
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Les présentes conditions sont régies et interprétées conformément aux lois du pays où AFRMARKET est enregistré, et vous vous soumettez irrévocablement à la juridiction exclusive des tribunaux de cet État ou de ce lieu.
        </p>
      </section>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Dernière mise à jour : 26 Novembre 2025
      </p>
    </div>
  );
};

export default ConditionsPage;
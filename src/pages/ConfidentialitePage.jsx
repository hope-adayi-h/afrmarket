import React from 'react';
import { Helmet } from 'react-helmet';

const ConfidentialitePage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Helmet>
        <title>Politique de confidentialité - AFRMARKET</title>
        <meta name="description" content="Découvrez la politique de confidentialité d'AFRMARKET. Apprenez comment nous collectons, utilisons et protégeons vos données personnelles." />
      </Helmet>

      <h1 className="text-4xl font-extrabold text-center text-primary mb-8">
        Politique de confidentialité
      </h1>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          1. Introduction
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          AFRMARKET s'engage à protéger la confidentialité de ses utilisateurs. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web et utilisez nos services. Veuillez lire attentivement cette politique. Si vous n'êtes pas d'accord avec les termes de cette politique de confidentialité, veuillez ne pas accéder au site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          2. Informations que nous collectons
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Nous pouvons collecter des informations vous concernant de diverses manières, y compris les informations que vous nous fournissez directement (par exemple, lors de l'inscription, la publication d'annonces, la communication avec d'autres utilisateurs) et les informations collectées automatiquement lorsque vous utilisez notre site (par exemple, adresse IP, type de navigateur, pages visitées).
        </p>
        <ul className="list-disc list-inside text-muted-foreground leading-relaxed mt-2">
          <li><strong>Données personnelles:</strong> Nom complet, adresse e-mail, numéro de téléphone, photos, informations de localisation.</li>
          <li><strong>Données dérivées:</strong> Informations que nos serveurs collectent automatiquement lorsque vous accédez au site, telles que votre adresse IP, votre type de navigateur, votre système d'exploitation, vos temps d'accès et les pages que vous avez consultées directement avant et après l'accès au site.</li>
          <li><strong>Données financières:</strong> Nous ne collectons pas d'informations financières sensibles directement. Toutes les transactions sont traitées par des prestataires de paiement tiers.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          3. Comment nous utilisons vos informations
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Les informations collectées à votre sujet peuvent être utilisées pour :
        </p>
        <ul className="list-disc list-inside text-muted-foreground leading-relaxed mt-2">
          <li>Créer et gérer votre compte.</li>
          <li>Fournir nos services et fonctionnalités.</li>
          <li>Vous envoyer des notifications liées au compte et aux annonces.</li>
          <li>Améliorer le site et nos services.</li>
          <li>Effectuer des analyses statistiques et des recherches.</li>
          <li>Prévenir les activités frauduleuses.</li>
          <li>Appliquer nos conditions d'utilisation.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          4. Divulgation de vos informations
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Nous pouvons partager les informations que nous avons collectées à votre sujet dans certaines situations. Vos informations peuvent être divulguées comme suit :
        </p>
        <ul className="list-disc list-inside text-muted-foreground leading-relaxed mt-2">
          <li><strong>Par la loi ou pour protéger les droits:</strong> Si nous pensons que la divulgation d'informations est nécessaire pour répondre à un processus légal, pour enquêter ou remédier à des violations potentielles de nos politiques, ou pour protéger les droits, la propriété et la sécurité d'autrui.</li>
          <li><strong>Fournisseurs de services tiers:</strong> Nous pouvons partager vos informations avec des tiers qui exécutent des services pour nous ou en notre nom, y compris l'hébergement de données, l'analyse de données, le service client et l'assistance marketing.</li>
          <li><strong>Autres utilisateurs:</strong> Lorsque vous publiez des annonces ou envoyez des messages via le site, certaines de vos informations (nom, numéro de téléphone, etc.) peuvent être visibles par d'autres utilisateurs.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          5. Sécurité de vos informations
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Nous utilisons des mesures de sécurité administratives, techniques et physiques pour aider à protéger vos informations personnelles. Bien que nous ayons pris des mesures raisonnables pour sécuriser les informations personnelles que vous nous fournissez, veuillez noter qu'aucune mesure de sécurité n'est parfaite ou impénétrable, et aucune méthode de transmission de données ne peut être garantie contre toute interception ou autre type d'abus.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-foreground mb-4">
          6. Modifications de cette politique
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Nous nous réservons le droit de modifier cette Politique de Confidentialité à tout moment et pour quelque raison que ce soit. Nous vous informerons de tout changement en mettant à jour la date de "Dernière mise à jour" de cette Politique de Confidentialité. Nous vous encourageons à consulter périodiquement cette Politique de Confidentialité pour rester informé des mises à jour.
        </p>
      </section>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Dernière mise à jour : 26 Novembre 2025
      </p>
    </div>
  );
};

export default ConfidentialitePage;
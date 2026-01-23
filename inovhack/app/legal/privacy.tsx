/**
 * Privacy Policy Page - RGPD Compliant
 * Politique de confidentialité conforme au RGPD
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
} from "../../constants/theme";

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Politique de confidentialité</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={styles.lastUpdated}>Dernière mise à jour : Janvier 2026</Text>

          {/* Important Notice */}
          <View style={styles.importantBox}>
            <Text style={styles.importantTitle}>Information importante</Text>
            <Text style={styles.importantText}>
              PACT traite des données sensibles (données de santé via Apple HealthKit et
              Google Fit) uniquement avec votre consentement explicite et dans le seul but
              de vérifier automatiquement vos objectifs personnels.
            </Text>
          </View>

          {/* Article 1 - Responsable du traitement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 1 - RESPONSABLE DU TRAITEMENT</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>1.1 Identité du responsable</Text>{"\n\n"}
              Le responsable du traitement des données personnelles est :{"\n\n"}
              <Text style={styles.bold}>PACT - PHILIPPE NICOLAS</Text>{"\n"}
              Entrepreneur individuel (Micro-entreprise){"\n"}
              1 rue de Madrid, 67310 Wasselonne, France{"\n"}
              SIRET : 938 048 071 00014{"\n"}
              TVA : FR13938048071{"\n"}
              RCS : 938 048 071 R.C.S. Saverne{"\n\n"}

              <Text style={styles.bold}>1.2 Contact Protection des Données</Text>{"\n\n"}
              Pour toute question relative à la protection des données personnelles :{"\n\n"}
              Email : hello@paact.app{"\n\n"}

              <Text style={styles.bold}>1.3 Autorité de contrôle</Text>{"\n\n"}
              L'autorité de contrôle compétente est la Commission Nationale de
              l'Informatique et des Libertés (CNIL) :{"\n"}
              3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07{"\n"}
              www.cnil.fr
            </Text>
          </View>

          {/* Article 2 - Données collectées */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 2 - DONNÉES COLLECTÉES</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.1 Données d'identification</Text>{"\n\n"}
              • Nom et prénom{"\n"}
              • Adresse email{"\n"}
              • Photo de profil (optionnelle){"\n"}
              • Numéro de téléphone (optionnel){"\n\n"}

              <Text style={styles.bold}>2.2 Données de vérification d'identité (KYC)</Text>{"\n\n"}
              Conformément aux obligations réglementaires, nous collectons via notre
              prestataire Stripe Identity :{"\n\n"}
              • Copie de pièce d'identité (CNI, passeport, titre de séjour){"\n"}
              • Photo de vérification (selfie){"\n"}
              • Date de naissance{"\n"}
              • Nationalité{"\n\n"}
              Ces données sont traitées par Stripe Inc. conformément à leur politique
              de confidentialité. PACT ne stocke pas les documents d'identité.{"\n\n"}

              <Text style={styles.bold}>2.3 Données financières</Text>{"\n\n"}
              Via Stripe Connect (prestataire de services de paiement agréé) :{"\n\n"}
              • Coordonnées bancaires (IBAN pour les versements){"\n"}
              • Historique des transactions{"\n"}
              • Montants des engagements financiers{"\n\n"}
              PACT ne stocke jamais les numéros complets de carte bancaire.{"\n\n"}

              <Text style={styles.bold}>2.4 Données de santé (Article 9 RGPD)</Text>{"\n\n"}
              <Text style={styles.highlight}>Uniquement avec votre consentement explicite</Text>,
              nous pouvons accéder à :{"\n\n"}
              Via Apple HealthKit :{"\n"}
              • Nombre de pas quotidiens{"\n"}
              • Distance parcourue{"\n"}
              • Minutes d'activité{"\n"}
              • Données d'entraînement{"\n\n"}
              Via Google Fit :{"\n"}
              • Activités physiques{"\n"}
              • Métriques de fitness{"\n"}
              • Objectifs d'activité{"\n\n"}
              <Text style={styles.important}>
                Ces données sont utilisées EXCLUSIVEMENT pour vérifier automatiquement
                l'accomplissement de vos objectifs personnels. Elles ne sont jamais
                utilisées à des fins publicitaires, de profilage, ou partagées avec des tiers.
              </Text>{"\n\n"}

              <Text style={styles.bold}>2.5 Données d'utilisation</Text>{"\n\n"}
              • Historique des pacts (engagements){"\n"}
              • Preuves soumises (photos, captures d'écran){"\n"}
              • Interactions avec l'application{"\n"}
              • Messages dans les discussions de groupe{"\n\n"}

              <Text style={styles.bold}>2.6 Données techniques</Text>{"\n\n"}
              • Identifiant unique d'appareil{"\n"}
              • Type d'appareil et version du système d'exploitation{"\n"}
              • Adresse IP{"\n"}
              • Jetons de notification push{"\n"}
              • Logs d'erreurs (anonymisés)
            </Text>
          </View>

          {/* Article 3 - Base légale des traitements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 3 - BASE LÉGALE DES TRAITEMENTS</Text>
            <Text style={styles.paragraph}>
              Conformément à l'article 6 du RGPD, nous traitons vos données sur les
              bases légales suivantes :{"\n\n"}

              <Text style={styles.bold}>3.1 Exécution du contrat (Article 6.1.b)</Text>{"\n\n"}
              • Gestion de votre compte utilisateur{"\n"}
              • Participation aux pacts{"\n"}
              • Traitement des transactions financières{"\n"}
              • Communication relative à vos engagements{"\n\n"}

              <Text style={styles.bold}>3.2 Obligation légale (Article 6.1.c)</Text>{"\n\n"}
              • Vérification d'identité (KYC) - Obligations anti-blanchiment{"\n"}
              • Conservation des données de transaction (obligations comptables){"\n"}
              • Réponse aux réquisitions judiciaires{"\n\n"}

              <Text style={styles.bold}>3.3 Consentement explicite (Article 6.1.a et Article 9.2.a)</Text>{"\n\n"}
              • Accès aux données de santé (HealthKit, Google Fit){"\n"}
              • Envoi de communications promotionnelles{"\n"}
              • Utilisation de la géolocalisation{"\n\n"}
              <Text style={styles.important}>
                Vous pouvez retirer votre consentement à tout moment dans les paramètres
                de l'application ou en nous contactant. Le retrait du consentement ne
                compromet pas la licéité du traitement effectué avant ce retrait.
              </Text>{"\n\n"}

              <Text style={styles.bold}>3.4 Intérêt légitime (Article 6.1.f)</Text>{"\n\n"}
              • Prévention de la fraude et des abus{"\n"}
              • Amélioration de nos services{"\n"}
              • Sécurité de la plateforme{"\n"}
              • Statistiques anonymisées
            </Text>
          </View>

          {/* Article 4 - Finalités du traitement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 4 - FINALITÉS DU TRAITEMENT</Text>
            <Text style={styles.paragraph}>
              Vos données sont traitées pour les finalités suivantes :{"\n\n"}

              <Text style={styles.bold}>4.1 Fonctionnement du service</Text>{"\n"}
              • Création et gestion de votre compte{"\n"}
              • Participation aux pacts d'engagement personnel{"\n"}
              • Vérification des preuves d'accomplissement{"\n"}
              • Traitement des engagements financiers et redistributions{"\n"}
              • Messagerie entre participants{"\n\n"}

              <Text style={styles.bold}>4.2 Vérification automatique des objectifs</Text>{"\n"}
              • Connexion aux APIs de santé (avec votre consentement){"\n"}
              • Validation automatique des défis sportifs{"\n"}
              • Génération de preuves vérifiables{"\n\n"}

              <Text style={styles.bold}>4.3 Sécurité et conformité</Text>{"\n"}
              • Vérification d'identité des utilisateurs{"\n"}
              • Détection et prévention de la fraude{"\n"}
              • Respect des obligations légales{"\n\n"}

              <Text style={styles.bold}>4.4 Communication</Text>{"\n"}
              • Notifications relatives à vos pacts{"\n"}
              • Alertes de sécurité{"\n"}
              • Informations sur les modifications du service
            </Text>
          </View>

          {/* Article 5 - Destinataires des données */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 5 - DESTINATAIRES DES DONNÉES</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.1 Sous-traitants</Text>{"\n\n"}
              Nous faisons appel aux sous-traitants suivants, tous conformes au RGPD :{"\n\n"}

              <Text style={styles.bold}>Stripe Inc.</Text> (États-Unis){"\n"}
              • Finalité : Paiements et vérification d'identité{"\n"}
              • Données : Informations financières, données KYC{"\n"}
              • Garanties : Clauses contractuelles types (CCT), Data Privacy Framework (DPF){"\n\n"}

              <Text style={styles.bold}>Convex Inc.</Text> (États-Unis){"\n"}
              • Finalité : Hébergement base de données{"\n"}
              • Données : Toutes données de l'application{"\n"}
              • Garanties : Clauses contractuelles types (CCT){"\n\n"}

              <Text style={styles.bold}>Expo / Vercel</Text> (États-Unis){"\n"}
              • Finalité : Infrastructure application mobile{"\n"}
              • Données : Données techniques{"\n"}
              • Garanties : Clauses contractuelles types (CCT){"\n\n"}

              <Text style={styles.bold}>5.2 Autres utilisateurs</Text>{"\n\n"}
              Certaines informations sont visibles par les autres participants :{"\n"}
              • Votre nom et photo de profil{"\n"}
              • Vos badges et statistiques publiques{"\n"}
              • Vos messages dans les discussions de groupe{"\n"}
              • Votre statut dans les pacts auxquels vous participez{"\n\n"}

              <Text style={styles.bold}>5.3 Autorités</Text>{"\n\n"}
              Nous pouvons être amenés à communiquer vos données :{"\n"}
              • Aux autorités judiciaires sur réquisition{"\n"}
              • À la CNIL dans le cadre de ses contrôles{"\n"}
              • Aux autorités fiscales (données de transaction){"\n\n"}

              <Text style={styles.bold}>5.4 Engagement de non-vente</Text>{"\n\n"}
              <Text style={styles.important}>
                PACT s'engage à ne JAMAIS vendre, louer ou échanger vos données
                personnelles à des fins publicitaires ou de marketing.
              </Text>
            </Text>
          </View>

          {/* Article 6 - Transferts hors UE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 6 - TRANSFERTS HORS UNION EUROPÉENNE</Text>
            <Text style={styles.paragraph}>
              Certains de nos sous-traitants sont situés aux États-Unis. Ces transferts
              sont encadrés par :{"\n\n"}

              • <Text style={styles.bold}>Clauses Contractuelles Types (CCT)</Text> adoptées par
              la Commission européenne (Décision 2021/914){"\n\n"}

              • <Text style={styles.bold}>Mesures supplémentaires</Text> conformément aux
              recommandations du CEPD :{"\n"}
              - Chiffrement des données en transit et au repos{"\n"}
              - Pseudonymisation lorsque possible{"\n"}
              - Évaluation des législations locales{"\n\n"}

              Vous pouvez obtenir une copie des garanties appropriées en nous contactant
              à l'adresse hello@paact.app
            </Text>
          </View>

          {/* Article 7 - Durée de conservation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 7 - DURÉE DE CONSERVATION</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.1 Données de compte</Text>{"\n"}
              Durée de vie du compte + 3 ans après suppression{"\n\n"}

              <Text style={styles.bold}>7.2 Données KYC</Text>{"\n"}
              5 ans après la fin de la relation commerciale (obligation légale
              anti-blanchiment){"\n\n"}

              <Text style={styles.bold}>7.3 Données de transaction</Text>{"\n"}
              10 ans (obligations comptables et fiscales){"\n\n"}

              <Text style={styles.bold}>7.4 Données de santé</Text>{"\n"}
              Supprimées immédiatement après vérification de l'objectif.
              Non conservées au-delà de la durée du pact concerné.{"\n\n"}

              <Text style={styles.bold}>7.5 Preuves (photos)</Text>{"\n"}
              Durée du pact + 6 mois (période de contestation){"\n\n"}

              <Text style={styles.bold}>7.6 Messages</Text>{"\n"}
              Durée de vie du pact + 3 mois{"\n\n"}

              <Text style={styles.bold}>7.7 Logs techniques</Text>{"\n"}
              12 mois maximum
            </Text>
          </View>

          {/* Article 8 - Sécurité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 8 - SÉCURITÉ DES DONNÉES</Text>
            <Text style={styles.paragraph}>
              Nous mettons en œuvre les mesures techniques et organisationnelles
              suivantes :{"\n\n"}

              <Text style={styles.bold}>8.1 Mesures techniques</Text>{"\n"}
              • Chiffrement TLS 1.3 pour toutes les communications{"\n"}
              • Chiffrement AES-256 des données sensibles au repos{"\n"}
              • Authentification sécurisée (Clerk){"\n"}
              • Hashage des mots de passe (bcrypt){"\n"}
              • Pare-feu et protection DDoS{"\n"}
              • Sauvegardes chiffrées régulières{"\n\n"}

              <Text style={styles.bold}>8.2 Mesures organisationnelles</Text>{"\n"}
              • Accès aux données strictement limité au personnel habilité{"\n"}
              • Politique de mots de passe robuste{"\n"}
              • Formation du personnel à la protection des données{"\n"}
              • Procédures de gestion des incidents{"\n"}
              • Tests de sécurité réguliers
            </Text>
          </View>

          {/* Article 9 - Vos droits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 9 - VOS DROITS</Text>
            <Text style={styles.paragraph}>
              Conformément aux articles 15 à 22 du RGPD, vous disposez des droits
              suivants :{"\n\n"}

              <Text style={styles.bold}>9.1 Droit d'accès (Article 15)</Text>{"\n"}
              Obtenir confirmation que vos données sont traitées et en recevoir une copie.{"\n\n"}

              <Text style={styles.bold}>9.2 Droit de rectification (Article 16)</Text>{"\n"}
              Faire corriger vos données inexactes ou incomplètes.{"\n\n"}

              <Text style={styles.bold}>9.3 Droit à l'effacement (Article 17)</Text>{"\n"}
              Demander la suppression de vos données, sous réserve des obligations
              légales de conservation.{"\n\n"}

              <Text style={styles.bold}>9.4 Droit à la limitation (Article 18)</Text>{"\n"}
              Demander la suspension temporaire du traitement de vos données.{"\n\n"}

              <Text style={styles.bold}>9.5 Droit à la portabilité (Article 20)</Text>{"\n"}
              Recevoir vos données dans un format structuré et couramment utilisé (JSON).{"\n\n"}

              <Text style={styles.bold}>9.6 Droit d'opposition (Article 21)</Text>{"\n"}
              Vous opposer au traitement basé sur l'intérêt légitime.{"\n\n"}

              <Text style={styles.bold}>9.7 Retrait du consentement</Text>{"\n"}
              Retirer votre consentement à tout moment pour les traitements qui en
              dépendent (données de santé, notifications marketing).{"\n\n"}

              <Text style={styles.bold}>9.8 Directives post-mortem</Text>{"\n"}
              Définir des directives relatives à la conservation et la communication
              de vos données après votre décès.{"\n\n"}

              <Text style={styles.bold}>Comment exercer vos droits :</Text>{"\n\n"}
              • Dans l'application : Paramètres {">"} Mes données{"\n"}
              • Par email : hello@paact.app{"\n"}
              • Par courrier : PACT - PHILIPPE NICOLAS, 1 rue de Madrid, 67310 Wasselonne, France{"\n\n"}
              Nous répondrons dans un délai maximum d'un mois.{"\n\n"}

              <Text style={styles.bold}>9.9 Réclamation auprès de la CNIL</Text>{"\n\n"}
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              introduire une réclamation auprès de la CNIL :{"\n"}
              www.cnil.fr/fr/plaintes
            </Text>
          </View>

          {/* Article 10 - Données de santé */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 10 - TRAITEMENT DES DONNÉES DE SANTÉ</Text>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Les données de santé constituent une catégorie particulière de données
                personnelles (Article 9 RGPD). Leur traitement fait l'objet de garanties
                renforcées.
              </Text>
            </View>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>10.1 Consentement explicite préalable</Text>{"\n\n"}
              L'accès à vos données de santé (Apple HealthKit, Google Fit) nécessite
              votre consentement explicite, libre et éclairé. Ce consentement est :{"\n\n"}
              • Demandé séparément pour chaque source de données{"\n"}
              • Révocable à tout moment{"\n"}
              • Jamais obligatoire pour utiliser PACT{"\n\n"}

              <Text style={styles.bold}>10.2 Finalité strictement limitée</Text>{"\n\n"}
              Vos données de santé sont utilisées UNIQUEMENT pour :{"\n"}
              • Vérifier automatiquement l'accomplissement de vos objectifs personnels{"\n"}
              • Valider les preuves de défis sportifs{"\n\n"}
              Elles ne sont JAMAIS utilisées pour :{"\n"}
              • Du profilage publicitaire{"\n"}
              • De l'analyse comportementale{"\n"}
              • La vente à des tiers{"\n"}
              • Des décisions automatisées vous concernant{"\n\n"}

              <Text style={styles.bold}>10.3 Minimisation des données</Text>{"\n\n"}
              Nous n'accédons qu'aux données strictement nécessaires à la vérification
              de chaque objectif spécifique. Par exemple, pour un défi "10 000 pas",
              nous n'accédons qu'au compteur de pas, pas à d'autres données de santé.{"\n\n"}

              <Text style={styles.bold}>10.4 Non-conservation</Text>{"\n\n"}
              Les données de santé sont :{"\n"}
              • Lues en temps réel via l'API{"\n"}
              • Comparées à l'objectif du pact{"\n"}
              • Immédiatement supprimées après vérification{"\n\n"}
              Seul le résultat de la vérification (succès/échec) est conservé,
              jamais les données brutes de santé.{"\n\n"}

              <Text style={styles.bold}>10.5 Sécurité renforcée</Text>{"\n\n"}
              • Accès via les APIs officielles Apple/Google uniquement{"\n"}
              • Chiffrement de bout en bout{"\n"}
              • Aucun stockage sur nos serveurs{"\n"}
              • Logs d'accès détaillés et audités
            </Text>
          </View>

          {/* Article 11 - Mineurs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 11 - PROTECTION DES MINEURS</Text>
            <Text style={styles.paragraph}>
              PACT est exclusivement destiné aux personnes majeures (18 ans et plus).{"\n\n"}

              Nous ne collectons pas sciemment de données concernant des mineurs.
              Si nous découvrons qu'un utilisateur est mineur, son compte sera
              immédiatement suspendu et ses données supprimées.{"\n\n"}

              Si vous êtes parent ou tuteur et pensez que votre enfant a créé un
              compte, contactez-nous immédiatement à hello@paact.app
            </Text>
          </View>

          {/* Article 12 - Cookies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 12 - COOKIES ET TRACEURS</Text>
            <Text style={styles.paragraph}>
              L'application mobile PACT n'utilise pas de cookies au sens classique du
              terme.{"\n\n"}

              <Text style={styles.bold}>Identifiants utilisés :</Text>{"\n\n"}
              • <Text style={styles.bold}>Token d'authentification</Text> : nécessaire pour
              maintenir votre session{"\n"}
              • <Text style={styles.bold}>Identifiant de notification</Text> : pour vous
              envoyer des notifications push{"\n"}
              • <Text style={styles.bold}>Identifiant d'appareil</Text> : pour la sécurité
              et la prévention de la fraude{"\n\n"}

              Ces identifiants sont strictement nécessaires au fonctionnement du
              service et ne sont pas utilisés à des fins publicitaires.
            </Text>
          </View>

          {/* Article 13 - Violation de données */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 13 - VIOLATION DE DONNÉES PERSONNELLES</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>13.1 Notification à la CNIL</Text>{"\n\n"}
              En cas de violation de données personnelles susceptible d'engendrer un
              risque pour vos droits et libertés, PACT notifiera la CNIL dans les
              72 heures suivant la découverte de l'incident, conformément à l'article
              33 du RGPD.{"\n\n"}

              <Text style={styles.bold}>13.2 Information des personnes concernées</Text>{"\n\n"}
              Si la violation est susceptible d'engendrer un risque élevé pour vos
              droits et libertés, nous vous en informerons dans les meilleurs délais,
              conformément à l'article 34 du RGPD.{"\n\n"}

              Cette notification comprendra :{"\n"}
              • La nature de la violation{"\n"}
              • Les catégories de données concernées{"\n"}
              • Les conséquences probables{"\n"}
              • Les mesures prises pour y remédier{"\n"}
              • Les recommandations pour vous protéger{"\n\n"}

              <Text style={styles.bold}>13.3 Registre des violations</Text>{"\n\n"}
              PACT tient un registre documentant toutes les violations de données,
              leurs effets et les mesures prises, conformément à nos obligations légales.
            </Text>
          </View>

          {/* Article 14 - Modifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 14 - MODIFICATIONS DE LA POLITIQUE</Text>
            <Text style={styles.paragraph}>
              Nous pouvons modifier cette politique de confidentialité pour refléter
              les évolutions de nos pratiques ou de la réglementation.{"\n\n"}

              <Text style={styles.bold}>En cas de modification substantielle :</Text>{"\n\n"}
              • Vous serez informé par notification dans l'application{"\n"}
              • Vous recevrez un email (si vous avez accepté les communications){"\n"}
              • Un délai de 30 jours sera accordé avant l'entrée en vigueur{"\n"}
              • Votre consentement sera redemandé si nécessaire{"\n\n"}

              La version en vigueur est toujours accessible dans l'application.
            </Text>
          </View>

          {/* Article 15 - Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 15 - CONTACT</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Questions générales</Text>{"\n"}
              Email : hello@paact.app{"\n\n"}

              <Text style={styles.bold}>Protection des données (DPO)</Text>{"\n"}
              Email : hello@paact.app{"\n"}
              Adresse : PACT - PHILIPPE NICOLAS, 1 rue de Madrid, 67310 Wasselonne, France{"\n\n"}

              <Text style={styles.bold}>Exercice de vos droits</Text>{"\n"}
              Email : hello@paact.app{"\n"}
              Formulaire : Paramètres {">"} Mes données {">"} Demande{"\n\n"}

              Nous nous engageons à répondre à toute demande dans un délai maximum
              de 30 jours.
            </Text>
          </View>

          {/* Final Notice */}
          <View style={styles.finalBox}>
            <Text style={styles.finalTitle}>Engagement de transparence</Text>
            <Text style={styles.finalText}>
              PACT s'engage à traiter vos données personnelles avec le plus grand
              respect. Nous croyons que la confiance se construit par la transparence.
              N'hésitez pas à nous contacter pour toute question.
            </Text>
          </View>

        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Content
  lastUpdated: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },

  // Important box
  importantBox: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  importantTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  importantText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Warning box
  warningBox: {
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 20,
  },

  // Final box
  finalBox: {
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  finalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  finalText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  highlight: {
    fontWeight: "600",
    color: Colors.accent,
  },
  important: {
    fontWeight: "500",
    color: Colors.textPrimary,
    fontStyle: "italic",
  },

  bottomSpacer: {
    height: 40,
  },
});

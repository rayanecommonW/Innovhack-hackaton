/**
 * Conditions Générales d'Utilisation - CGU
 * Version conforme au droit français
 * Cadrage juridique : Commitment Contracts (NOT Gambling)
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

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Conditions Generales</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={styles.lastUpdated}>Derniere mise a jour : Janvier 2026</Text>

          {/* PRÉAMBULE - TRÈS IMPORTANT JURIDIQUEMENT */}
          <View style={styles.importantSection}>
            <View style={styles.importantHeader}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
              <Text style={styles.importantTitle}>PREAMBULE - NATURE DU SERVICE</Text>
            </View>
            <Text style={styles.importantText}>
              PACT est une plateforme de Contrats d'Engagement Personnel ("Commitment Contracts")
              permettant aux utilisateurs de renforcer leur motivation a atteindre des objectifs
              personnels grace a des engagements financiers volontaires.
            </Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>
                PACT N'EST PAS une plateforme de jeux d'argent, de paris ou de gambling au sens
                de l'article L. 320-1 du Code de la securite interieure.
              </Text>
            </View>
            <Text style={styles.importantText}>
              Les resultats dependent EXCLUSIVEMENT des actions volontaires et controlees de
              l'utilisateur, et non du hasard, d'aleas ou d'evenements exterieurs.
            </Text>
          </View>

          {/* ARTICLE 1 - DÉFINITIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 1 - DEFINITIONS</Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.1 "Engagement financier" ou "Caution motivationnelle" : </Text>
              Somme d'argent deposee volontairement par l'utilisateur pour renforcer son
              engagement personnel envers un objectif qu'il a lui-meme defini ou choisi.
            </Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.2 "Contrat d'engagement" ou "Pact" : </Text>
              Accord unilateral par lequel un utilisateur s'engage a accomplir un objectif
              personnel defini et mesurable, dans un delai determine, en deposant une caution
              motivationnelle.
            </Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.3 "Objectif personnel" : </Text>
              Action, comportement ou resultat que l'utilisateur s'engage a accomplir par
              ses propres efforts (exemple : marcher 10 000 pas par jour, lire 30 minutes
              quotidiennement).
            </Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.4 "Preuve de realisation" : </Text>
              Element objectif et verifiable demontrant l'accomplissement de l'objectif
              (donnees automatiques via API certifiee, photographie horodatee prise dans
              l'application).
            </Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.5 "Recuperation" : </Text>
              Restitution integrale de la caution motivationnelle a l'utilisateur ayant
              atteint son objectif personnel.
            </Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.6 "Bonus de reussite" : </Text>
              Montant supplementaire attribue aux utilisateurs ayant reussi leur objectif,
              provenant du Pool de motivation, distribue proportionnellement au montant
              de leur engagement initial.
            </Text>

            <Text style={styles.definition}>
              <Text style={styles.term}>1.7 "Pool de motivation" : </Text>
              Ensemble des cautions motivationnelles non recuperees par les utilisateurs
              n'ayant pas atteint leurs objectifs personnels.
            </Text>
          </View>

          {/* ARTICLE 2 - NATURE JURIDIQUE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 2 - NATURE JURIDIQUE DU SERVICE</Text>

            <Text style={styles.paragraph}>
              2.1 PACT fournit un service de motivation personnelle fonde sur le principe
              scientifiquement etabli du "commitment device" (dispositif d'engagement),
              reconnu par la recherche en economie comportementale (Kahneman, Thaler).
            </Text>

            <Text style={styles.paragraph}>
              2.2 Le mecanisme du service est le suivant :
            </Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>a) L'utilisateur definit ou choisit librement un objectif personnel</Text>
              <Text style={styles.listItem}>b) L'utilisateur depose volontairement une caution motivationnelle</Text>
              <Text style={styles.listItem}>c) L'utilisateur realise les actions necessaires pour atteindre SON objectif</Text>
              <Text style={styles.listItem}>d) Si l'objectif est atteint et prouve : restitution integrale de la caution</Text>
              <Text style={styles.listItem}>e) Si l'objectif n'est pas atteint : la caution n'est pas restituee</Text>
            </View>

            <View style={styles.legalBox}>
              <Ionicons name="document-text" size={20} color={Colors.info} />
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Qualification juridique</Text>
                <Text style={styles.legalText}>
                  2.3 PACT n'est PAS un jeu de hasard au sens de l'article L. 320-1 du Code
                  de la securite interieure car :{"\n\n"}
                  • Le resultat depend UNIQUEMENT des actions volontaires de l'utilisateur{"\n"}
                  • L'utilisateur a un controle TOTAL sur l'atteinte de son objectif{"\n"}
                  • AUCUN element aleatoire n'intervient dans la determination du resultat{"\n"}
                  • Il n'existe aucun "operateur de jeu" proposant des gains aleatoires
                </Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              2.4 Le service s'apparente juridiquement a un contrat d'engagement personnel
              avec clause penale (articles 1231-5 et suivants du Code civil), ou la "perte"
              de la caution constitue une consequence contractuellement prevue et acceptee
              du non-respect de son propre engagement par l'utilisateur.
            </Text>
          </View>

          {/* ARTICLE 3 - ÉLIGIBILITÉ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 3 - CONDITIONS D'ELIGIBILITE</Text>

            <Text style={styles.paragraph}>
              3.1 L'utilisateur doit etre age d'au moins 18 ans revolus.
            </Text>

            <Text style={styles.paragraph}>
              3.2 L'utilisateur doit fournir une piece d'identite valide (carte nationale
              d'identite, passeport, titre de sejour) pour verification AVANT tout depot
              de caution motivationnelle, conformement aux obligations de verification
              d'identite (KYC).
            </Text>

            <Text style={styles.paragraph}>
              3.3 L'utilisateur doit disposer de la pleine capacite juridique pour contracter
              au sens des articles 1145 et suivants du Code civil.
            </Text>

            <Text style={styles.paragraph}>
              3.4 L'utilisateur certifie sur l'honneur que les fonds utilises proviennent
              de sources licites et ne font l'objet d'aucune procedure de blanchiment.
            </Text>

            <Text style={styles.paragraph}>
              3.5 L'utilisateur residant dans un pays ou le service serait contraire a
              la legislation locale ne peut pas utiliser PACT.
            </Text>
          </View>

          {/* ARTICLE 4 - FONCTIONNEMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 4 - FONCTIONNEMENT DES ENGAGEMENTS</Text>

            <Text style={styles.subTitle}>4.1 Creation d'un Pact</Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• L'utilisateur ou un tiers definit un objectif clair, mesurable et realisable</Text>
              <Text style={styles.listItem}>• Une duree raisonnable est fixee pour atteindre l'objectif</Text>
              <Text style={styles.listItem}>• Un montant minimum de caution est defini</Text>
              <Text style={styles.listItem}>• Des criteres objectifs de preuve sont etablis</Text>
            </View>

            <Text style={styles.subTitle}>4.2 Participation a un Pact</Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• L'utilisateur choisit librement le montant de sa caution (≥ minimum)</Text>
              <Text style={styles.listItem}>• Le montant est debite et conserve en sequestre par Stripe</Text>
              <Text style={styles.listItem}>• L'utilisateur s'engage a fournir les preuves requises</Text>
            </View>

            <Text style={styles.subTitle}>4.3 Validation des objectifs</Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• Validation automatique : donnees certifiees via API (Apple Health, Google Fit, Strava)</Text>
              <Text style={styles.listItem}>• Validation par preuve : photographie horodatee prise dans l'application</Text>
              <Text style={styles.listItem}>• En cas de contestation : procedure de mediation gratuite</Text>
            </View>

            <Text style={styles.subTitle}>4.4 Distribution des resultats</Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• Objectif atteint : Restitution integrale de la caution + bonus proportionnel</Text>
              <Text style={styles.listItem}>• Objectif non atteint : La caution rejoint le Pool de motivation</Text>
            </View>
          </View>

          {/* ARTICLE 5 - FRAIS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 5 - FRAIS DE SERVICE</Text>

            <Text style={styles.paragraph}>
              5.1 PACT preleve des frais de fonctionnement sur le Pool de motivation
              uniquement, selon le bareme suivant :
            </Text>
            <View style={styles.feeBox}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Pacts publics (communautaires)</Text>
                <Text style={styles.feeValue}>5%</Text>
              </View>
              <View style={styles.feeDivider} />
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Pacts prives (entre amis)</Text>
                <Text style={styles.feeValue}>3%</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              5.2 L'utilisateur ayant atteint son objectif recupere 100% de sa caution
              initiale. Les frais s'appliquent uniquement au Pool avant redistribution
              du bonus de reussite.
            </Text>

            <Text style={styles.paragraph}>
              5.3 Les frais de transaction bancaire (depot, retrait) sont a la charge
              de l'utilisateur selon le bareme de notre prestataire Stripe.
            </Text>
          </View>

          {/* ARTICLE 6 - GESTION DES FONDS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 6 - GESTION DES FONDS</Text>

            <View style={styles.legalBox}>
              <Ionicons name="lock-closed" size={20} color={Colors.success} />
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Securite des fonds</Text>
                <Text style={styles.legalText}>
                  6.1 PACT ne detient JAMAIS directement les fonds des utilisateurs.{"\n\n"}
                  6.2 Les fonds sont geres par Stripe Payments Europe Limited, etablissement
                  de paiement agree par la Central Bank of Ireland et passeporte en France
                  aupres de l'ACPR.
                </Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              6.3 Les fonds sont conserves sur des comptes de cantonnement separes,
              conformement a la reglementation europeenne sur les services de paiement
              (DSP2 - Directive 2015/2366).
            </Text>

            <Text style={styles.paragraph}>
              6.4 Delais de retrait securises :
            </Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• Nouveaux comptes (moins de 30 jours) : 7 jours ouvres</Text>
              <Text style={styles.listItem}>• Comptes etablis (30-90 jours) : 3 jours ouvres</Text>
              <Text style={styles.listItem}>• Comptes anciens (90+ jours, historique positif) : 24-48h</Text>
            </View>
          </View>

          {/* ARTICLE 7 - RESPONSABILITÉS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 7 - RESPONSABILITES</Text>

            <Text style={styles.subTitle}>7.1 Responsabilites de l'utilisateur</Text>
            <Text style={styles.paragraph}>
              L'utilisateur est seul et entierement responsable de :
            </Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• La definition d'objectifs realistes et atteignables pour lui-meme</Text>
              <Text style={styles.listItem}>• L'execution des actions necessaires a l'atteinte de ses objectifs</Text>
              <Text style={styles.listItem}>• La fourniture de preuves authentiques et non falsifiees</Text>
              <Text style={styles.listItem}>• Le choix d'un montant d'engagement adapte a sa situation financiere</Text>
            </View>

            <Text style={styles.subTitle}>7.2 Limitations de responsabilite de PACT</Text>
            <Text style={styles.paragraph}>
              PACT ne saurait etre tenu responsable :
            </Text>
            <View style={styles.listBox}>
              <Text style={styles.listItem}>• De l'echec de l'utilisateur a atteindre ses propres objectifs</Text>
              <Text style={styles.listItem}>• De la pertinence des objectifs choisis par l'utilisateur</Text>
              <Text style={styles.listItem}>• Des consequences financieres de la non-recuperation d'une caution</Text>
              <Text style={styles.listItem}>• Des interruptions temporaires de service independantes de sa volonte</Text>
            </View>

            <Text style={styles.subTitle}>7.3 Sanctions en cas de fraude</Text>
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={Colors.danger} />
              <Text style={styles.warningText}>
                La falsification de preuves constitue une fraude passible de :{"\n\n"}
                • Perte immediate et definitive de la caution{"\n"}
                • Suspension ou fermeture definitive du compte{"\n"}
                • Poursuites judiciaires pour escroquerie (article 313-1 du Code penal)
              </Text>
            </View>
          </View>

          {/* ARTICLE 8 - DONNÉES PERSONNELLES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 8 - PROTECTION DES DONNEES PERSONNELLES</Text>

            <Text style={styles.paragraph}>
              8.1 Les donnees personnelles sont traitees conformement au Reglement General
              sur la Protection des Donnees (RGPD - Reglement UE 2016/679) et a la loi
              n°78-17 du 6 janvier 1978 modifiee.
            </Text>

            <Text style={styles.paragraph}>
              8.2 Les donnees de sante (pas, sommeil, activite physique) collectees via
              les API tierces sont traitees sur la base du consentement explicite de
              l'utilisateur et sont utilisees EXCLUSIVEMENT pour la verification des
              objectifs. Elles ne sont jamais partagees avec des tiers.
            </Text>

            <Text style={styles.paragraph}>
              8.3 L'utilisateur dispose des droits d'acces, de rectification, d'effacement,
              de portabilite et d'opposition. Pour les exercer : hello@paact.app
            </Text>

            <Text style={styles.paragraph}>
              8.4 Pour plus de details, consultez notre Politique de Confidentialite.
            </Text>
          </View>

          {/* ARTICLE 9 - USAGE RESPONSABLE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 9 - USAGE RESPONSABLE</Text>

            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color={Colors.warning} />
              <Text style={styles.warningText}>
                9.1 PACT encourage vivement les utilisateurs a ne s'engager que pour des
                montants qu'ils peuvent se permettre de ne pas recuperer sans impact
                significatif sur leur situation financiere personnelle ou familiale.
              </Text>
            </View>

            <Text style={styles.paragraph}>
              9.2 L'utilisateur reconnait que la non-recuperation de sa caution est une
              consequence previsible et acceptee de sa propre decision de ne pas atteindre
              l'objectif qu'il s'etait lui-meme fixe.
            </Text>

            <Text style={styles.paragraph}>
              9.3 En cas de difficultes, PACT met a disposition :{"\n"}
              • Des limites d'engagement auto-imposees par l'utilisateur{"\n"}
              • Un acces a des ressources d'aide (Joueurs Info Service : 09 74 75 13 13)
            </Text>

            <Text style={styles.paragraph}>
              9.4 PACT se reserve le droit de limiter ou suspendre l'acces au service pour
              tout utilisateur presentant des signes de comportement problematique.
            </Text>
          </View>

          {/* ARTICLE 10 - DROIT APPLICABLE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 10 - DROIT APPLICABLE ET LITIGES</Text>

            <Text style={styles.paragraph}>
              10.1 Les presentes Conditions Generales d'Utilisation sont regies exclusivement
              par le droit francais.
            </Text>

            <Text style={styles.paragraph}>
              10.2 En cas de litige, les parties s'engagent a rechercher une solution amiable
              pendant un delai de 30 jours avant toute action judiciaire.
            </Text>

            <Text style={styles.paragraph}>
              10.3 Conformement a l'article L.612-1 du Code de la consommation, le
              consommateur peut recourir gratuitement a un mediateur de la consommation
              en cas de litige.{"\n\n"}
              <Text style={styles.term}>Mediateur : </Text>En cours de designation (version beta).
              Pour toute reclamation, contactez-nous a hello@paact.app.
              Un mediateur agree sera designe avant la sortie publique de l'application.
            </Text>

            <Text style={styles.paragraph}>
              10.4 A defaut de resolution amiable ou par mediation, les tribunaux francais
              seront seuls competents.
            </Text>
          </View>

          {/* ARTICLE 11 - MODIFICATIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ARTICLE 11 - MODIFICATIONS DES CGU</Text>

            <Text style={styles.paragraph}>
              11.1 PACT se reserve le droit de modifier les presentes CGU a tout moment.
            </Text>

            <Text style={styles.paragraph}>
              11.2 Toute modification substantielle sera notifiee aux utilisateurs par
              email et/ou notification dans l'application au moins 30 jours avant
              son entree en vigueur.
            </Text>

            <Text style={styles.paragraph}>
              11.3 L'utilisateur peut refuser les nouvelles conditions en supprimant son
              compte avant leur entree en vigueur. A defaut, l'utilisation continue du
              service vaut acceptation.
            </Text>
          </View>

          {/* ACCEPTATION */}
          <View style={styles.acceptBox}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            <Text style={styles.acceptText}>
              En utilisant PACT, vous reconnaissez avoir lu, compris et accepte
              l'integralite des presentes Conditions Generales d'Utilisation et
              vous engagez a les respecter.
            </Text>
          </View>

          {/* CONTACT */}
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Informations legales</Text>
            <Text style={styles.contactText}>
              PACT - PHILIPPE NICOLAS{"\n"}
              Entrepreneur individuel (Micro-entreprise){"\n"}
              1 rue de Madrid, 67310 Wasselonne, France{"\n"}
              SIRET : 938 048 071 00014{"\n"}
              TVA : FR13938048071{"\n"}
              RCS : 938 048 071 R.C.S. Saverne{"\n"}
              Email : hello@paact.app
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
    paddingBottom: Spacing.xxl,
  },
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
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },

  // Important section (Préambule)
  importantSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  importantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.success,
  },
  importantText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  highlightBox: {
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
    textAlign: "center",
    lineHeight: 20,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  definition: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  term: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // List box
  listBox: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  listItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingLeft: Spacing.sm,
  },

  // Legal box
  legalBox: {
    flexDirection: "row",
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  legalContent: {
    flex: 1,
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.info,
    marginBottom: Spacing.xs,
  },
  legalText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Warning box
  warningBox: {
    flexDirection: "row",
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Fee box
  feeBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  feeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.accent,
  },
  feeDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // Accept box
  acceptBox: {
    flexDirection: "row",
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.success,
  },
  acceptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.success,
    lineHeight: 22,
  },

  // Contact box
  contactBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  bottomSpacer: {
    height: 40,
  },
});

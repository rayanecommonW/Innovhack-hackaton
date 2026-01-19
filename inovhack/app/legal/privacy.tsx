/**
 * Privacy Policy Page
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
          <Text style={styles.lastUpdated}>Dernière mise à jour : Janvier 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Chez PACT, nous prenons la protection de vos données personnelles très
              au sérieux. Cette politique de confidentialité explique comment nous
              collectons, utilisons et protégeons vos informations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Données collectées</Text>
            <Text style={styles.paragraph}>
              Nous collectons les données suivantes :{"\n\n"}
              <Text style={styles.bold}>Données de compte :</Text>{"\n"}
              • Nom et prénom{"\n"}
              • Adresse email{"\n"}
              • Photo de profil{"\n\n"}
              <Text style={styles.bold}>Données d'utilisation :</Text>{"\n"}
              • Historique des participations{"\n"}
              • Preuves soumises{"\n"}
              • Transactions financières{"\n\n"}
              <Text style={styles.bold}>Données techniques :</Text>{"\n"}
              • Identifiant d'appareil{"\n"}
              • Type d'appareil et OS{"\n"}
              • Adresse IP
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
            <Text style={styles.paragraph}>
              Vos données sont utilisées pour :{"\n\n"}
              • Fournir et améliorer nos services{"\n"}
              • Gérer votre compte et vos transactions{"\n"}
              • Valider les preuves de défis{"\n"}
              • Envoyer des notifications pertinentes{"\n"}
              • Prévenir la fraude et les abus{"\n"}
              • Respecter nos obligations légales
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Partage des données</Text>
            <Text style={styles.paragraph}>
              Nous ne vendons jamais vos données. Nous pouvons partager vos informations
              avec :{"\n\n"}
              • Nos prestataires de paiement (pour traiter les transactions){"\n"}
              • Les autorités compétentes (si requis par la loi){"\n\n"}
              Certaines informations de profil (nom, photo, badges) sont visibles par
              les autres utilisateurs selon vos paramètres de confidentialité.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Sécurité des données</Text>
            <Text style={styles.paragraph}>
              Nous mettons en œuvre des mesures de sécurité techniques et
              organisationnelles pour protéger vos données :{"\n\n"}
              • Chiffrement des données en transit (HTTPS){"\n"}
              • Chiffrement des données sensibles au repos{"\n"}
              • Accès restreint aux données personnelles{"\n"}
              • Surveillance continue des systèmes
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Conservation des données</Text>
            <Text style={styles.paragraph}>
              Nous conservons vos données tant que votre compte est actif. Après
              suppression de votre compte, certaines données peuvent être conservées
              pendant une période limitée pour des raisons légales ou comptables.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Vos droits</Text>
            <Text style={styles.paragraph}>
              Conformément au RGPD, vous disposez des droits suivants :{"\n\n"}
              • <Text style={styles.bold}>Accès</Text> : obtenir une copie de vos données{"\n"}
              • <Text style={styles.bold}>Rectification</Text> : corriger vos données{"\n"}
              • <Text style={styles.bold}>Suppression</Text> : demander l'effacement{"\n"}
              • <Text style={styles.bold}>Portabilité</Text> : récupérer vos données{"\n"}
              • <Text style={styles.bold}>Opposition</Text> : refuser certains traitements{"\n\n"}
              Pour exercer ces droits, contactez-nous à privacy@pact-app.com
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Cookies et technologies similaires</Text>
            <Text style={styles.paragraph}>
              L'application mobile n'utilise pas de cookies. Nous utilisons des
              identifiants d'appareil pour le fonctionnement du service et les
              notifications push.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Mineurs</Text>
            <Text style={styles.paragraph}>
              PACT est destiné aux personnes de 18 ans et plus. Nous ne collectons
              pas sciemment de données concernant des mineurs.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Modifications</Text>
            <Text style={styles.paragraph}>
              Nous pouvons mettre à jour cette politique. Les modifications
              significatives seront notifiées par email ou dans l'application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.paragraph}>
              Pour toute question relative à cette politique :{"\n\n"}
              Email : privacy@pact-app.com{"\n"}
              Délégué à la protection des données : dpo@pact-app.com
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
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  bottomSpacer: {
    height: 40,
  },
});

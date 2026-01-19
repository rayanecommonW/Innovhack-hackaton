/**
 * Terms of Service Page
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
        <Text style={styles.title}>Conditions d'utilisation</Text>
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
            <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
            <Text style={styles.paragraph}>
              En utilisant l'application PACT, vous acceptez d'être lié par les présentes
              conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez
              ne pas utiliser notre service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Description du service</Text>
            <Text style={styles.paragraph}>
              PACT est une application de défis entre amis avec engagement financier.
              Les utilisateurs peuvent créer et participer à des challenges, miser de
              l'argent et gagner des récompenses selon leur performance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Inscription et compte</Text>
            <Text style={styles.paragraph}>
              Vous devez avoir au moins 18 ans pour utiliser PACT. Vous êtes responsable
              de la confidentialité de vos identifiants de connexion et de toutes les
              activités effectuées sous votre compte.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Utilisation des fonds</Text>
            <Text style={styles.paragraph}>
              Les dépôts effectués sur PACT sont utilisés pour les mises sur les challenges.
              Les gains sont distribués selon les règles de chaque défi. PACT prélève une
              commission de 10% sur les gains.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Règles de conduite</Text>
            <Text style={styles.paragraph}>
              Les utilisateurs s'engagent à :{"\n\n"}
              • Ne pas tricher ou frauder{"\n"}
              • Soumettre des preuves authentiques{"\n"}
              • Respecter les autres utilisateurs{"\n"}
              • Ne pas utiliser de contenu offensant{"\n"}
              • Signaler tout comportement inapproprié
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Validation des preuves</Text>
            <Text style={styles.paragraph}>
              Les preuves sont validées par l'organisateur du défi ou par vote communautaire.
              Les décisions de validation sont définitives. En cas de litige, PACT se réserve
              le droit de trancher.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Remboursements</Text>
            <Text style={styles.paragraph}>
              Les mises ne sont pas remboursables une fois le défi commencé, sauf en cas
              d'annulation par l'organisateur. Les dépôts peuvent être retirés sous réserve
              qu'ils ne soient pas engagés dans un défi en cours.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Suspension de compte</Text>
            <Text style={styles.paragraph}>
              PACT se réserve le droit de suspendre ou supprimer tout compte en cas de
              violation des présentes conditions, de fraude avérée ou de comportement
              inapproprié répété.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Limitation de responsabilité</Text>
            <Text style={styles.paragraph}>
              PACT ne peut être tenu responsable des pertes financières liées à votre
              participation aux défis. Vous participez en connaissance de cause et
              acceptez le risque de perdre votre mise.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Modifications</Text>
            <Text style={styles.paragraph}>
              PACT peut modifier ces conditions à tout moment. Les modifications seront
              notifiées aux utilisateurs. La continuation de l'utilisation du service
              après modification vaut acceptation des nouvelles conditions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.paragraph}>
              Pour toute question concernant ces conditions, contactez-nous à :{"\n"}
              support@pact-app.com
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
    fontSize: 18,
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

  bottomSpacer: {
    height: 40,
  },
});

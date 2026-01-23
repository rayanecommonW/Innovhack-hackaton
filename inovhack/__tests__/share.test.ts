/**
 * Tests for Share Utilities
 */

import { Platform } from 'react-native';

// Mock Share module
jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Platform: {
    OS: 'ios',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}));

describe('Share Utilities', () => {
  describe('getAppStoreUrl', () => {
    it('should return iOS app store URL on iOS', () => {
      Platform.OS = 'ios';
      const { getAppStoreUrl } = require('../utils/share');
      expect(getAppStoreUrl()).toBe('https://apps.apple.com/app/pact');
    });

    it('should return Play Store URL on Android', () => {
      Platform.OS = 'android';
      const { getAppStoreUrl } = require('../utils/share');
      expect(getAppStoreUrl()).toBe('https://play.google.com/store/apps/details?id=app.paact.ios');
    });
  });

  describe('shareChallenge', () => {
    it('should share challenge with title and description', async () => {
      const { shareChallenge } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareChallenge({
        title: 'Test Challenge',
        description: 'Test description',
        betAmount: 10,
        inviteCode: 'ABC123',
      });

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle share without optional fields', async () => {
      const { shareChallenge } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareChallenge({
        title: 'Simple Challenge',
      });

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('shareStats', () => {
    it('should share user stats correctly', async () => {
      const { shareStats } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareStats({
        wonPacts: 5,
        successRate: 80,
        currentStreak: 7,
        totalEarnings: 150,
      });

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('shareAchievement', () => {
    it('should share achievement with title and description', async () => {
      const { shareAchievement } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareAchievement({
        title: 'First Win',
        description: 'Won your first pact!',
      });

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('shareReferralCode', () => {
    it('should share referral code with bonus amount', async () => {
      const { shareReferralCode } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareReferralCode('MYCODE', 10);

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should use default bonus amount if not specified', async () => {
      const { shareReferralCode } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareReferralCode('MYCODE');

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('shareGroupInvite', () => {
    it('should share group invite with member count', async () => {
      const { shareGroupInvite } = require('../utils/share');
      const { Share } = require('react-native');

      const result = await shareGroupInvite({
        name: 'Fitness Group',
        inviteCode: 'GROUP123',
        memberCount: 10,
      });

      expect(Share.share).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});

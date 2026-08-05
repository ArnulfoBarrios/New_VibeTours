import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// Singleton service responsible for managing Google AdMob lifecycle,
/// loading ads, and presenting interstitial/rewarded ads.
class AdService {
  static final AdService instance = AdService._internal();
  AdService._internal();

  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  InterstitialAd? _interstitialAd;
  bool _isInterstitialAdLoading = false;

  RewardedAd? _rewardedAd;
  bool _isRewardedAdLoading = false;

  /// AdMob Ad Unit IDs (Debug Test IDs for local dev / Production IDs for release builds)
  static String get bannerAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/6300978111'
          : 'ca-app-pub-3940256099942544/2934735716';
    }
    if (Platform.isAndroid) {
      return 'ca-app-pub-3770146961182211/4564819122';
    }
    return '';
  }

  static String get interstitialAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/1033173712'
          : 'ca-app-pub-3940256099942544/4411468910';
    }
    if (Platform.isAndroid) {
      return 'ca-app-pub-3770146961182211/4588603920';
    }
    return '';
  }

  static String get rewardedAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/5224354917'
          : 'ca-app-pub-3940256099942544/1712485313';
    }
    if (Platform.isAndroid) {
      return 'ca-app-pub-3770146961182211/5686329109';
    }
    return '';
  }

  static String get nativeAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/2247696110'
          : 'ca-app-pub-3940256099942544/3986624511';
    }
    if (Platform.isAndroid) {
      return 'ca-app-pub-3770146961182211/4564819122';
    }
    return '';
  }

  /// Initializes MobileAds SDK
  Future<void> initialize({List<String>? testDeviceIds}) async {
    if (_isInitialized) return;

    try {
      await MobileAds.instance.initialize();
      if (testDeviceIds != null && testDeviceIds.isNotEmpty) {
        await MobileAds.instance.updateRequestConfiguration(
          RequestConfiguration(testDeviceIds: testDeviceIds),
        );
      }
      _isInitialized = true;
      if (kDebugMode) {
        print('[AdService] Google Mobile Ads initialized successfully.');
      }
      // Pre-load an interstitial ad
      loadInterstitialAd();
    } catch (e) {
      if (kDebugMode) {
        print('[AdService] Failed to initialize Google Mobile Ads: $e');
      }
    }
  }

  /// Loads an Interstitial Ad into memory
  void loadInterstitialAd() {
    if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
      if (_interstitialAd != null || _isInterstitialAdLoading) return;

      _isInterstitialAdLoading = true;
      InterstitialAd.load(
        adUnitId: interstitialAdUnitId,
        request: const AdRequest(),
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (ad) {
            _interstitialAd = ad;
            _isInterstitialAdLoading = false;
            if (kDebugMode) {
              print('[AdService] Interstitial Ad loaded successfully.');
            }
          },
          onAdFailedToLoad: (error) {
            _interstitialAd = null;
            _isInterstitialAdLoading = false;
            if (kDebugMode) {
              print('[AdService] Interstitial Ad failed to load: $error');
            }
          },
        ),
      );
    }
  }

  /// Shows an Interstitial Ad if available, then invokes [onAdClosed] callback.
  /// If no ad is loaded, [onAdClosed] is called immediately.
  void showInterstitialAd({required VoidCallback onAdClosed}) {
    if (_interstitialAd != null) {
      _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          _interstitialAd = null;
          loadInterstitialAd(); // Load next ad
          onAdClosed();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          ad.dispose();
          _interstitialAd = null;
          loadInterstitialAd();
          onAdClosed();
        },
      );
      _interstitialAd!.show();
    } else {
      // Ad not ready, proceed without blocking user
      onAdClosed();
      loadInterstitialAd();
    }
  }

  /// Loads a Rewarded Ad
  void loadRewardedAd() {
    if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
      if (_rewardedAd != null || _isRewardedAdLoading) return;

      _isRewardedAdLoading = true;
      RewardedAd.load(
        adUnitId: rewardedAdUnitId,
        request: const AdRequest(),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (ad) {
            _rewardedAd = ad;
            _isRewardedAdLoading = false;
            if (kDebugMode) {
              print('[AdService] Rewarded Ad loaded successfully.');
            }
          },
          onAdFailedToLoad: (error) {
            _rewardedAd = null;
            _isRewardedAdLoading = false;
            if (kDebugMode) {
              print('[AdService] Rewarded Ad failed to load: $error');
            }
          },
        ),
      );
    }
  }

  /// Shows Rewarded Ad and invokes [onRewardEarned] if user watches to completion
  void showRewardedAd({
    required VoidCallback onRewardEarned,
    required VoidCallback onAdClosed,
  }) {
    if (_rewardedAd != null) {
      bool rewardGranted = false;
      _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          _rewardedAd = null;
          loadRewardedAd();
          if (rewardGranted) {
            onRewardEarned();
          }
          onAdClosed();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          ad.dispose();
          _rewardedAd = null;
          loadRewardedAd();
          onAdClosed();
        },
      );
      _rewardedAd!.show(
        onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
          rewardGranted = true;
        },
      );
    } else {
      onAdClosed();
      loadRewardedAd();
    }
  }

  /// Disposes active ads
  void dispose() {
    _interstitialAd?.dispose();
    _rewardedAd?.dispose();
  }
}

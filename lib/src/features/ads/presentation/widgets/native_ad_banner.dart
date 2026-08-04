import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../../../core/services/ad_service.dart';

/// Reusable Widget that loads and displays an anchored adaptive Banner Ad
/// or Native Ad styled for VibeTours feeds and detail screens.
class NativeAdBanner extends StatefulWidget {
  final EdgeInsetsGeometry padding;
  final String? customTitle;

  const NativeAdBanner({
    super.key,
    this.padding = const EdgeInsets.symmetric(vertical: 12.0, horizontal: 16.0),
    this.customTitle,
  });

  @override
  State<NativeAdBanner> createState() => _NativeAdBannerState();
}

class _NativeAdBannerState extends State<NativeAdBanner> {
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd() {
    if (kIsWeb || (!Platform.isAndroid && !Platform.isIOS)) return;

    _bannerAd = BannerAd(
      adUnitId: AdService.bannerAdUnitId,
      request: const AdRequest(),
      size: AdSize.banner,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          if (mounted) {
            setState(() {
              _isAdLoaded = true;
            });
          }
        },
        onAdFailedToLoad: (ad, err) {
          if (kDebugMode) {
            print('[NativeAdBanner] Failed to load banner ad: $err');
          }
          ad.dispose();
        },
      ),
    );

    _bannerAd?.load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb || !_isAdLoaded || _bannerAd == null) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: widget.padding,
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? Colors.grey.shade900 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16.0),
          border: Border.all(
            color: isDark ? Colors.white12 : Colors.black12,
            width: 1.0,
          ),
        ),
        padding: const EdgeInsets.all(8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.customTitle ?? 'Anuncio Patrocinado',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'AD',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: _bannerAd!.size.width.toDouble(),
              height: _bannerAd!.size.height.toDouble(),
              child: AdWidget(ad: _bannerAd!),
            ),
          ],
        ),
      ),
    );
  }
}

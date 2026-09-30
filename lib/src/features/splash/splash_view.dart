import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Presentation widget representing the clean splash screen.
/// Displays the centered circular VibeTours logo and the "from !emotiva" branding,
/// automatically adapting its colors and branding asset to light or dark mode.
class SplashView extends StatelessWidget {
  const SplashView({
    super.key,
    this.animation,
  });

  final Animation<double>? animation;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark ? const Color(0xFF000000) : Colors.white;

    Widget content = Stack(
      children: [
        Center(
          child: _buildCenterLogo(),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 48,
          child: SafeArea(
            child: _buildFooter(isDark: isDark),
          ),
        ),
      ],
    );

    if (animation != null) {
      content = FadeTransition(
        opacity: animation!,
        child: content,
      );
    }

    final systemUiStyle = SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      systemNavigationBarColor: backgroundColor,
      systemNavigationBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: systemUiStyle,
      child: Scaffold(
        backgroundColor: backgroundColor,
        body: content,
      ),
    );
  }

  Widget _buildCenterLogo() {
    return Image.asset(
      'assets/images/splash_icon.png',
      width: 92,
      height: 92,
      fit: BoxFit.contain,
    );
  }

  Widget _buildFooter({required bool isDark}) {
    final footerTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF6B7280);
    final emotivaLogoPath = isDark
        ? 'assets/images/emotiva_logo_dark.png'
        : 'assets/images/emotiva_logo_light.png';

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'from',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w400,
            letterSpacing: 0.6,
            color: footerTextColor,
          ),
        ),
        const SizedBox(height: 6),
        Image.asset(
          emotivaLogoPath,
          height: 24,
          fit: BoxFit.contain,
        ),
      ],
    );
  }
}

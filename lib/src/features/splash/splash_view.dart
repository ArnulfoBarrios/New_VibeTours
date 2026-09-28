import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Presentation widget representing the clean splash screen (Screen 2).
/// Displays the centered circular VibeTours logo and the "from !emotiva" branding
/// on a crisp white background.
class SplashView extends StatelessWidget {
  const SplashView({
    super.key,
    this.animation,
  });

  final Animation<double>? animation;

  @override
  Widget build(BuildContext context) {
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
            child: _buildFooter(),
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

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: Colors.white,
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

  Widget _buildFooter() {
    const footerTextColor = Color(0xFF6B7280);
    const emotivaLogoPath = 'assets/images/emotiva_logo_light.png';

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Text(
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

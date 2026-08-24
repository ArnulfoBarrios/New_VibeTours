import 'package:flutter/material.dart';

class GoogleSignInLogo extends StatelessWidget {
  const GoogleSignInLogo({super.key, this.size = 24});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/google_logo.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      errorBuilder: (context, error, stackTrace) => Icon(
        Icons.g_mobiledata_rounded,
        size: size,
      ),
    );
  }
}

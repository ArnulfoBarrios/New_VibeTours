import 'package:flutter/material.dart';

class VibeColors extends ThemeExtension<VibeColors> {
  const VibeColors({
    required this.glass,
    required this.glassStrong,
    required this.luminousBorder,
    required this.deepSurface,
    required this.aiAccent,
    required this.success,
  });

  final Color glass;
  final Color glassStrong;
  final Color luminousBorder;
  final Color deepSurface;
  final Color aiAccent;
  final Color success;

  @override
  VibeColors copyWith({
    Color? glass,
    Color? glassStrong,
    Color? luminousBorder,
    Color? deepSurface,
    Color? aiAccent,
    Color? success,
  }) => VibeColors(
    glass: glass ?? this.glass,
    glassStrong: glassStrong ?? this.glassStrong,
    luminousBorder: luminousBorder ?? this.luminousBorder,
    deepSurface: deepSurface ?? this.deepSurface,
    aiAccent: aiAccent ?? this.aiAccent,
    success: success ?? this.success,
  );

  @override
  VibeColors lerp(ThemeExtension<VibeColors>? other, double t) {
    if (other is! VibeColors) return this;
    return VibeColors(
      glass: Color.lerp(glass, other.glass, t)!,
      glassStrong: Color.lerp(glassStrong, other.glassStrong, t)!,
      luminousBorder: Color.lerp(luminousBorder, other.luminousBorder, t)!,
      deepSurface: Color.lerp(deepSurface, other.deepSurface, t)!,
      aiAccent: Color.lerp(aiAccent, other.aiAccent, t)!,
      success: Color.lerp(success, other.success, t)!,
    );
  }
}

class AppTheme {
  const AppTheme._();

  static const primary = Color(0xFF007AFF); // iOS Blue
  static const primaryDeep = Color(0xFF0056B3);
  static const indigo = Color(0xFF5856D6); // iOS Indigo
  static const violet = Color(0xFFAF52DE); // iOS Purple
  static const lightBackground = Color(0xFFF2F2F7); // iOS Grouped Background Light
  static const darkBackground = Color(0xFF000000); // iOS Background Dark

  static ThemeData light() => _theme(
    brightness: Brightness.light,
    background: lightBackground,
    surface: const Color(0xFFFFFFFF),
    onSurface: const Color(0xFF000000),
    glass: Colors.white.withValues(alpha: 0.85),
    glassStrong: Colors.white,
    border: const Color(0xFFC6C6C8), // iOS Separator
  );

  static ThemeData dark() => _theme(
    brightness: Brightness.dark,
    background: darkBackground,
    surface: const Color(0xFF1C1C1E), // iOS Secondary System Background
    onSurface: const Color(0xFFFFFFFF),
    glass: const Color(0xFF1C1C1E).withValues(alpha: 0.85),
    glassStrong: const Color(0xFF1C1C1E),
    border: const Color(0xFF38383A), // iOS Opaque Separator
  );

  static ThemeData _theme({
    required Brightness brightness,
    required Color background,
    required Color surface,
    required Color onSurface,
    required Color glass,
    required Color glassStrong,
    required Color border,
  }) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
      primary: primary,
      secondary: indigo,
      tertiary: violet,
      surface: surface,
      onSurface: onSurface,
      error: const Color(0xFFBA1A1A),
    );
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      fontFamily: 'Inter',
      scaffoldBackgroundColor: background,
      colorScheme: colorScheme,
      textTheme: _textTheme(onSurface),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: _textTheme(onSurface).titleLarge,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: glass,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: primary, width: 1.3),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        side: BorderSide(color: border),
        selectedColor: primary.withValues(alpha: 0.16),
      ),
      extensions: [
        VibeColors(
          glass: glass,
          glassStrong: glassStrong,
          luminousBorder: border,
          deepSurface: background,
          aiAccent: violet,
          success: const Color(0xFF10B981),
        ),
      ],
    );
  }

  static TextTheme _textTheme(Color color) => TextTheme(
    displayLarge: TextStyle(
      fontSize: 42,
      fontWeight: FontWeight.w800,
      height: 1.05,
      letterSpacing: -1.0,
      color: color,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w800,
      height: 1.12,
      letterSpacing: -0.5,
      color: color,
    ),
    titleLarge: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w800,
      height: 1.2,
      letterSpacing: -0.5,
      color: color,
    ),
    titleMedium: TextStyle(
      fontSize: 17,
      fontWeight: FontWeight.w700,
      height: 1.25,
      letterSpacing: 0,
      color: color,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w500,
      height: 1.45,
      letterSpacing: 0,
      color: color,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      height: 1.4,
      letterSpacing: 0,
      color: color.withValues(alpha: 0.76),
    ),
    labelLarge: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      height: 1.2,
      letterSpacing: 0,
      color: color,
    ),
  );
}

extension VibeTheme on BuildContext {
  VibeColors get vibe {
    final theme = Theme.of(this);
    return theme.extension<VibeColors>() ??
        (theme.brightness == Brightness.dark
            ? VibeColors(
          glass: const Color(0xFF1E2433).withValues(alpha: 0.5),
          glassStrong: const Color(0xFF1E2433).withValues(alpha: 0.8),
          luminousBorder: Colors.white.withValues(alpha: 0.12),
          deepSurface: const Color(0xFF090B10),
          aiAccent: AppTheme.violet,
          success: const Color(0xFF10B981),
        )
      : VibeColors(
          glass: Colors.white.withValues(alpha: 0.75),
          glassStrong: Colors.white.withValues(alpha: 0.90),
          luminousBorder: Colors.white.withValues(alpha: 0.6),
          deepSurface: AppTheme.lightBackground,
          aiAccent: AppTheme.violet,
          success: const Color(0xFF10B981),
        ));
  }
}

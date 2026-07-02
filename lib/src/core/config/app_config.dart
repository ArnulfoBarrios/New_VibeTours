import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class AppConfig {
  const AppConfig._();

  static Map<String, String> _assetValues = const {};

  static const _definedSupabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const _definedSupabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
  );
  static const _definedApiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const _localNetworkApiBaseUrl = String.fromEnvironment(
    'LOCAL_NETWORK_API_BASE_URL',
    defaultValue: 'http://192.168.1.220:3000/api',
  );
  static const _definedGoogleIosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
  );
  static const _definedGoogleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
  );
  static const _definedTomTomApiKey = String.fromEnvironment('TOMTOM_API_KEY');
  static const _definedAdminEmail = String.fromEnvironment('ADMIN_EMAIL');
  static const _definedAdminUserId = String.fromEnvironment('ADMIN_USER_ID');

  static Future<void> load() async {
    try {
      final raw = await rootBundle.loadString(
        'assets/config/public_config.json',
      );
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      _assetValues = {
        for (final entry in decoded.entries)
          if (entry.value != null && entry.value.toString().isNotEmpty)
            entry.key: entry.value.toString(),
      };
    } catch (_) {
      _assetValues = const {};
    }
  }

  static String get supabaseUrl => _definedSupabaseUrl.isNotEmpty
      ? _definedSupabaseUrl
      : _asset('SUPABASE_URL');

  static String get supabaseAnonKey => _definedSupabaseAnonKey.isNotEmpty
      ? _definedSupabaseAnonKey
      : _asset('SUPABASE_ANON_KEY');

  static String get googleIosClientId => _definedGoogleIosClientId.isNotEmpty
      ? _definedGoogleIosClientId
      : _asset('GOOGLE_IOS_CLIENT_ID');

  static String get googleWebClientId => _firstClientId(
    _definedGoogleWebClientId.isNotEmpty
        ? _definedGoogleWebClientId
        : _asset('GOOGLE_WEB_CLIENT_ID').isNotEmpty
        ? _asset('GOOGLE_WEB_CLIENT_ID')
        : _asset('GOOGLE_CLIENT_ID'),
  );

  static bool get hasSupabase =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  static String get tomTomApiKey => _definedTomTomApiKey.isNotEmpty
      ? _definedTomTomApiKey
      : _asset('TOMTOM_API_KEY');

  static String get adminEmail => _definedAdminEmail.isNotEmpty
      ? _definedAdminEmail.trim().toLowerCase()
      : _asset('ADMIN_EMAIL').trim().toLowerCase();

  static String get adminUserId => _definedAdminUserId.isNotEmpty
      ? _definedAdminUserId.trim()
      : _asset('ADMIN_USER_ID').trim();

  static String get apiBaseUrl => apiBaseUrls.first;

  static List<String> get apiBaseUrls {
    final candidates = <String>[
      if (_definedApiBaseUrl.isNotEmpty) _definedApiBaseUrl,
      _asset('API_BASE_URL'),
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android)
        _localNetworkApiBaseUrl,
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android)
        'http://10.0.2.2:3000/api',
      'http://127.0.0.1:3000/api',
      'http://localhost:3000/api',
    ];
    return [
      for (final url in candidates)
        if (url.isNotEmpty) url,
    ];
  }

  static String _asset(String key) => _assetValues[key] ?? '';

  static String _firstClientId(String value) {
    return value
        .split(',')
        .map((item) => item.trim())
        .firstWhere((item) => item.isNotEmpty, orElse: () => '');
  }
}

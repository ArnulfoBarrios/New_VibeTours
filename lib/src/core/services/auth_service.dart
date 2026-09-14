import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

class AuthService {
  AuthService(this._client);

  static const _googleScopes = ['openid', 'email', 'profile'];

  final SupabaseClient? _client;

  User? get currentUser => _client?.auth.currentUser;

  bool get isConfigured => _client != null;

  bool isConfiguredAdmin(User? user) {
    if (user == null) return false;
    final adminUserId = AppConfig.adminUserId;
    if (adminUserId.isNotEmpty) return user.id == adminUserId;
    final adminEmail = AppConfig.adminEmail;
    if (adminEmail.isEmpty) return false;
    return user.email?.trim().toLowerCase() == adminEmail;
  }

  Future<void> signInWithPassword({
    required String email,
    required String password,
  }) async {
    if (_client == null) {
      throw StateError('Supabase no esta configurado.');
    }
    await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signUpWithPassword({
    required String email,
    required String password,
  }) async {
    if (_client == null) {
      throw StateError('Supabase no esta configurado.');
    }
    await _client.auth.signUp(email: email, password: password);
  }

  Future<void> signInWithGoogle() async {
    if (_client == null) {
      throw StateError('Supabase no esta configurado.');
    }
    // 1. Intento nativo con GoogleSignIn
    if (AppConfig.googleWebClientId.isNotEmpty) {
      try {
        final googleSignIn = GoogleSignIn.instance;
        await googleSignIn.initialize(
          clientId: AppConfig.googleIosClientId.isEmpty
              ? null
              : AppConfig.googleIosClientId,
          serverClientId: AppConfig.googleWebClientId,
        );
        final account = await googleSignIn.authenticate(scopeHint: _googleScopes);
        final idToken = account.authentication.idToken;
        if (idToken != null) {
          final authorization =
              await account.authorizationClient.authorizationForScopes(
                _googleScopes,
              ) ??
              await account.authorizationClient.authorizeScopes(_googleScopes);
          await _client.auth.signInWithIdToken(
            provider: OAuthProvider.google,
            idToken: idToken,
            accessToken: authorization.accessToken,
          );
          return;
        }
      } catch (error) {
        final errText = error.toString().toLowerCase();
        // Si el usuario canceló explícitamente y no es un fallo de configuración/reauth
        if (errText.contains('canceled') &&
            !errText.contains('16') &&
            !errText.contains('reauth') &&
            !errText.contains('failed')) {
          rethrow;
        }
        // Si falló por configuración técnica (ej. SHA-1 no registrado en Google Cloud),
        // procedemos al fallback vía navegador/Custom Tabs de Supabase.
      }
    }

    // 2. Fallback: Flujo web OAuth de Supabase (vía Custom Tabs / navegador)
    await _client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'com.vibetours.app://login-callback',
    );
  }

  Future<void> updateUserProfile({String? fullName, String? avatarUrl, String? bio}) async {
    if (_client == null) return;
    
    final Map<String, dynamic> data = {};
    if (fullName != null) data['custom_full_name'] = fullName;
    if (avatarUrl != null) data['custom_avatar_url'] = avatarUrl;
    if (bio != null) data['bio'] = bio;

    if (data.isNotEmpty) {
      await _client.auth.updateUser(UserAttributes(data: data));
    }
  }

  Future<void> updateUserPreferences(Map<String, dynamic> preferences) async {
    if (_client == null || _client.auth.currentUser == null) return;
    try {
      await _client.auth.updateUser(UserAttributes(data: {'tourist_preferences': preferences}));
    } catch (e) {
      // Ignorar error si falla por no tener sesión activa
    }
  }

  Map<String, dynamic>? getUserPreferences() {
    if (_client == null) return null;
    final user = _client.auth.currentUser;
    if (user == null) return null;
    final prefs = user.userMetadata?['tourist_preferences'];
    if (prefs is Map<String, dynamic>) return prefs;
    return null;
  }

  Future<void> deleteAccount() async {
    if (_client == null || _client.auth.currentUser == null) return;
    try {
      await _client.rpc('delete_user');
      await signOut();
    } catch (e) {
      throw StateError('Error al eliminar la cuenta: $e');
    }
  }

  Future<void> signOut() async {
    await _client?.auth.signOut();
  }
}

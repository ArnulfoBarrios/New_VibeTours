import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

enum GoogleSignInResult {
  completed,
  webFlowLaunched,
}

class AuthService {
  AuthService(this._client);

  static const _googleScopes = ['openid', 'email', 'profile'];
  static bool _isGoogleSignInInitialized = false;

  final SupabaseClient? _client;

  User? get currentUser => _client?.auth.currentUser;

  bool get isConfigured => _client != null;

  static Future<void> _ensureGoogleSignInInitialized() async {
    if (_isGoogleSignInInitialized) return;
    if (AppConfig.googleWebClientId.isEmpty) return;
    try {
      await GoogleSignIn.instance.initialize(
        clientId: AppConfig.googleIosClientId.isEmpty
            ? null
            : AppConfig.googleIosClientId,
        serverClientId: AppConfig.googleWebClientId,
      );
      _isGoogleSignInInitialized = true;
    } catch (_) {
      // Ignorar fallo de inicialización repetida o no soportada
    }
  }

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

  Future<GoogleSignInResult> signInWithGoogle() async {
    if (_client == null) {
      throw StateError('Supabase no esta configurado.');
    }

    // 1. Intento nativo con GoogleSignIn (Google Identity / Credential Manager)
    if (AppConfig.googleWebClientId.isNotEmpty) {
      try {
        await _ensureGoogleSignInInitialized();
        final googleSignIn = GoogleSignIn.instance;
        final account = await googleSignIn.authenticate(scopeHint: _googleScopes);
        final idToken = account.authentication.idToken;
        if (idToken != null && idToken.isNotEmpty) {
          // Intentar obtener accessToken de forma silenciosa si ya está disponible.
          // NOTA: No llamamos a authorizeScopes porque Supabase solo necesita el idToken
          // y authorizeScopes fuerza un segundo diálogo o falla si el cliente Android no está configurado.
          String? accessToken;
          try {
            final authorization = await account.authorizationClient.authorizationForScopes(_googleScopes);
            accessToken = authorization?.accessToken;
          } catch (_) {
            // El token de acceso es opcional para Supabase
          }

          await _client.auth.signInWithIdToken(
            provider: OAuthProvider.google,
            idToken: idToken,
            accessToken: accessToken,
          );
          return GoogleSignInResult.completed;
        }
      } catch (error) {
        // Si el intento nativo falla (por ejemplo: falta de SHA-1 en Google Cloud Console,
        // incompatibilidad del Credential Manager en el dispositivo, etc.),
        // procedemos de manera transparente al flujo web seguro de Supabase.
      }
    }

    // 2. Fallback: Flujo web OAuth de Supabase (vía Custom Tabs / navegador externo)
    await _client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'com.vibetours.app://login-callback',
    );
    return GoogleSignInResult.webFlowLaunched;
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

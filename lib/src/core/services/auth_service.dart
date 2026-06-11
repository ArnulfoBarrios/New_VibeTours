import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

class AuthService {
  AuthService(this._client);

  static const _googleScopes = ['openid', 'email', 'profile'];

  final SupabaseClient? _client;

  User? get currentUser => _client?.auth.currentUser;

  bool get isConfigured => _client != null;

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

  Future<void> sendPasswordReset(String email) async {
    if (_client == null) {
      throw StateError('Supabase no esta configurado.');
    }
    await _client.auth.resetPasswordForEmail(email);
  }

  Future<void> signInWithGoogle() async {
    if (_client == null) {
      throw StateError('Supabase no esta configurado.');
    }
    if (AppConfig.googleWebClientId.isEmpty) {
      throw StateError(
        'Falta GOOGLE_WEB_CLIENT_ID para continuar con Google sin salir de la app.',
      );
    }
    final googleSignIn = GoogleSignIn.instance;
    await googleSignIn.initialize(
      clientId: AppConfig.googleIosClientId.isEmpty
          ? null
          : AppConfig.googleIosClientId,
      serverClientId: AppConfig.googleWebClientId.isEmpty
          ? null
          : AppConfig.googleWebClientId,
    );
    final account = await googleSignIn.authenticate(scopeHint: _googleScopes);
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw StateError('Google no entrego id_token.');
    }
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
  }

  Future<void> signOut() async {
    await _client?.auth.signOut();
  }
}

import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';
import '../../domain/models.dart';
import '../tour_live/tour_rating_dialog.dart';


class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final TextEditingController _bioController = TextEditingController();
  final TextEditingController _avatarUrlController = TextEditingController();
  bool _isEditingBio = false;
  String _appVersion = '';

  @override
  void initState() {
    super.initState();
    _loadAppVersion();
    final user = ref.read(authUserProvider).valueOrNull;
    if (user != null) {
      _bioController.text = user.userMetadata?['bio']?.toString() ?? '';
      _avatarUrlController.text = user.userMetadata?['custom_avatar_url']?.toString() ?? user.userMetadata?['avatar_url']?.toString() ?? '';
    }
  }

  Future<void> _loadAppVersion() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _appVersion = '${packageInfo.version}+${packageInfo.buildNumber}';
        });
      }
    } catch (e) {
      debugPrint('Error loading app version: $e');
    }
  }

  @override
  void dispose() {
    _bioController.dispose();
    _avatarUrlController.dispose();
    super.dispose();
  }

  String _getFriendlyError(Object error) {
    final errStr = error.toString().toLowerCase();
    if (errStr.contains('socket') || errStr.contains('network') || errStr.contains('failed host lookup') || errStr.contains('clientexception')) {
      return 'No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.';
    }
    return 'Ocurrió un error inesperado. Intenta más tarde.';
  }

  Future<bool> _saveProfile() async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(authServiceProvider).updateUserProfile(
        bio: _bioController.text,
        avatarUrl: _avatarUrlController.text.isNotEmpty ? _avatarUrlController.text : null,
      );
      if (mounted) {
        setState(() {
          _isEditingBio = false;
        });
      }
      return true;
    } catch (e) {
      if (mounted) {
        messenger
          ..clearSnackBars()
          ..showSnackBar(
            SnackBar(
              content: Text(_getFriendlyError(e)),
              backgroundColor: Colors.redAccent,
            ),
          );
      }
      return false;
    }
  }

  void _pickFromGallery() async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 256,
      maxHeight: 256,
      imageQuality: 80,
    );
    if (image != null) {
      try {
        final bytes = await File(image.path).readAsBytes();
        final base64String = base64Encode(bytes);
        _avatarUrlController.text = 'data:image/png;base64,$base64String';
        final success = await _saveProfile();
        if (success) {
          navigator.pop();
          messenger
            ..clearSnackBars()
            ..showSnackBar(
              const SnackBar(
                content: Text('Foto de perfil actualizada con éxito.'),
                backgroundColor: Colors.green,
              ),
            );
        }
      } catch (e) {
        messenger
          ..clearSnackBars()
          ..showSnackBar(
            SnackBar(
              content: Text(_getFriendlyError(e)),
              backgroundColor: Colors.redAccent,
            ),
          );
      }
    }
  }

  void _showAvatarEditSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Cambiar foto de perfil',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 20),
                InkWell(
                  onTap: _pickFromGallery,
                  borderRadius: BorderRadius.circular(16),
                  child: Ink(
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.photo_library_rounded, color: AppTheme.primary),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          'Elegir de la galería',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 12),
                Text(
                  'O ingresar URL de imagen',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _avatarUrlController,
                  decoration: InputDecoration(
                    hintText: 'https://ejemplo.com/foto.jpg',
                    filled: true,
                    fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Cancelar'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: () async {
                          final navigator = Navigator.of(context);
                          final messenger = ScaffoldMessenger.of(context);
                          navigator.pop();
                          final success = await _saveProfile();
                          if (success) {
                            messenger
                              ..clearSnackBars()
                              ..showSnackBar(
                                const SnackBar(
                                  content: Text('Foto de perfil actualizada con éxito.'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                          }
                        },
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(0, 50),
                          backgroundColor: AppTheme.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Guardar'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showCurrencySelection(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              Text(
                'Seleccionar moneda',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.attach_money_rounded, color: Colors.green),
                title: Text('Dólares (USD)', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                onTap: () {
                  ref.read(currencyProvider.notifier).setCurrency(AppCurrency.usd);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.euro_rounded, color: Colors.blue),
                title: Text('Euros (EUR)', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                onTap: () {
                  ref.read(currencyProvider.notifier).setCurrency(AppCurrency.eur);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.payments_rounded, color: Colors.teal),
                title: Text('Pesos Colombianos (COP)', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                onTap: () {
                  ref.read(currencyProvider.notifier).setCurrency(AppCurrency.cop);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageSelection(BuildContext context, AppLocalizations l10n) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              Text(
                'Seleccionar idioma',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.settings_suggest_rounded, color: Colors.grey),
                title: Text('Automático (${l10n.appearanceSystem})', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                onTap: () {
                  ref.read(localeProvider.notifier).setLocale('system');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.language_rounded, color: Colors.orange),
                title: Text('Español', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                onTap: () {
                  ref.read(localeProvider.notifier).setLocale('es');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.language_rounded, color: Colors.blue),
                title: Text('Inglés', style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                onTap: () {
                  ref.read(localeProvider.notifier).setLocale('en');
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeleteAccountConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
            SizedBox(width: 8),
            Expanded(child: Text('Eliminar cuenta')),
          ],
        ),
        content: const Text(
          'Esta acción es completamente irreversible. Se borrarán todos tus datos personales, tus tours creados, y todas tus configuraciones. ¿Estás absolutamente seguro de que deseas eliminar tu cuenta?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                // Mostrar indicador de carga básico
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (_) => const Center(child: CircularProgressIndicator()),
                );
                
                await ref.read(authServiceProvider).deleteAccount();
                
                if (context.mounted) {
                  Navigator.pop(context); // cerrar dialogo de carga
                  context.go('/login');
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Cuenta eliminada con éxito.'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  Navigator.pop(context); // cerrar dialogo de carga
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(_getFriendlyError(e)),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              }
            },
            child: const Text('Sí, eliminar cuenta'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authUserProvider).valueOrNull;
    final metadata = user?.userMetadata ?? {};
    final name = (metadata['custom_full_name']?.toString() ?? metadata['full_name']?.toString() ?? 'Usuario').split(' ').first;
    final email = user?.email ?? 'correo@ejemplo.com';
    final bio = metadata['bio']?.toString() ?? 'Añade una biografía y tus gustos aquí...';
    final avatarUrl = metadata['custom_avatar_url']?.toString() ?? metadata['avatar_url']?.toString();
    final userRatings = user != null
        ? ref.watch(userRatingsProvider(user.id)).valueOrNull ?? []
        : <UserTourRating>[];
    
    final statsAsync = ref.watch(userStatsProvider);
    ref.watch(tourParticipantsProvider);
    final currency = ref.watch(currencyProvider);
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        cacheExtent: 1500,
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            stretch: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [
                StretchMode.zoomBackground,
                StretchMode.blurBackground,
              ],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppTheme.primary,
                          AppTheme.violet.withValues(alpha: 0.8),
                          AppTheme.primaryDeep,
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: -50,
                    right: -50,
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -30,
                    left: -20,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.05),
                      ),
                    ),
                  ),
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          GestureDetector(
                            onTap: _showAvatarEditSheet,
                            child: Stack(
                              alignment: Alignment.bottomRight,
                              children: [
                                Container(
                                  width: 96,
                                  height: 96,
                                  decoration: BoxDecoration(
                                    color: Colors.white24,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3.5),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.16),
                                        blurRadius: 16,
                                        offset: const Offset(0, 8),
                                      ),
                                    ],
                                    image: avatarUrl != null && avatarUrl.isNotEmpty
                                        ? avatarUrl.startsWith('data:image')
                                            ? DecorationImage(
                                                image: MemoryImage(
                                                  base64Decode(avatarUrl.split(',').last),
                                                ),
                                                fit: BoxFit.cover,
                                              )
                                            : DecorationImage(
                                                image: avatarUrl.startsWith('http')
                                                    ? NetworkImage(avatarUrl)
                                                    : FileImage(File(avatarUrl)) as ImageProvider,
                                                fit: BoxFit.cover,
                                              )
                                        : null,
                                  ),
                                  child: avatarUrl == null || avatarUrl.isEmpty
                                      ? Center(
                                          child: Text(
                                            name.isNotEmpty ? name[0].toUpperCase() : 'U',
                                            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                                              fontSize: 44,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        )
                                      : null,
                                ),
                                Container(
                                  padding: const EdgeInsets.all(5),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.camera_alt_rounded,
                                    size: 16,
                                    color: AppTheme.primaryDeep,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            name,
                             style: Theme.of(context).textTheme.titleLarge?.copyWith(
                               color: Colors.white,
                               fontSize: 24,
                               fontWeight: FontWeight.w900,
                               letterSpacing: -0.5,
                               shadows: [
                                 Shadow(blurRadius: 10, color: Colors.black38),
                               ],
                             ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            email,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.72),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Bio Panel
                GlassPanel(
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Sobre mí',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          if (!_isEditingBio)
                            IconButton.filledTonal(
                              icon: const Icon(Icons.edit_note_rounded, size: 20),
                              onPressed: () {
                                setState(() {
                                  _isEditingBio = true;
                                  _bioController.text = bio;
                                });
                              },
                            )
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (_isEditingBio) ...[
                        TextField(
                          controller: _bioController,
                          maxLines: 3,
                          decoration: InputDecoration(
                            hintText: 'Escribe algo sobre ti...',
                            filled: true,
                            fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _isEditingBio = false;
                                  _bioController.text = bio;
                                });
                              },
                              child: const Text('Cancelar'),
                            ),
                            const SizedBox(width: 8),
                            FilledButton(
                              onPressed: () async {
                                await _saveProfile();
                              },
                              style: FilledButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('Guardar'),
                            ),
                          ],
                        )
                      ] else ...[
                        Text(
                          bio,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                fontStyle: FontStyle.italic,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8),
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Stats
                statsAsync.when(
                  data: (stats) => Row(
                    children: [
                      _StatCard(
                        icon: Icons.map_rounded,
                        iconColor: AppTheme.primary,
                        bgColor: AppTheme.primary.withValues(alpha: 0.1),
                        value: '${stats['createdTours']}',
                        label: l10n.createdTours,
                        onTap: () => _showCreatedToursSheet(context),
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        icon: Icons.star_rounded,
                        iconColor: Colors.amber,
                        bgColor: Colors.amber.withValues(alpha: 0.1),
                        value: '${stats['toursRated']}',
                        label: l10n.toursRated,
                        onTap: () => _showRatedToursSheet(context, userRatings),
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        icon: Icons.people_alt_rounded,
                        iconColor: AppTheme.violet,
                        bgColor: AppTheme.violet.withValues(alpha: 0.1),
                        value: '${stats['participants']}',
                        label: l10n.participants,
                        onTap: () => _showParticipantsSheet(context),
                      ),
                    ],
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.errorContainer.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.wifi_off_rounded, color: Theme.of(context).colorScheme.error, size: 32),
                        const SizedBox(height: 12),
                        Text(
                          _getFriendlyError(err),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.error,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 300.ms),
                ),
                const SizedBox(height: 24),
                
                // Preferences Section
                GlassPanel(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(l10n.preferences),
                      _SettingsListTile(
                        icon: Icons.tune_rounded,
                        iconColor: Colors.blue,
                        title: l10n.prefTravelPreferences,
                        onTap: () => context.push('/tourist_preferences'),
                      ),
                      _SettingsListTile(
                        icon: Icons.workspace_premium_outlined,
                        iconColor: Colors.blue,
                        title: l10n.goPremium,
                        onTap: () {},
                      ),
                      _SettingsListTile(
                        icon: Icons.monetization_on_outlined,
                        iconColor: Colors.teal,
                        title: l10n.currency,
                        trailingText: currency.name.toUpperCase(),
                        onTap: () => _showCurrencySelection(context),
                      ),
                      _SettingsListTile(
                        icon: Icons.translate_rounded,
                        iconColor: Colors.blue,
                        title: l10n.language,
                        trailingText: locale?.languageCode.toUpperCase() ?? 'Auto',
                        onTap: () => _showLanguageSelection(context, l10n),
                      ),
                      const _ThemeToggleTile(),
                      _SettingsListTile(
                        icon: Icons.settings_rounded,
                        iconColor: Colors.blueGrey,
                        title: l10n.settings,
                        onTap: () => context.push('/settings'),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 24),
                
                // Support Section
                GlassPanel(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(l10n.support),
                      _SettingsListTile(
                        icon: Icons.help_outline_rounded,
                        iconColor: Colors.blue,
                        title: l10n.about,
                        onTap: () => context.push('/help'),
                      ),
                      _SettingsListTile(
                        icon: Icons.feedback_outlined,
                        iconColor: Colors.blue,
                        title: l10n.feedback,
                        onTap: () => context.push('/pqrs'),
                      ),
                      _SettingsListTile(
                        icon: Icons.star_border_rounded,
                        iconColor: Colors.pink,
                        title: l10n.rateUs,
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Gracias por ayudar a mejorar VIBETOURS.')),
                          );
                        },
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 24),
                
                // Legal Section
                GlassPanel(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(l10n.legal),
                      _SettingsListTile(
                        icon: Icons.description_outlined,
                        iconColor: Colors.blue,
                        title: l10n.termsOfService,
                        onTap: () async {
                          final url = Uri.parse('https://new-vibe-tours-19hp.vercel.app/?tab=terms');
                          try {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          } catch (e) {
                            debugPrint('Could not launch $url: $e');
                          }
                        },
                      ),
                      _SettingsListTile(
                        icon: Icons.privacy_tip_outlined,
                        iconColor: Colors.blue,
                        title: l10n.privacyPolicy,
                        onTap: () async {
                          final url = Uri.parse('https://new-vibe-tours-19hp.vercel.app/?tab=privacy');
                          try {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          } catch (e) {
                            debugPrint('Could not launch $url: $e');
                          }
                        },
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 400.ms).slideY(begin: 0.05, end: 0),
                
                const SizedBox(height: 32),
                Column(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () async {
                        await ref.read(authServiceProvider).signOut();
                        if (context.mounted) context.go('/login');
                      },
                      icon: const Icon(Icons.logout_rounded, color: Colors.orange, size: 18),
                      label: Text(
                        l10n.logout,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: Colors.orange,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(220, 48),
                        side: BorderSide(color: Colors.orange.withValues(alpha: 0.3)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ).animate().fadeIn(delay: 400.ms, duration: 400.ms),
                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: () => _showDeleteAccountConfirmation(context, ref),
                      icon: const Icon(Icons.person_remove_rounded, color: Colors.redAccent, size: 16),
                      label: Text(
                        'Eliminar cuenta',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: Colors.redAccent,
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.redAccent,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        minimumSize: const Size(220, 48),
                      ),
                    ).animate().fadeIn(delay: 500.ms, duration: 400.ms),
                    if (_appVersion.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text(
                        'Versión $_appVersion',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ).animate().fadeIn(delay: 600.ms, duration: 400.ms),
                    ],
                  ],
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }




  void _showCreatedToursSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Consumer(
                  builder: (context, ref, child) {
                    final userToursAsync = ref.watch(userToursProvider);
                    return Column(
                      children: [
                        const SizedBox(height: 16),
                        Container(
                          width: 40,
                          height: 5,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Tours Creados',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: userToursAsync.when(
                            loading: () => const Center(
                              child: CircularProgressIndicator(),
                            ),
                            error: (err, stack) => Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.error_outline,
                                    color: Theme.of(context).colorScheme.error,
                                    size: 48,
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Error al cargar tours:\n$err',
                                    textAlign: TextAlign.center,
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: Theme.of(context).colorScheme.error,
                                        ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () => ref.invalidate(userToursProvider),
                                    child: const Text('Reintentar'),
                                  ),
                                ],
                              ),
                            ),
                            data: (state) {
                              final tours = state.manualTours;
                              if (tours.isEmpty) {
                                return Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.map_outlined,
                                        size: 48,
                                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Aún no has creado ningún tour.',
                                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                            ),
                                      ),
                                    ],
                                  ),
                                );
                              }
                              return ListView.builder(
                                controller: scrollController,
                                itemCount: tours.length,
                                itemBuilder: (context, index) {
                                  final tour = tours[index];
                                  return _CreatedTourTile(
                                    tour: tour,
                                    onTap: () {
                                      Navigator.pop(context);
                                      context.push('/tours/${tour.id}');
                                    },
                                  );
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showRatedToursSheet(BuildContext context, List<UserTourRating> ratings) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    Container(
                      width: 40,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Tours Calificados',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ratings.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.star_outline_rounded,
                                    size: 48,
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Aun no has calificado ningún tour.',
                                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                        ),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              controller: scrollController,
                              itemCount: ratings.length,
                              itemBuilder: (context, index) {
                                final rating = ratings[index];
                                return _RatedTourTile(
                                  rating: rating,
                                  onTap: () {
                                    Navigator.pop(context);
                                    context.push('/tours/${rating.tour.id}');
                                  },
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showParticipantsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Consumer(
              builder: (context, ref, child) {
                final participantsAsync = ref.watch(tourParticipantsProvider);
                return SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 16),
                        Container(
                          width: 40,
                          height: 5,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Participantes por Tour',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: participantsAsync.when(
                            data: (data) {
                              if (data.isEmpty) {
                                return Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.people_outline_rounded,
                                        size: 48,
                                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'No hay participantes activos en tus tours.',
                                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                            ),
                                      ),
                                    ],
                                  ),
                                );
                              }
                              return ListView.builder(
                                controller: scrollController,
                                itemCount: data.length,
                                itemBuilder: (context, index) {
                                  final item = data[index];
                                  return _TourParticipantsTile(
                                    tourWithParticipants: item,
                                  );
                                },
                              );
                            },
                            loading: () => const Center(
                              child: CircularProgressIndicator(),
                            ),
                            error: (err, stack) => Center(
                              child: Text(
                                'Error al cargar: $err',
                                style: const TextStyle(color: Colors.redAccent),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}

class _TourParticipantsTile extends StatelessWidget {
  const _TourParticipantsTile({required this.tourWithParticipants});
  final TourWithParticipants tourWithParticipants;

  @override
  Widget build(BuildContext context) {
    final tour = tourWithParticipants.tour;
    final participants = tourWithParticipants.participants;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            title: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: CachedNetworkImage(
                    imageUrl: tour.coverUrl,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const SkeletonBox(width: 50, height: 50),
                    errorWidget: (context, url, error) => TravelImageFallback(
                      title: tour.title,
                      icon: Icons.map_rounded,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tour.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${participants.length} ${participants.length == 1 ? "participante" : "participantes"}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.violet,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            children: [
              if (participants.isEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    'No hay participantes todavía.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: participants.length,
                  itemBuilder: (context, index) {
                    final user = participants[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                            backgroundImage: user.avatarUrl.isNotEmpty
                                ? user.avatarUrl.startsWith('data:image')
                                    ? MemoryImage(base64Decode(user.avatarUrl.split(',').last)) as ImageProvider
                                    : NetworkImage(user.avatarUrl)
                                : null,
                            child: user.avatarUrl.isEmpty
                                ? Text(
                                    user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'U',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primary),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              user.fullName,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 200.ms, delay: (index * 50).ms);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreatedTourTile extends StatelessWidget {
  const _CreatedTourTile({required this.tour, required this.onTap});

  final Tour tour;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: CachedNetworkImage(
                    imageUrl: tour.coverUrl,
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const SkeletonBox(width: 70, height: 70),
                    errorWidget: (context, url, error) => TravelImageFallback(
                      title: tour.title,
                      icon: Icons.map_rounded,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tour.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.place_rounded,
                            size: 14,
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.45),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${tour.city}, ${tour.country}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                    fontSize: 12,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: (tour.isPublished ? Colors.green : Colors.orange).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          tour.isPublished ? 'Publicado' : 'En revisión',
                          style: TextStyle(
                            color: tour.isPublished ? Colors.green : Colors.orange,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.value,
    required this.label,
    this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String value;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(20),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: bgColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: iconColor, size: 20),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}

class _SettingsListTile extends StatelessWidget {
  const _SettingsListTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.trailingText,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String? trailingText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
              ),
            ),
            if (trailingText != null) ...[
              Text(
                trailingText!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
            ],
            Icon(
              Icons.chevron_right_rounded,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ],
        ),
      ),
    );
  }
}

class _ThemeToggleTile extends ConsumerWidget {
  const _ThemeToggleTile();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final l10n = AppLocalizations.of(context);

    return InkWell(
      onTap: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Theme.of(context).colorScheme.surface,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          builder: (context) => SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 5,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.brightness_auto_rounded, color: Colors.blue),
                    title: Text(l10n.appearanceSystem, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                    onTap: () {
                      ref.read(themeModeProvider.notifier).setMode(ThemeMode.system);
                      Navigator.pop(context);
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.light_mode_rounded, color: Colors.orange),
                    title: Text(l10n.appearanceLight, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                    onTap: () {
                      ref.read(themeModeProvider.notifier).setMode(ThemeMode.light);
                      Navigator.pop(context);
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.dark_mode_rounded, color: Colors.indigo),
                    title: Text(l10n.appearanceDark, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
                    onTap: () {
                      ref.read(themeModeProvider.notifier).setMode(ThemeMode.dark);
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                themeMode == ThemeMode.dark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                size: 20,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                l10n.appearance,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
              ),
            ),
            Text(
              themeMode == ThemeMode.system
                  ? l10n.appearanceSystem
                  : themeMode == ThemeMode.light
                      ? l10n.appearanceLight
                      : l10n.appearanceDark,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right_rounded,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ],
        ),
      ),
    );
  }
}

class _RatedTourTile extends StatelessWidget {
  const _RatedTourTile({required this.rating, required this.onTap});

  final UserTourRating rating;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: CachedNetworkImage(
                        imageUrl: rating.tour.coverUrl,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const SkeletonBox(width: 60, height: 60),
                        errorWidget: (context, url, error) => TravelImageFallback(
                          title: rating.tour.title,
                          icon: Icons.map_rounded,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            rating.tour.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(
                                Icons.place_rounded,
                                size: 12,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.45),
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  '${rating.tour.city}, ${rating.tour.country}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                        fontSize: 12,
                                      ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          // Estrellas que colocó el usuario
                          Row(
                            children: List.generate(5, (index) {
                              return Icon(
                                Icons.star_rounded,
                                size: 14,
                                color: index < rating.comment.rating ? Colors.amber : Colors.grey.shade300,
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Editar calificación',
                      onPressed: () {
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (context) => TourRatingDialog(
                            tour: rating.tour,
                            existingRating: rating,
                          ),
                        );
                      },
                      icon: Icon(
                        Icons.edit_rounded,
                        size: 22,
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
                if (rating.comment.body.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.04),
                      ),
                    ),
                    child: Text(
                      '"${rating.comment.body}"',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontStyle: FontStyle.italic,
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8),
                          ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

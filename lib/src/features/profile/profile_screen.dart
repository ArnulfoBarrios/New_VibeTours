import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../state/app_state.dart';

final userStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final user = ref.watch(authUserProvider).valueOrNull;
  if (user == null) return {'createdTours': 0, 'participants': 0, 'toursRated': 0};
  return ref.watch(tourRepositoryProvider).getUserStats(user.id);
});

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final TextEditingController _bioController = TextEditingController();
  final TextEditingController _avatarUrlController = TextEditingController();
  bool _isEditingBio = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authUserProvider).valueOrNull;
    if (user != null) {
      _bioController.text = user.userMetadata?['bio']?.toString() ?? '';
      _avatarUrlController.text = user.userMetadata?['avatar_url']?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _bioController.dispose();
    _avatarUrlController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    await ref.read(authServiceProvider).updateUserProfile(
      bio: _bioController.text,
      avatarUrl: _avatarUrlController.text.isNotEmpty ? _avatarUrlController.text : null,
    );
    setState(() {
      _isEditingBio = false;
    });
    // Fuerza recarga del usuario si es necesario actualizando estado local, pero supabase_flutter suele emitir en el stream.
  }

  void _pickFromGallery() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      _avatarUrlController.text = image.path;
      _saveProfile();
      if (mounted) Navigator.pop(context);
    }
  }

  void _showAvatarEditDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Cambiar foto de perfil'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Elegir de la galería'),
                onTap: _pickFromGallery,
              ),
              const Divider(),
              TextField(
                controller: _avatarUrlController,
                decoration: const InputDecoration(
                  labelText: 'URL de la imagen',
                  hintText: 'https://ejemplo.com/foto.jpg',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _saveProfile();
              },
              child: const Text('Guardar URL'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authUserProvider).valueOrNull;
    final metadata = user?.userMetadata ?? {};
    final name = metadata['full_name']?.toString().split(' ').first ?? 'Usuario';
    final email = user?.email ?? 'correo@ejemplo.com';
    final bio = metadata['bio']?.toString() ?? 'Añade una biografía y tus gustos aquí...';
    final avatarUrl = metadata['avatar_url']?.toString();
    
    final statsAsync = ref.watch(userStatsProvider);
    final currency = ref.watch(currencyProvider);
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
          children: [
            Text(
              l10n.profile,
              style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 32),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      GestureDetector(
                        onTap: _showAvatarEditDialog,
                        child: Stack(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.5),
                                shape: BoxShape.circle,
                                image: avatarUrl != null && avatarUrl.isNotEmpty
                                    ? DecorationImage(
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
                                        style: const TextStyle(
                                          fontSize: 36,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.edit, size: 14, color: Colors.white),
                              ),
                            )
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 20),
                            ),
                            Text(
                              email,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_isEditingBio) ...[
                    TextField(
                      controller: _bioController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Biografía',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
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
                        ElevatedButton(
                          onPressed: _saveProfile,
                          child: const Text('Guardar'),
                        ),
                      ],
                    )
                  ] else ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            bio,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit_note, size: 20),
                          onPressed: () {
                            setState(() {
                              _isEditingBio = true;
                              _bioController.text = bio;
                            });
                          },
                        )
                      ],
                    ),
                  ],
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  statsAsync.when(
                    data: (stats) => Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _StatItem(value: '${stats['createdTours']}', label: l10n.createdTours),
                        _StatItem(value: '${stats['toursRated']}', label: l10n.toursRated),
                        _StatItem(value: '${stats['participants']}', label: l10n.participants),
                      ],
                    ),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, stack) => Text(l10n.errorLoadingStats),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _SectionTitle(l10n.preferences),
            _SettingsListTile(icon: Icons.workspace_premium_outlined, title: l10n.goPremium, onTap: () {}),
            _SettingsListTile(
              icon: Icons.monetization_on_outlined, 
              title: l10n.currency, 
              trailingText: currency.name.toUpperCase(), 
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  builder: (context) => SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ListTile(
                          title: const Text('Dólares (USD)'),
                          onTap: () {
                            ref.read(currencyProvider.notifier).setCurrency(AppCurrency.usd);
                            Navigator.pop(context);
                          },
                        ),
                        ListTile(
                          title: const Text('Euros (EUR)'),
                          onTap: () {
                            ref.read(currencyProvider.notifier).setCurrency(AppCurrency.eur);
                            Navigator.pop(context);
                          },
                        ),
                        ListTile(
                          title: const Text('Pesos Colombianos (COP)'),
                          onTap: () {
                            ref.read(currencyProvider.notifier).setCurrency(AppCurrency.cop);
                            Navigator.pop(context);
                          },
                        ),
                      ],
                    ),
                  )
                );
              }
            ),
            _SettingsListTile(
              icon: Icons.translate_rounded, 
              title: l10n.language, 
              trailingText: locale?.languageCode.toUpperCase() ?? 'Auto',
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  builder: (context) => SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ListTile(
                          title: Text('Automático (${l10n.appearanceSystem})'),
                          onTap: () {
                            ref.read(localeProvider.notifier).setLocale('system');
                            Navigator.pop(context);
                          },
                        ),
                        ListTile(
                          title: const Text('Español'),
                          onTap: () {
                            ref.read(localeProvider.notifier).setLocale('es');
                            Navigator.pop(context);
                          },
                        ),
                        ListTile(
                          title: const Text('Inglés'),
                          onTap: () {
                            ref.read(localeProvider.notifier).setLocale('en');
                            Navigator.pop(context);
                          },
                        ),
                      ],
                    ),
                  )
                );
              }
            ),
            const _ThemeToggleTile(),
            
            const SizedBox(height: 24),
            _SectionTitle(l10n.support),
            _SettingsListTile(icon: Icons.help_outline_rounded, title: l10n.about, onTap: () => context.push('/help')),
            _SettingsListTile(icon: Icons.feedback_outlined, title: l10n.feedback, onTap: () => context.push('/pqrs')),
            _SettingsListTile(icon: Icons.star_border_rounded, title: l10n.rateUs, onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Gracias por ayudar a mejorar VIBETOURS.')),
              );
            }),
            
            const SizedBox(height: 24),
            _SectionTitle(l10n.legal),
            _SettingsListTile(icon: Icons.description_outlined, title: l10n.termsOfService, onTap: () => context.push('/legal/terms')),
            _SettingsListTile(icon: Icons.privacy_tip_outlined, title: l10n.privacyPolicy, onTap: () => context.push('/legal/privacy')),
            
            const SizedBox(height: 32),
            Center(
              child: TextButton(
                onPressed: () async {
                  await ref.read(authServiceProvider).signOut();
                  if (context.mounted) context.go('/login');
                },
                child: Text(l10n.logout, style: const TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 22, fontWeight: FontWeight.w800),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                fontSize: 12,
              ),
        ),
      ],
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
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _SettingsListTile extends StatelessWidget {
  const _SettingsListTile({
    required this.icon,
    required this.title,
    this.trailingText,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? trailingText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
        child: Row(
          children: [
            Icon(icon, size: 24, color: Theme.of(context).colorScheme.onSurface),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            if (trailingText != null) ...[
              Text(
                trailingText!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
              ),
              const SizedBox(width: 8),
            ],
            Icon(Icons.chevron_right_rounded, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
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
          builder: (context) => SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.brightness_auto),
                  title: Text(l10n.appearanceSystem),
                  onTap: () {
                    ref.read(themeModeProvider.notifier).setMode(ThemeMode.system);
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.light_mode),
                  title: Text(l10n.appearanceLight),
                  onTap: () {
                    ref.read(themeModeProvider.notifier).setMode(ThemeMode.light);
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.dark_mode),
                  title: Text(l10n.appearanceDark),
                  onTap: () {
                    ref.read(themeModeProvider.notifier).setMode(ThemeMode.dark);
                    Navigator.pop(context);
                  },
                ),
              ],
            ),
          )
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
        child: Row(
          children: [
            Icon(
              themeMode == ThemeMode.dark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
              size: 24,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                AppLocalizations.of(context).appearance,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
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
                  ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.chevron_right_rounded, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
          ],
        ),
      ),
    );
  }
}

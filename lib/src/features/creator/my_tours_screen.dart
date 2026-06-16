import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../core/design/vibe_logo.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';

class MyToursScreen extends ConsumerStatefulWidget {
  const MyToursScreen({super.key});

  @override
  ConsumerState<MyToursScreen> createState() => _MyToursScreenState();
}

class _MyToursScreenState extends ConsumerState<MyToursScreen> {
  @override
  Widget build(BuildContext context) {
    final localToursAsync = ref.watch(userToursProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 124),
      children: [
        const _MyToursTopBar(),
        const SizedBox(height: 26),
        Text('My Tours', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(
          'Manage your personalized journeys and AI-curated routes.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 30),
        Row(
          children: [
            Expanded(
              child: _CreateModeCard(
                label: 'Manual Create',
                icon: Icons.add_circle_outline_rounded,
                isSelected: true,
                onTap: () => context.push('/creator/manual'),
              ),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: _CreateModeCard(
                label: 'AI Guided\nCreate',
                icon: Icons.auto_awesome_rounded,
                onTap: () => context.push('/creator/ai'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 34),
        localToursAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => EmptyState(
            icon: Icons.error_outline_rounded,
            title: 'No pudimos cargar tus tours',
            body: error.toString(),
          ),
          data: (localState) {
            final cards = [
              for (final tour in localState.manualTours.reversed)
                _OwnedTourData(
                  tour: tour,
                  title: tour.title,
                  description: tour.description,
                  status: tour.isPublished ? 'Approved' : 'Pending',
                ),
            ];
            if (cards.isEmpty) {
              return const EmptyState(
                icon: Icons.confirmation_number_rounded,
                title: 'Aun no tienes tours',
                body: 'Crea tu primer recorrido manual o con IA.',
              );
            }
            return Column(
              children: [
                for (final card in cards) ...[
                  _OwnedTourCard(
                    data: card,
                    onView: () {
                      ref.read(selectedTourProvider.notifier).state = card.tour;
                      context.push('/tours/${card.tour.id}');
                    },
                    onEdit: () {
                      ref.read(selectedTourProvider.notifier).state = card.tour;
                      context.push('/creator/manual');
                    },
                    onStart: card.isApproved
                        ? () {
                            ref.read(selectedTourProvider.notifier).state =
                                card.tour;
                            context.push('/live/${card.tour.id}');
                          }
                        : null,
                    onDelete: () async {
                      try {
                        await ref
                            .read(userToursProvider.notifier)
                            .deleteTour(card.tour);
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${card.title} eliminado')),
                        );
                      } catch (_) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'No se pudo eliminar el tour. Revisa permisos o conexion.',
                            ),
                          ),
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 22),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

class _MyToursTopBar extends StatelessWidget {
  const _MyToursTopBar();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 15,
          backgroundColor: AppTheme.primary.withValues(alpha: 0.18),
          child: const Icon(Icons.person_rounded, size: 18),
        ),
        const SizedBox(width: 16),
        const VibeLogoMark(size: 30),
        const Spacer(),
        IconButton(
          tooltip: 'Buscar',
          onPressed: () => context.push('/tours'),
          icon: const Icon(Icons.search_rounded),
        ),
      ],
    );
  }
}

class _CreateModeCard extends StatelessWidget {
  const _CreateModeCard({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isSelected = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    final foreground = isSelected
        ? const Color(0xFF071934)
        : Theme.of(context).colorScheme.onSurface;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 116,
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFA9C6FF)
              : Theme.of(context).colorScheme.surface.withValues(alpha: 0.62),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? Colors.white.withValues(alpha: 0.40)
                : Colors.white.withValues(alpha: 0.10),
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.24),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: foreground, size: 26),
            const SizedBox(height: 14),
            Text(
              label,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(color: foreground, height: 1.25),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnedTourCard extends StatelessWidget {
  const _OwnedTourCard({
    required this.data,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
    this.onStart,
  });

  final _OwnedTourData data;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback? onStart;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xFF111827).withValues(alpha: 0.92),
          border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 168,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: data.tour.coverUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const SkeletonBox(),
                    errorWidget: (context, url, error) =>
                        TravelImageFallback(title: data.title),
                  ),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.05),
                          Colors.black.withValues(alpha: 0.52),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 16,
                    left: 16,
                    child: _StatusPill(
                      label: data.status,
                      icon: data.isApproved
                          ? Icons.check_circle_outline_rounded
                          : Icons.pending_outlined,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    data.title,
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    data.description,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.72),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: _TourActionButton(
                          label: 'View Route',
                          icon: Icons.map_outlined,
                          onPressed: onView,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _TourActionButton(
                          label: 'Edit Route',
                          icon: Icons.edit_rounded,
                          onPressed: onEdit,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _TourActionButton(
                          label: 'Start Tour',
                          icon: Icons.play_arrow_rounded,
                          isPrimary: true,
                          onPressed: onStart,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _TourActionButton(
                          label: 'Delete',
                          icon: Icons.delete_outline_rounded,
                          isDanger: true,
                          onPressed: onDelete,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TourActionButton extends StatelessWidget {
  const _TourActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isPrimary = false,
    this.isDanger = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final bool isDanger;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final background = isDanger
        ? const Color(0xFF471221)
        : isPrimary
        ? AppTheme.primary
        : Colors.white.withValues(alpha: 0.08);
    final foreground = isDanger
        ? const Color(0xFFFFC2CC)
        : isPrimary
        ? Colors.white
        : Colors.white.withValues(alpha: 0.88);
    return FilledButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 17),
      label: FittedBox(fit: BoxFit.scaleDown, child: Text(label, maxLines: 1)),
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 48),
        backgroundColor: enabled
            ? background
            : AppTheme.primaryDeep.withValues(alpha: 0.62),
        foregroundColor: enabled ? foreground : Colors.white54,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF1C2D46).withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: Colors.white),
            const SizedBox(width: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Colors.white,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnedTourData {
  const _OwnedTourData({
    required this.tour,
    required this.title,
    required this.description,
    required this.status,
  });

  final Tour tour;
  final String title;
  final String description;
  final String status;

  bool get isApproved => status == 'Approved';
}

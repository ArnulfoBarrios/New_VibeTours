import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';
import '../../state/live_tour_state.dart';

class AudioMiniPlayerWidget extends ConsumerWidget {
  const AudioMiniPlayerWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(authUserProvider).valueOrNull;
    final currentUserId = currentUser?.id ?? 'guest';
    final playbackState = ref.watch(liveTourPlaybackProvider);
    final tour = playbackState.tour;

    if (!playbackState.isLiveActive || tour == null || playbackState.userId != currentUserId) {
      return const SizedBox.shrink();
    }

    final currentStop = playbackState.currentStop;
    final stopTitle = currentStop != null
        ? currentStop.name
        : 'Parada ${playbackState.currentStopIndex + 1}';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF1C1C1E).withValues(alpha: 0.90)
                  : const Color(0xFFFFFFFF).withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: (isDark ? Colors.white : AppTheme.primary).withValues(alpha: 0.15),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  context.push('/live/${tour.id}');
                },
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: tour.coverUrl.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: tour.coverUrl,
                                  fit: BoxFit.cover,
                                  errorWidget: (context, url, error) =>
                                      const Icon(Icons.tour_rounded, size: 24),
                                )
                              : const Icon(Icons.tour_rounded, size: 24),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Colors.greenAccent,
                                    shape: BoxShape.circle,
                                  ),
                                ).animate(onPlay: (c) => c.repeat()).fade(duration: 800.ms),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    tour.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: isDark ? Colors.white60 : Colors.black54,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              stopTitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      InteractiveBounce(
                        onTap: () {
                          final nextPlaying = !playbackState.isPlaying;
                          ref
                              .read(liveTourPlaybackProvider.notifier)
                              .setPlaying(nextPlaying);
                          if (!nextPlaying) {
                            ref.read(voiceGuideProvider).stop();
                          } else if (currentStop != null) {
                            ref
                                .read(voiceGuideProvider)
                                .narrateStop(currentStop, lang: tour.language);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            playbackState.isPlaying
                                ? Icons.pause_rounded
                                : Icons.play_arrow_rounded,
                            color: AppTheme.primary,
                            size: 24,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        color: isDark ? Colors.white54 : Colors.black45,
                        visualDensity: VisualDensity.compact,
                        onPressed: () {
                          ref.read(voiceGuideProvider).stop();
                          ref.read(liveTourPlaybackProvider.notifier).stopTour();
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ).animate().slideY(begin: 1.0, end: 0, duration: 250.ms, curve: Curves.easeOutCubic);
  }
}

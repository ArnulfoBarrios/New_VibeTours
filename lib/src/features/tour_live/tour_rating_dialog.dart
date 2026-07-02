import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';

class TourRatingDialog extends ConsumerStatefulWidget {
  const TourRatingDialog({super.key, required this.tour, this.existingRating});

  final Tour tour;
  final UserTourRating? existingRating;

  @override
  ConsumerState<TourRatingDialog> createState() => _TourRatingDialogState();
}

class _TourRatingDialogState extends ConsumerState<TourRatingDialog> {
  int _rating = 0;
  late TextEditingController _commentController;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _rating = widget.existingRating?.comment.rating ?? 0;
    _commentController = TextEditingController(text: widget.existingRating?.comment.body ?? '');
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassPanel(
        padding: const EdgeInsets.all(24),
        radius: 28,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Califica esta experiencia',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              widget.tour.title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final isSelected = index < _rating;
                return GestureDetector(
                  onTap: _submitting
                      ? null
                      : () {
                          setState(() {
                            _rating = index + 1;
                          });
                        },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      Icons.star_rounded,
                      size: 42,
                      color: isSelected ? AppTheme.primary : Theme.of(context).colorScheme.surfaceContainerHighest,
                    )
                        .animate(target: isSelected ? 1 : 0)
                        .scaleXY(end: 1.2, duration: 150.ms, curve: Curves.easeOutBack)
                        .then()
                        .scaleXY(end: 1.0, duration: 150.ms, curve: Curves.easeInOut),
                  ),
                );
              }),
            ),
            const SizedBox(height: 24),
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _commentController,
                maxLines: 4,
                enabled: !_submitting,
                decoration: InputDecoration(
                  hintText: 'Escribe un comentario...',
                  hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
                  prefixIcon: Icon(
                    Icons.edit_note_rounded,
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: LiquidButton(
                    label: 'Cancelar',
                    icon: Icons.close_rounded,
                    isPrimary: false,
                    onPressed: _submitting
                        ? null
                        : () {
                            context.pop();
                            context.pop(); // Pop the dialog and the live tour screen
                          },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: LiquidButton(
                    label: _submitting ? 'Enviando...' : 'Enviar',
                    icon: Icons.send_rounded,
                    isPrimary: true,
                    onPressed: _submitting
                        ? null
                        : () async {
                            if (_rating == 0) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Por favor selecciona una calificacion en estrellas.'),
                                  backgroundColor: Colors.redAccent,
                                ),
                              );
                              return;
                            }
                            setState(() => _submitting = true);
                            try {
                              await ref.read(tourRepositoryProvider).submitTourReview(
                                    tourId: widget.tour.id,
                                    rating: _rating,
                                    body: _commentController.text.trim(),
                                  );
                              // Refrescar providers de tours, comentarios y stats
                              ref.invalidate(toursProvider);
                              ref.invalidate(tourCommentsProvider(widget.tour.id));
                              ref.invalidate(userStatsProvider);
                              final currentUser = ref.read(authServiceProvider).currentUser;
                              if (currentUser != null) {
                                ref.invalidate(userRatingsProvider(currentUser.id));
                              }
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('¡Muchas gracias por tu calificacion!'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                              context.pop();
                              context.pop(); // Cerrar dialogo y terminar tour en vivo
                            } catch (e) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Error al enviar calificacion: $e'),
                                  backgroundColor: Colors.redAccent,
                                ),
                              );
                            } finally {
                              if (mounted) {
                                setState(() => _submitting = false);
                              }
                            }
                          },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';

class TourRatingDialog extends StatefulWidget {
  const TourRatingDialog({super.key, required this.tour});

  final Tour tour;

  @override
  State<TourRatingDialog> createState() => _TourRatingDialogState();
}

class _TourRatingDialogState extends State<TourRatingDialog> {
  int _rating = 0;
  final TextEditingController _commentController = TextEditingController();

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
                  onTap: () {
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
                    onPressed: () {
                      context.pop();
                      context.pop(); // Pop the dialog and the live tour screen
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: LiquidButton(
                    label: 'Enviar',
                    icon: Icons.send_rounded,
                    isPrimary: true,
                    onPressed: () {
                      // Submit rating logic could go here
                      context.pop();
                      context.pop(); // Pop the dialog and the live tour screen
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

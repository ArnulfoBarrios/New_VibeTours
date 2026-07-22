import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

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
  final List<XFile> _selectedPhotos = [];
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

  Future<void> _pickPhotos() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage(
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 75,
    );
    if (images.isNotEmpty) {
      setState(() {
        _selectedPhotos.addAll(images);
      });
    }
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
        child: SingleChildScrollView(
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
              const SizedBox(height: 20),
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
                        size: 40,
                        color: isSelected
                            ? AppTheme.primary
                            : Theme.of(context).colorScheme.surfaceContainerHighest,
                      )
                          .animate(target: isSelected ? 1 : 0)
                          .scaleXY(end: 1.2, duration: 150.ms, curve: Curves.easeOutBack)
                          .then()
                          .scaleXY(end: 1.0, duration: 150.ms, curve: Curves.easeInOut),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: TextField(
                  controller: _commentController,
                  maxLines: 3,
                  enabled: !_submitting,
                  decoration: InputDecoration(
                    hintText: 'Escribe un comentario sobre tu viaje...',
                    hintStyle: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                    ),
                    prefixIcon: Icon(
                      Icons.edit_note_rounded,
                      color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.all(16),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Fotos de tu recorrido',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  TextButton.icon(
                    onPressed: _submitting ? null : _pickPhotos,
                    icon: const Icon(Icons.add_a_photo_rounded, size: 18),
                    label: const Text('Agregar'),
                  ),
                ],
              ),
              if (_selectedPhotos.isNotEmpty) ...[
                const SizedBox(height: 8),
                SizedBox(
                  height: 72,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _selectedPhotos.length,
                    itemBuilder: (context, index) {
                      final photo = _selectedPhotos[index];
                      return Stack(
                        children: [
                          Container(
                            margin: const EdgeInsets.only(right: 10, top: 4),
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              image: DecorationImage(
                                image: FileImage(File(photo.path)),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            top: 0,
                            right: 6,
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedPhotos.removeAt(index);
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ],
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
                              context.pop();
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
                                final photoDataUrls = <String>[];
                                for (final photo in _selectedPhotos) {
                                  final bytes = await File(photo.path).readAsBytes();
                                  final base64String = base64Encode(bytes);
                                  photoDataUrls.add('data:image/jpeg;base64,$base64String');
                                }

                                await ref.read(tourRepositoryProvider).submitTourReview(
                                      tourId: widget.tour.id,
                                      rating: _rating,
                                      body: _commentController.text.trim(),
                                      photos: photoDataUrls,
                                    );
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
                                context.pop();
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
      ),
    );
  }
}

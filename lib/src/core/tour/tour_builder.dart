import 'package:flutter/material.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import 'widgets/tour_tooltip_card.dart';

class TourStepItem {
  const TourStepItem({
    required this.key,
    required this.title,
    required this.description,
    this.icon,
    this.shape = ShapeLightFocus.RRect,
    this.radius = 16.0,
    this.align = ContentAlign.bottom,
    this.scrollAlignment,
  });

  final GlobalKey key;
  final String title;
  final String description;
  final IconData? icon;
  final ShapeLightFocus shape;
  final double radius;
  final ContentAlign align;
  final double? scrollAlignment;
}

class TourBuilder {
  static double resolveScrollAlignment(TourStepItem step) {
    if (step.scrollAlignment != null) return step.scrollAlignment!;
    return step.align == ContentAlign.top ? 0.78 : 0.12;
  }

  static TutorialCoachMark createVibeTour({
    required BuildContext context,
    required List<TourStepItem> steps,
    required VoidCallback onFinish,
    required VoidCallback onSkip,
  }) {
    final targets = <TargetFocus>[];

    for (var i = 0; i < steps.length; i++) {
      final step = steps[i];
      final isLast = i == steps.length - 1;

      targets.add(
        TargetFocus(
          identify: 'vibe_tour_step_$i',
          keyTarget: step.key,
          shape: step.shape,
          radius: step.radius,
          contents: [
            TargetContent(
              align: step.align,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              builder: (ctx, controller) {
                return Center(
                  child: TourTooltipCard(
                    currentStep: i + 1,
                    totalSteps: steps.length,
                    title: step.title,
                    description: step.description,
                    icon: step.icon,
                    isLast: isLast,
                    onNext: () async {
                      if (isLast) {
                        controller.skip();
                        onFinish();
                      } else {
                        final nextStep = steps[i + 1];
                        final nextKey = nextStep.key;
                        if (nextKey.currentContext != null) {
                          try {
                            final targetAlign = resolveScrollAlignment(nextStep);
                            await Scrollable.ensureVisible(
                              nextKey.currentContext!,
                              duration: const Duration(milliseconds: 320),
                              curve: Curves.easeInOut,
                              alignment: targetAlign,
                            );
                            await Future<void>.delayed(const Duration(milliseconds: 80));
                          } catch (_) {}
                        }
                        controller.next();
                      }
                    },
                    onPrevious: i > 0
                        ? () async {
                            final prevStep = steps[i - 1];
                            final prevKey = prevStep.key;
                            if (prevKey.currentContext != null) {
                              try {
                                final targetAlign = resolveScrollAlignment(prevStep);
                                await Scrollable.ensureVisible(
                                  prevKey.currentContext!,
                                  duration: const Duration(milliseconds: 320),
                                  curve: Curves.easeInOut,
                                  alignment: targetAlign,
                                );
                                await Future<void>.delayed(const Duration(milliseconds: 80));
                              } catch (_) {}
                            }
                            controller.previous();
                          }
                        : null,
                    onSkip: () {
                      controller.skip();
                      onSkip();
                    },
                  ),
                );
              },
            ),
          ],
        ),
      );
    }

    return TutorialCoachMark(
      targets: targets,
      colorShadow: Colors.black,
      opacityShadow: 0.78,
      hideSkip: true,
      paddingFocus: 8,
      focusAnimationDuration: const Duration(milliseconds: 320),
      pulseAnimationDuration: const Duration(milliseconds: 600),
      pulseEnable: true,
      onFinish: onFinish,
      onSkip: () {
        onSkip();
        return true;
      },
    );
  }
}

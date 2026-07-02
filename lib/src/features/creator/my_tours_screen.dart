import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../state/app_state.dart';

class MyToursScreen extends ConsumerWidget {
  const MyToursScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider).valueOrNull;
    final name = user?.userMetadata?['custom_full_name']?.toString().split(' ').first ?? user?.userMetadata?['full_name']?.toString().split(' ').first ?? 'Ehrnesto';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          children: [
            const SizedBox(height: 24),
            const _HeaderCollage(),
            const SizedBox(height: 24),
            Text(
              'Hola $name,\n¿qué quieres\nexperimentar?',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 36,
                  ),
            ).animate().fadeIn().slideY(begin: 0.1),
            const SizedBox(height: 48),
            const _PromptBox().animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),
            const SizedBox(height: 32),
            Center(
              child: Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(Icons.mic_none_rounded, size: 28, color: Theme.of(context).colorScheme.onSurface),
                ),
              ),
            ).animate().fadeIn(delay: 200.ms).scale(begin: const Offset(0.8, 0.8)),
          ],
        ),
      ),
    );
  }
}

class _HeaderCollage extends StatelessWidget {
  const _HeaderCollage();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: MediaQuery.of(context).size.width / 2 - 110,
            top: 20,
            child: Transform.rotate(
              angle: -0.2,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey.shade300,
                  child: Image.network(
                    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=300&q=80',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ).animate().fadeIn().slideX(begin: 0.2),
          Positioned(
            right: MediaQuery.of(context).size.width / 2 - 110,
            top: 20,
            child: Transform.rotate(
              angle: 0.2,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey.shade300,
                  child: Image.network(
                    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=300&q=80',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ).animate().fadeIn().slideX(begin: -0.2),
          Positioned(
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.network(
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ).animate().fadeIn().scale(begin: const Offset(0.8, 0.8)),
        ],
      ),
    );
  }
}

class _PromptBox extends StatelessWidget {
  const _PromptBox();

  @override
  Widget build(BuildContext context) {
    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Un recorrido de 2 semanas por Italia: Roma, Florencia y la Costa Amalfitana...',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 48),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.attach_file_rounded),
                onPressed: () {},
                color: Theme.of(context).colorScheme.onSurface,
              ),
              GestureDetector(
                onTap: () => context.go('/creator/ai'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    children: [
                      Text(
                        'Comenzar',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 18,
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

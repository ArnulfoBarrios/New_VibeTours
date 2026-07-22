import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';

import 'package:go_router/go_router.dart';

import 'audio_mini_player.dart';

class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PremiumScaffold(
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AudioMiniPlayerWidget(),
          VibeBottomNav(
            currentIndex: navigationShell.currentIndex,
            onChanged: (index) {
              ref.read(selectedTabProvider.notifier).state = index;
              navigationShell.goBranch(
                index,
                initialLocation: index == navigationShell.currentIndex,
              );
            },
          ),
        ],
      ),
      child: navigationShell,
    );
  }
}


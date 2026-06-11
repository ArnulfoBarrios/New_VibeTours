import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';

class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.currentIndex, required this.child});

  final int currentIndex;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PremiumScaffold(
      bottomNavigationBar: VibeBottomNav(
        currentIndex: currentIndex,
        onChanged: (index) =>
            ref.read(selectedTabProvider.notifier).state = index,
      ),
      child: child,
    );
  }
}

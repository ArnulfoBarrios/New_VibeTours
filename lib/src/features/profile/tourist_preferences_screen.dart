import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';

class TouristPreferencesScreen extends ConsumerStatefulWidget {
  const TouristPreferencesScreen({super.key, this.isOnboarding = false});

  final bool isOnboarding;

  @override
  ConsumerState<TouristPreferencesScreen> createState() => _TouristPreferencesScreenState();
}

class _TouristPreferencesScreenState extends ConsumerState<TouristPreferencesScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  String _travelerType = '';
  bool _hasChildren = false;
  String _budget = '';
  String _preferredPace = '';
  final Set<String> _interests = {};

  final List<String> _travelerTypes = ['Solo', 'Pareja', 'Amigos', 'Familia'];
  final List<String> _budgets = ['Económico', 'Moderado', 'Lujo'];
  final List<String> _availableInterests = [
    'Playas', 'Naturaleza', 'Museos', 'Monumentos históricos',
    'Gastronomía', 'Compras', 'Vida nocturna', 'Aventuras', 'Actividades familiares'
  ];

  @override
  void initState() {
    super.initState();
    // Load existing preferences if not onboarding
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profile = ref.read(touristProfileProvider).valueOrNull;
      if (profile != null && profile.isReady) {
        setState(() {
          _travelerType = profile.travelerType;
          _hasChildren = profile.hasChildren;
          _budget = profile.budget;
          _preferredPace = profile.preferredPace;
          _interests.addAll(profile.interests);
        });
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 3) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _saveAndFinish();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else if (!widget.isOnboarding) {
      context.pop();
    }
  }

  bool _canProceed() {
    if (_currentPage == 0) return _travelerType.isNotEmpty;
    if (_currentPage == 1) return _budget.isNotEmpty;
    if (_currentPage == 2) return _preferredPace.isNotEmpty;
    if (_currentPage == 3) return _interests.isNotEmpty;
    return false;
  }

  Future<void> _saveAndFinish() async {
    await ref.read(touristProfileProvider.notifier).updatePreferences(
      travelerType: _travelerType,
      budget: _budget,
      companionType: _travelerType, // Simplify companion as travelerType
      hasChildren: _hasChildren,
      interests: _interests.toList(),
      preferredPace: _preferredPace,
    );
    
    if (mounted) {
      if (widget.isOnboarding) {
        await ref.read(onboardingCompleteProvider.notifier).complete();
      }
      
      final prompt = 'Quiero un viaje para ${_travelerType.toLowerCase()} con presupuesto ${_budget.toLowerCase()}, a un ritmo ${_preferredPace.toLowerCase()}, enfocado en ${_interests.join(', ')}.';
      ref.read(aiPromptProvider.notifier).state = prompt;
      ref.read(aiPromptAutoStartProvider.notifier).state = true;
      
      if (mounted) {
        context.go('/creator');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Se asume que detrás hay un mapa si se usa Stack en MainShell o un fondo general
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  if (!widget.isOnboarding || _currentPage > 0)
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                      onPressed: _previousPage,
                    ),
                  Expanded(
                    child: GlassPanel(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      radius: 999,
                      child: Text(
                        'Paso ${_currentPage + 1} de 4',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  if (!widget.isOnboarding && _currentPage == 0)
                    const SizedBox(width: 48), // Balance for lack of back button
                ],
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (int page) => setState(() => _currentPage = page),
                children: [
                  _buildStep1Traveler(),
                  _buildStep2Budget(),
                  _buildStep3Pace(),
                  _buildStep4Interests(),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: LiquidButton(
                label: _currentPage == 3 ? 'Completar Perfil' : 'Siguiente',
                icon: _currentPage == 3 ? Icons.check_circle_rounded : Icons.arrow_forward_rounded,
                onPressed: _canProceed() ? _nextPage : null,
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStep1Traveler() {
    return _WizardPanel(
      title: '¿Con quién viajas?',
      subtitle: 'Ayúdanos a adaptar las recomendaciones al tamaño de tu grupo.',
      child: Column(
        children: [
          ..._travelerTypes.map((type) => _RadioTile(
                title: type,
                isSelected: _travelerType == type,
                onTap: () => setState(() {
                  _travelerType = type;
                  if (type == 'Solo' || type == 'Amigos') _hasChildren = false;
                }),
              )),
          if (_travelerType == 'Pareja' || _travelerType == 'Familia') ...[
            const SizedBox(height: 24),
            SwitchListTile(
              title: const Text('¿Viajas con niños?'),
              value: _hasChildren,
              onChanged: (val) => setState(() => _hasChildren = val),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              tileColor: Theme.of(context).colorScheme.surface.withValues(alpha: 0.5),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildStep2Budget() {
    return _WizardPanel(
      title: 'Tu presupuesto ideal',
      subtitle: 'Nos ayudará a sugerirte restaurantes, compras y actividades adecuadas.',
      child: Column(
        children: _budgets.map((b) => _RadioTile(
          title: b,
          isSelected: _budget == b,
          onTap: () => setState(() => _budget = b),
        )).toList(),
      ),
    );
  }

  Widget _buildStep3Pace() {
    return _WizardPanel(
      title: 'Ritmo de viaje',
      subtitle: '¿Prefieres tomarte tu tiempo o verlo todo?',
      child: Column(
        children: [
          _RadioTile(
            title: 'Relajado',
            subtitle: 'Pocas actividades por día, mucho tiempo libre.',
            isSelected: _preferredPace == 'Relajado',
            onTap: () => setState(() => _preferredPace = 'Relajado'),
          ),
          _RadioTile(
            title: 'Equilibrado',
            subtitle: 'Una buena mezcla entre actividades y descanso.',
            isSelected: _preferredPace == 'Equilibrado',
            onTap: () => setState(() => _preferredPace = 'Equilibrado'),
          ),
          _RadioTile(
            title: 'Intenso',
            subtitle: 'Días llenos de acción para ver lo máximo posible.',
            isSelected: _preferredPace == 'Intenso',
            onTap: () => setState(() => _preferredPace = 'Intenso'),
          ),
        ],
      ),
    );
  }

  Widget _buildStep4Interests() {
    return _WizardPanel(
      title: 'Tus Intereses',
      subtitle: 'Selecciona todas las temáticas que te apasionan.',
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: _availableInterests.map((interest) {
          final isSelected = _interests.contains(interest);
          return FilterChip(
            label: Text(interest),
            selected: isSelected,
            onSelected: (selected) {
              setState(() {
                if (selected) {
                  _interests.add(interest);
                } else {
                  _interests.remove(interest);
                }
              });
            },
            selectedColor: AppTheme.primary.withValues(alpha: 0.3),
            checkmarkColor: AppTheme.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          );
        }).toList(),
      ),
    );
  }
}

class _WizardPanel extends StatelessWidget {
  const _WizardPanel({required this.title, required this.subtitle, required this.child});
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: GlassPanel(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 32),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _RadioTile extends StatelessWidget {
  const _RadioTile({required this.title, this.subtitle, required this.isSelected, required this.onTap});
  final String title;
  final String? subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected 
                ? AppTheme.primary.withValues(alpha: 0.1) 
                : Theme.of(context).colorScheme.surface.withValues(alpha: 0.4),
            border: Border.all(
              color: isSelected ? AppTheme.primary : Colors.transparent,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                color: isSelected ? AppTheme.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
                    ]
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

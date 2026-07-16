import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';
import '../../state/app_state.dart';
import '../../domain/models.dart';
import '../../l10n/generated/app_localizations.dart';
import '../shared/location_disclosure_dialog.dart';

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
  String _transportPreference = '';
  String _preferredTimeOfDay = '';
  final Set<TouristInterest> _interests = {};

  final List<String> _travelerTypes = ['Solo', 'Pareja', 'Amigos', 'Familia'];
  final List<String> _budgets = ['Económico', 'Moderado', 'Lujo'];
  final List<String> _transportTypes = ['Caminando', 'Transporte Público', 'Auto Rentado', 'Taxis/Apps'];
  final List<String> _timeOfDays = ['Mañanas', 'Tardes', 'Noches'];
  final List<TouristInterest> _availableInterests = TouristInterest.values;

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
          _transportPreference = profile.transportPreference;
          _preferredTimeOfDay = profile.preferredTimeOfDay;
          _interests.addAll(profile.interests);
        });
      }
    });
  }

  String _tx(String key) {
    final l = AppLocalizations.of(context);
    switch (key) {
      case 'Solo': return l.prefSolo;
      case 'Pareja': return l.prefCouple;
      case 'Amigos': return l.prefFriends;
      case 'Familia': return l.prefFamily;
      case 'Económico': return l.prefBudgetEcon;
      case 'Moderado': return l.prefBudgetMod;
      case 'Lujo': return l.prefBudgetLux;
      case 'Relajado': return l.prefPaceRelaxed;
      case 'Equilibrado': return l.prefPaceBalanced;
      case 'Intenso': return l.prefPaceFast;
      case 'Caminando': return l.prefTransWalk;
      case 'Transporte Público': return l.prefTransPub;
      case 'Auto Rentado': return l.prefTransCar;
      case 'Taxis/Apps': return l.prefTransTaxi;
      case 'Mañanas': return l.prefTimeMorn;
      case 'Tardes': return l.prefTimeAft;
      case 'Noches': return l.prefTimeEve;
      case 'Playas': return l.prefIntBeaches;
      case 'Naturaleza': return l.prefIntNature;
      case 'Museos': return l.prefIntMuseums;
      case 'Monumentos históricos': return l.prefIntMonuments;
      case 'Gastronomía': return l.prefIntGastronomy;
      case 'Compras': return l.prefIntShopping;
      case 'Vida nocturna': return l.prefIntNightlife;
      case 'Aventuras': return l.prefIntAdventures;
      case 'Actividades familiares': return l.prefIntFamActivities;
      default: return key;
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 6) {
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
    if (_currentPage == 3) return _transportPreference.isNotEmpty;
    if (_currentPage == 4) return _preferredTimeOfDay.isNotEmpty;
    if (_currentPage == 5) return _interests.isNotEmpty;
    if (_currentPage == 6) return true; // Permisos (puede proceder)
    return false;
  }

  Future<void> _saveAndFinish() async {
    final l10n = AppLocalizations.of(context);

    await ref.read(touristProfileProvider.notifier).updatePreferences(
      travelerType: _travelerType,
      budget: _budget,
      companionType: _travelerType, // Simplify companion as travelerType
      hasChildren: _hasChildren,
      interests: _interests.toList(),
      preferredPace: _preferredPace,
      transportPreference: _transportPreference,
      preferredTimeOfDay: _preferredTimeOfDay,
    );
    
    if (mounted) {
      if (widget.isOnboarding) {
        await ref.read(onboardingCompleteProvider.notifier).complete();
      }
      
      
      final prompt = l10n.prefAiPrompt(
        _tx(_travelerType).toLowerCase(),
        _tx(_budget).toLowerCase(),
        _tx(_preferredPace).toLowerCase(),
        _tx(_transportPreference).toLowerCase(),
        _tx(_preferredTimeOfDay).toLowerCase(),
        _interests.map((i) => _tx(i.translationKey)).join(', ')
      );
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLocalizations.of(context).prefStepOf((_currentPage + 1).toString(), '7'),
                          style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: LinearProgressIndicator(
                            value: (_currentPage + 1) / 7.0,
                            minHeight: 8,
                            backgroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
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
                  _buildStep1Traveler().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                  _buildStep2Budget().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                  _buildStep3Pace().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                  _buildStep5Transport().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                  _buildStep6TimeOfDay().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                  _buildStep4Interests().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                  _buildStep7Location().animate().fade().slideX(begin: 0.1, duration: 300.ms),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: LiquidButton(
                label: _currentPage == 6 ? AppLocalizations.of(context).prefCompleteProfile : AppLocalizations.of(context).prefNext,
                icon: _currentPage == 6 ? Icons.check_circle_rounded : Icons.arrow_forward_rounded,
                onPressed: _canProceed() ? _nextPage : null,
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStep1Traveler() {
    IconData getIcon(String type) {
      switch (type) {
        case 'Solo': return Icons.person_rounded;
        case 'Pareja': return Icons.favorite_rounded;
        case 'Amigos': return Icons.groups_rounded;
        case 'Familia': return Icons.family_restroom_rounded;
        default: return Icons.person_rounded;
      }
    }

    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitleTraveler,
      subtitle: AppLocalizations.of(context).prefSubTraveler,
      child: Column(
        children: [
          ..._travelerTypes.map((type) => _RadioTile(
                title: _tx(type),
                icon: getIcon(type),
                isSelected: _travelerType == type,
                onTap: () => setState(() {
                  _travelerType = type;
                  if (type == 'Solo' || type == 'Amigos') _hasChildren = false;
                }),
              )),
          if (_travelerType == 'Pareja' || _travelerType == 'Familia') ...[
            const SizedBox(height: 24),
            SwitchListTile(
              title: Text(AppLocalizations.of(context).localeName == 'en' ? 'Traveling with kids?' : '¿Viajas con niños?'),
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
    IconData getIcon(String type) {
      switch (type) {
        case 'Económico': return Icons.savings_rounded;
        case 'Moderado': return Icons.account_balance_wallet_rounded;
        case 'Lujo': return Icons.diamond_rounded;
        default: return Icons.attach_money_rounded;
      }
    }

    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitleBudget,
      subtitle: AppLocalizations.of(context).prefSubBudget,
      child: Column(
        children: _budgets.map((b) => _RadioTile(
          title: _tx(b),
          icon: getIcon(b),
          isSelected: _budget == b,
          onTap: () => setState(() => _budget = b),
        )).toList(),
      ),
    );
  }

  Widget _buildStep3Pace() {
    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitlePace,
      subtitle: AppLocalizations.of(context).prefSubPace,
      child: Column(
        children: [
          _RadioTile(
            title: AppLocalizations.of(context).prefPaceRelaxed,
            subtitle: AppLocalizations.of(context).prefPaceRelaxedDesc,
            icon: Icons.self_improvement_rounded,
            isSelected: _preferredPace == 'Relajado',
            onTap: () => setState(() => _preferredPace = 'Relajado'),
          ),
          _RadioTile(
            title: AppLocalizations.of(context).prefPaceBalanced,
            subtitle: AppLocalizations.of(context).prefPaceBalancedDesc,
            icon: Icons.balance_rounded,
            isSelected: _preferredPace == 'Equilibrado',
            onTap: () => setState(() => _preferredPace = 'Equilibrado'),
          ),
          _RadioTile(
            title: AppLocalizations.of(context).prefPaceFast,
            subtitle: AppLocalizations.of(context).prefPaceFastDesc,
            icon: Icons.directions_run_rounded,
            isSelected: _preferredPace == 'Intenso',
            onTap: () => setState(() => _preferredPace = 'Intenso'),
          ),
        ],
      ),
    );
  }

  Widget _buildStep5Transport() {
    IconData getIcon(String type) {
      switch (type) {
        case 'Caminando': return Icons.directions_walk_rounded;
        case 'Transporte Público': return Icons.directions_bus_rounded;
        case 'Auto Rentado': return Icons.directions_car_rounded;
        case 'Taxis/Apps': return Icons.local_taxi_rounded;
        default: return Icons.commute_rounded;
      }
    }

    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitleTransport,
      subtitle: AppLocalizations.of(context).prefSubTransport,
      child: Column(
        children: _transportTypes.map((t) => _RadioTile(
          title: _tx(t),
          icon: getIcon(t),
          isSelected: _transportPreference == t,
          onTap: () => setState(() => _transportPreference = t),
        )).toList(),
      ),
    );
  }

  Widget _buildStep6TimeOfDay() {
    IconData getIcon(String type) {
      switch (type) {
        case 'Mañanas': return Icons.wb_sunny_rounded;
        case 'Tardes': return Icons.wb_twilight_rounded;
        case 'Noches': return Icons.nights_stay_rounded;
        default: return Icons.access_time_rounded;
      }
    }

    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitleTime,
      subtitle: AppLocalizations.of(context).prefSubTime,
      child: Column(
        children: _timeOfDays.map((t) => _RadioTile(
          title: _tx(t),
          icon: getIcon(t),
          isSelected: _preferredTimeOfDay == t,
          onTap: () => setState(() => _preferredTimeOfDay = t),
        )).toList(),
      ),
    );
  }

  Widget _buildStep7Location() {
    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitleLocation,
      subtitle: AppLocalizations.of(context).prefSubLocation,
      child: Center(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.location_on_rounded,
                size: 64,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 32),
            Text(
              AppLocalizations.of(context).prefAlmostDone,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              AppLocalizations.of(context).prefPleaseGrant,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            LiquidButton(
              label: AppLocalizations.of(context).prefGrantPermission,
              icon: Icons.my_location_rounded,
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                final l10n = AppLocalizations.of(context);
                try {
                  final granted = await checkAndRequestLocationPermission(context, ref);
                  if (!granted) {
                    messenger.showSnackBar(
                      SnackBar(content: Text(l10n.prefPermissionDenied)),
                    );
                  } else {
                    messenger.showSnackBar(
                      SnackBar(content: Text(l10n.prefPermissionGranted)),
                    );
                  }
                  // Si el permiso ya está, permitimos finalizar sin importar
                } catch (e) {
                  // Fallback
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep4Interests() {
    return _WizardPanel(
      title: AppLocalizations.of(context).prefTitleInterests,
      subtitle: 'Selecciona todas las temáticas que te apasionan.',
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: _availableInterests.map<Widget>((interest) {
          final isSelected = _interests.contains(interest);
          return FilterChip(
            label: Text(_tx(interest.translationKey)),
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
  const _RadioTile({required this.title, this.subtitle, this.icon, required this.isSelected, required this.onTap});
  final String title;
  final String? subtitle;
  final IconData? icon;
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
            boxShadow: isSelected ? [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.15),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ] : null,
          ),
          child: Row(
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  color: isSelected ? AppTheme.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                  size: 28,
                ),
                const SizedBox(width: 16),
              ],
              Icon(
                isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                color: isSelected ? AppTheme.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
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

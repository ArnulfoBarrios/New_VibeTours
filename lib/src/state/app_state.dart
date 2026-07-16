import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/app_config.dart';
import '../core/services/auth_service.dart';
import '../core/services/tour_runtime_services.dart';
import '../data/demo_tours.dart';
import '../data/discovery_repository.dart';
import '../data/moderation_repository.dart';
import 'package:vibetoursapp/src/data/tour_repository.dart';
import '../domain/models.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError());

final supabaseClientProvider = Provider<SupabaseClient?>((ref) {
  if (!AppConfig.hasSupabase) return null;
  return Supabase.instance.client;
});

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(supabaseClientProvider));
});

final authUserProvider = StreamProvider<User?>((ref) async* {
  final client = ref.watch(supabaseClientProvider);
  if (client == null) {
    yield null;
    return;
  }
  yield client.auth.currentUser;
  await for (final state in client.auth.onAuthStateChange) {
    yield state.session?.user;
  }
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authUserProvider).valueOrNull != null;
});

final isAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(authUserProvider).valueOrNull;
  return ref.watch(authServiceProvider).isConfiguredAdmin(user);
});

final tourRepositoryProvider = Provider<TourRepository>((ref) {
  return TourRepository(client: ref.watch(supabaseClientProvider));
});

final moderationRepositoryProvider = Provider<ModerationRepository>((ref) {
  return ModerationRepository(client: ref.watch(supabaseClientProvider));
});

class BlockedUsersController extends AsyncNotifier<Set<String>> {
  @override
  FutureOr<Set<String>> build() async {
    ref.watch(authUserProvider);
    return ref.watch(moderationRepositoryProvider).getBlockedUsers();
  }

  Future<void> blockUser(String userId) async {
    await ref.read(moderationRepositoryProvider).blockUser(userId);
    final current = state.valueOrNull ?? {};
    state = AsyncData({...current, userId});
    ref.invalidate(toursProvider);
  }
}

final blockedUsersProvider = AsyncNotifierProvider<BlockedUsersController, Set<String>>(BlockedUsersController.new);

final discoveryRepositoryProvider = Provider<DiscoveryRepository>((ref) {
  return DiscoveryRepository();
});

final toursProvider = FutureProvider<List<Tour>>((ref) async {
  final blockedUsers = await ref.watch(blockedUsersProvider.future);
  return ref.watch(tourRepositoryProvider).getTours(blockedUsers: blockedUsers);
});

final recommendedToursProvider = FutureProvider<List<Tour>>((ref) async {
  final allTours = await ref.watch(toursProvider.future);
  final profile = ref.watch(touristProfileProvider).valueOrNull;

  if (profile == null || profile.interests.isEmpty) {
    final copy = List.of(allTours);
    copy.shuffle();
    return copy.take(10).toList();
  }

  final interestTypes = <TourType>{};
  for (final interest in profile.interests) {
    final lower = interest.toLowerCase();
    if (lower.contains('playa') || lower.contains('relajación') || lower.contains('compras')) {
      interestTypes.add(TourType.romantic); // relaxing mapping
    }
    if (lower.contains('naturaleza') || lower.contains('aventura')) {
      interestTypes.add(TourType.ecological);
      interestTypes.add(TourType.sports);
    }
    if (lower.contains('museo') || lower.contains('monumento') || lower.contains('historia')) {
      interestTypes.add(TourType.cultural);
      interestTypes.add(TourType.historical);
    }
    if (lower.contains('gastronomía') || lower.contains('comida') || lower.contains('nocturna')) {
      interestTypes.add(TourType.gastronomic);
      interestTypes.add(TourType.night);
    }
  }

  final scoredTours = allTours.map((tour) {
    int score = 0;
    
    if (interestTypes.contains(tour.type)) {
      score += 3;
    }

    final targetAudiences = [
      profile.travelerType.toLowerCase(),
      profile.companionType.toLowerCase(),
    ];

    if (tour.recommendedAudience.isNotEmpty) {
      for (final audience in tour.recommendedAudience) {
        if (targetAudiences.any((t) => audience.toLowerCase().contains(t))) {
          score += 2;
        }
      }
    }

    if (profile.hasChildren) {
      final isForKids = tour.recommendedAudience.any((a) => a.toLowerCase().contains('niño') || a.toLowerCase().contains('familia'));
      if (!isForKids) {
        score -= 2;
      } else {
        score += 3;
      }
    }

    return MapEntry(tour, score);
  }).toList();

  scoredTours.sort((a, b) => b.value.compareTo(a.value));

  return scoredTours.map((e) => e.key).take(10).toList();
});

final adminPendingToursProvider = FutureProvider.autoDispose<List<Tour>>((
  ref,
) async {
  if (!ref.watch(isAdminProvider)) return const [];
  return ref.watch(tourRepositoryProvider).getPendingModerationTours();
});

final eventsProvider = Provider<List<LocalEvent>>((ref) => buildDemoEvents());

final currentPositionProvider = FutureProvider((ref) async {
  return ref.watch(locationServiceProvider).currentPosition();
});

final weatherProvider = FutureProvider<WeatherSnapshot?>((ref) async {
  final position = await ref.watch(currentPositionProvider.future);
  if (position == null) return null;
  return ref
      .watch(discoveryRepositoryProvider)
      .weather(latitude: position.latitude, longitude: position.longitude);
});

final nearbyPlacesProvider = FutureProvider<List<NearbyPlace>>((ref) async {
  final position = await ref.watch(currentPositionProvider.future);
  if (position == null) return const [];
  return ref
      .watch(discoveryRepositoryProvider)
      .nearbyPlaces(latitude: position.latitude, longitude: position.longitude);
});

final localEventsProvider = FutureProvider<List<LocalEvent>>((ref) async {
  final position = await ref.watch(currentPositionProvider.future);
  if (position == null) return const [];
  return ref
      .watch(discoveryRepositoryProvider)
      .localEvents(latitude: position.latitude, longitude: position.longitude);
});

final themeModeProvider = StateNotifierProvider<ThemeModeController, ThemeMode>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeModeController(prefs);
});

final localeProvider = StateNotifierProvider<LocaleController, Locale?>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return LocaleController(prefs);
});

enum AppCurrency { usd, eur, cop }

final currencyProvider = StateNotifierProvider<CurrencyController, AppCurrency>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return CurrencyController(prefs);
});

enum MapStyleOption { auto, day, night, satellite }

class MapStyleOptionController extends StateNotifier<MapStyleOption> {
  MapStyleOptionController(this.prefs) : super(_init(prefs));
  final SharedPreferences prefs;

  static MapStyleOption _init(SharedPreferences prefs) {
    final val = prefs.getString('vibetours_map_style_option');
    if (val != null) {
      return MapStyleOption.values.firstWhere((e) => e.name == val, orElse: () => MapStyleOption.auto);
    }
    return MapStyleOption.auto;
  }

  Future<void> setOption(MapStyleOption option) async {
    state = option;
    await prefs.setString('vibetours_map_style_option', option.name);
  }
}

final mapStyleOptionProvider = StateNotifierProvider<MapStyleOptionController, MapStyleOption>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return MapStyleOptionController(prefs);
});

const satelliteStyleJson = '''
{
  "version": 8,
  "sources": {
    "esri-satellite": {
      "type": "raster",
      "tiles": [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      "tileSize": 256,
      "attribution": "Esri"
    }
  },
  "layers": [
    {
      "id": "esri-satellite-layer",
      "type": "raster",
      "source": "esri-satellite",
      "minzoom": 0,
      "maxzoom": 18
    }
  ]
}
''';

final mapStyleProvider = Provider<String>((ref) {
  final option = ref.watch(mapStyleOptionProvider);
  switch (option) {
    case MapStyleOption.day:
      return 'https://tiles.openfreemap.org/styles/liberty';
    case MapStyleOption.night:
      return 'https://tiles.openfreemap.org/styles/dark';
    case MapStyleOption.satellite:
      return satelliteStyleJson;
    case MapStyleOption.auto:
      final themeMode = ref.watch(themeModeProvider);
      final isDark = themeMode == ThemeMode.dark ||
          (themeMode == ThemeMode.system &&
              WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark);
      return isDark
          ? 'https://tiles.openfreemap.org/styles/dark'
          : 'https://tiles.openfreemap.org/styles/liberty';
  }
});

final highRefreshRateProvider = StateProvider<bool>((ref) => true);

final notificationsEnabledProvider = StateProvider<bool>((ref) => true);

final onboardingCompleteProvider =
    AsyncNotifierProvider<OnboardingCompleteController, bool>(
      OnboardingCompleteController.new,
    );

final selectedTabProvider = StateProvider<int>((ref) => 0);

final aiPromptProvider = StateProvider<String?>((ref) => null);
final aiPromptAutoStartProvider = StateProvider<bool>((ref) => false);

final selectedTourProvider = StateProvider<Tour?>((ref) => null);

final selectedNearbyPlaceProvider = StateProvider<NearbyPlace?>((ref) => null);

final userToursProvider =
    AsyncNotifierProvider<UserToursController, UserToursState>(
      UserToursController.new,
    );

final favoriteTourIdsProvider = StateProvider<Set<String>>((ref) => <String>{});

final guestAiRemainingProvider = StateProvider<int>((ref) => 2);

final touristProfileProvider =
    AsyncNotifierProvider<TouristProfileController, TouristProfileV2>(
      () => TouristProfileController(),
    );

final voiceGuideProvider = Provider<VoiceGuideService>(
  (ref) => VoiceGuideService(),
);

final locationServiceProvider = Provider<LocationService>(
  (ref) => LocationService(ref.watch(sharedPreferencesProvider)),
);

class TouristProfileController extends AsyncNotifier<TouristProfileV2> {
  @override
  FutureOr<TouristProfileV2> build() {
    ref.watch(authUserProvider); // Rebuilds automatically on login/logout
    final prefs = ref.watch(authServiceProvider).getUserPreferences();
    if (prefs == null) return TouristProfileV2.empty;
    try {
      return TouristProfileV2.fromJson(prefs);
    } catch (_) {
      return TouristProfileV2.empty;
    }
  }

  Future<void> saveProfile(TouristProfileV2 newProfile) async {
    state = AsyncData(newProfile);
    await ref.read(authServiceProvider).updateUserPreferences(newProfile.toJson());
  }

  Future<void> updatePreferences({
    String? travelerType,
    String? budget,
    String? companionType,
    bool? hasChildren,
    List<String>? interests,
    String? preferredPace,
    String? transportPreference,
    String? preferredTimeOfDay,
  }) async {
    final current = state.valueOrNull ?? TouristProfileV2.empty;
    
    // Generar el nuevo aiSummary si algo cambia
    final newTravelerType = travelerType ?? current.travelerType;
    final newBudget = budget ?? current.budget;
    final newCompanionType = companionType ?? current.companionType;
    final newHasChildren = hasChildren ?? current.hasChildren;
    final newInterests = interests ?? current.interests;
    final newPreferredPace = preferredPace ?? current.preferredPace;
    final newTransportPreference = transportPreference ?? current.transportPreference;
    final newPreferredTimeOfDay = preferredTimeOfDay ?? current.preferredTimeOfDay;

    final summary = TouristProfileV2.generateSummary(
      travelerType: newTravelerType,
      budget: newBudget,
      companionType: newCompanionType,
      hasChildren: newHasChildren,
      interests: newInterests,
      preferredPace: newPreferredPace,
    );

    final newProfile = current.copyWith(
      travelerType: newTravelerType,
      budget: newBudget,
      companionType: newCompanionType,
      hasChildren: newHasChildren,
      interests: newInterests,
      preferredPace: newPreferredPace,
      transportPreference: newTransportPreference,
      preferredTimeOfDay: newPreferredTimeOfDay,
      aiSummary: summary,
    );
    await saveProfile(newProfile);
  }
}

class AiPlannerController extends AsyncNotifier<Tour?> {
  @override
  FutureOr<Tour?> build() => null;

  Future<void> generate(AiTourRequest request) async {
    final remaining = ref.read(guestAiRemainingProvider);
    final user = ref.read(authServiceProvider).currentUser;
    if (user == null && remaining <= 0) {
      state = AsyncError(
        StateError('La demo gratuita permite maximo 2 tours IA.'),
        StackTrace.current,
      );
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final tour = await ref
          .read(tourRepositoryProvider)
          .generateAiTour(request);
      if (user == null) {
        ref.read(guestAiRemainingProvider.notifier).state = remaining - 1;
      }
      return tour;
    });
  }
}

final aiPlannerControllerProvider =
    AsyncNotifierProvider<AiPlannerController, Tour?>(AiPlannerController.new);

class OnboardingCompleteController extends AsyncNotifier<bool> {
  static const _key = 'vibetours_onboarding_complete';

  @override
  Future<bool> build() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_key) ?? false;
  }

  Future<void> complete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, true);
    state = const AsyncData(true);
  }
}

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController(this.prefs) : super(_init(prefs));

  final SharedPreferences prefs;

  static ThemeMode _init(SharedPreferences prefs) {
    final val = prefs.getString('vibetours_theme_mode');
    if (val != null) {
      return ThemeMode.values.firstWhere((e) => e.name == val, orElse: () => ThemeMode.system);
    }
    return ThemeMode.system;
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    await prefs.setString('vibetours_theme_mode', mode.name);
  }
}

class LocaleController extends StateNotifier<Locale?> {
  LocaleController(this.prefs) : super(_init(prefs));

  final SharedPreferences prefs;

  static Locale? _init(SharedPreferences prefs) {
    final val = prefs.getString('vibetours_locale');
    if (val != null && val != 'system') {
      return Locale(val);
    }
    return null;
  }

  Future<void> setLocale(String? languageCode) async {
    if (languageCode == null || languageCode == 'system') {
      state = null;
      await prefs.setString('vibetours_locale', 'system');
    } else {
      state = Locale(languageCode);
      await prefs.setString('vibetours_locale', languageCode);
    }
  }
}

class CurrencyController extends StateNotifier<AppCurrency> {
  CurrencyController(this.prefs) : super(_init(prefs));

  final SharedPreferences prefs;

  static AppCurrency _init(SharedPreferences prefs) {
    final val = prefs.getString('vibetours_currency');
    if (val != null) {
      return AppCurrency.values.firstWhere((e) => e.name == val, orElse: () => AppCurrency.usd);
    }
    return AppCurrency.usd;
  }

  Future<void> setCurrency(AppCurrency currency) async {
    state = currency;
    await prefs.setString('vibetours_currency', currency.name);
  }
}

extension CurrencyExtension on AppCurrency {
  String get symbol {
    switch (this) {
      case AppCurrency.usd: return '\$';
      case AppCurrency.eur: return '€';
      case AppCurrency.cop: return '\$COP';
    }
  }

  double convertFromUsd(double amountUsd) {
    switch (this) {
      case AppCurrency.usd: return amountUsd;
      case AppCurrency.eur: return amountUsd * 0.93; // Approx
      case AppCurrency.cop: return amountUsd * 4100.0; // Approx
    }
  }
}

class UserToursState {
  const UserToursState({
    required this.manualTours,
    required this.hiddenDefaultTourIds,
  });

  final List<Tour> manualTours;
  final Set<String> hiddenDefaultTourIds;

  static const empty = UserToursState(
    manualTours: [],
    hiddenDefaultTourIds: {},
  );

  UserToursState copyWith({
    List<Tour>? manualTours,
    Set<String>? hiddenDefaultTourIds,
  }) {
    return UserToursState(
      manualTours: manualTours ?? this.manualTours,
      hiddenDefaultTourIds: hiddenDefaultTourIds ?? this.hiddenDefaultTourIds,
    );
  }
}

class UserToursController extends AsyncNotifier<UserToursState> {
  static String _manualToursKey(String? userId) => 'vibetours_manual_tours_${userId ?? 'guest'}';
  static String _hiddenDefaultsKey(String? userId) => 'vibetours_hidden_default_tours_${userId ?? 'guest'}';
  static const _clearAllToursKey = 'vibetours_clear_all_tours_20260610_1530';

  @override
  Future<UserToursState> build() async {
    final prefs = await SharedPreferences.getInstance();
    final user = ref.watch(authUserProvider).valueOrNull;
    final client = ref.read(supabaseClientProvider);
    final userId = user?.id;

    if (prefs.getBool(_clearAllToursKey) != true) {
      await prefs.remove('vibetours_manual_tours');
      await prefs.remove('vibetours_hidden_default_tours');
      await prefs.setBool(_clearAllToursKey, true);
      return UserToursState.empty;
    }

    final hidden = prefs.getStringList(_hiddenDefaultsKey(userId)) ?? const <String>[];
    if (client != null && user != null) {
      try {
        final rows = await client
            .from('tours')
            .select('*, tour_stops(*)')
            .or('owner_id.eq.${user.id},created_by.eq.${user.id}')
            .order('created_at', ascending: false);

        final dbTours = [
          for (final row in rows)
            ref
                .read(tourRepositoryProvider)
                .parseDatabaseJson(Map<String, dynamic>.from(row)),
        ];
        return UserToursState(
          manualTours: dbTours,
          hiddenDefaultTourIds: hidden.toSet(),
        );
      } catch (_) {
        // Fallback to local only if DB fetch fails
      }
    }

    final manualRaw = prefs.getString(_manualToursKey(userId));
    final manualTours = <Tour>[];
    if (manualRaw != null && manualRaw.isNotEmpty) {
      final decoded = jsonDecode(manualRaw);
      if (decoded is List) {
        for (final item in decoded) {
          if (item is Map) {
            manualTours.add(_tourFromJson(Map<String, dynamic>.from(item)));
          }
        }
      }
    }

    return UserToursState(
      manualTours: manualTours,
      hiddenDefaultTourIds: hidden.toSet(),
    );
  }

  Future<Tour> saveTour(Tour tour) async {
    final current = state.valueOrNull ?? await future;
    final user = ref.read(authServiceProvider).currentUser;
    if (user == null) {
      throw StateError('Debes iniciar sesion para guardar tours manuales.');
    }
    final storedTour = await ref.read(tourRepositoryProvider).saveUserTour(tour);
    ref.invalidate(toursProvider);
    ref.invalidate(adminPendingToursProvider);
    final nextTours = [
      for (final item in current.manualTours)
        if (item.id != storedTour.id && item.id != tour.id) item,
      storedTour,
    ];
    await _persist(current.copyWith(manualTours: nextTours));
    return storedTour;
  }

  Future<void> deleteTour(Tour tour) async {
    final current = state.valueOrNull ?? await future;
    final user = ref.read(authServiceProvider).currentUser;
    if (user != null && !tour.id.startsWith('manual-')) {
      await ref.read(tourRepositoryProvider).deleteUserTour(tour.id);
      ref.invalidate(toursProvider);
      ref.invalidate(adminPendingToursProvider);
    }
    if (tour.id.startsWith('manual-')) {
      await _persist(
        current.copyWith(
          manualTours: [
            for (final item in current.manualTours)
              if (item.id != tour.id) item,
          ],
        ),
      );
      return;
    }
    await _persist(
      current.copyWith(
        manualTours: [
          for (final item in current.manualTours)
            if (item.id != tour.id) item,
        ],
        hiddenDefaultTourIds: {...current.hiddenDefaultTourIds, tour.id},
      ),
    );
  }

  Future<void> approveTour(String tourId, {bool published = true}) async {
    final current = state.valueOrNull ?? await future;
    await _persist(
      current.copyWith(
        manualTours: [
          for (final tour in current.manualTours)
            tour.id == tourId ? _copyTour(tour, isPublished: published) : tour,
        ],
      ),
    );
  }

  Future<void> _persist(UserToursState next) async {
    state = AsyncData(next);
    final prefs = await SharedPreferences.getInstance();
    final userId = ref.read(authServiceProvider).currentUser?.id;
    await prefs.setString(
      _manualToursKey(userId),
      jsonEncode([for (final tour in next.manualTours) _tourToJson(tour)]),
    );
    await prefs.setStringList(
      _hiddenDefaultsKey(userId),
      next.hiddenDefaultTourIds.toList(),
    );
  }
}

Tour _copyTour(Tour tour, {bool? isPublished}) {
  return Tour(
    id: tour.id,
    title: tour.title,
    country: tour.country,
    city: tour.city,
    type: tour.type,
    description: tour.description,
    coverUrl: tour.coverUrl,
    gallery: tour.gallery,
    durationHours: tour.durationHours,
    distanceKm: tour.distanceKm,
    rating: tour.rating,
    reviewCount: tour.reviewCount,
    likes: tour.likes,
    difficulty: tour.difficulty,
    language: tour.language,
    tags: tour.tags,
    stops: tour.stops,
    isPublished: isPublished ?? tour.isPublished,
    isAiGenerated: tour.isAiGenerated,
    shortSummary: tour.shortSummary,
    subcategories: tour.subcategories,
    featuredExperience: tour.featuredExperience,
    placeHistory: tour.placeHistory,
    culturalContext: tour.culturalContext,
    availableLanguages: tour.availableLanguages,
    recommendedAudience: tour.recommendedAudience,
    bestSeason: tour.bestSeason,
    recommendedSchedule: tour.recommendedSchedule,
    meetingPoint: tour.meetingPoint,
    meetingPointInfo: tour.meetingPointInfo,
    includes: tour.includes,
    excludes: tour.excludes,
    recommendations: tour.recommendations,
    whatToBring: tour.whatToBring,
    tourRules: tour.tourRules,
    keywords: tour.keywords,
    mainCategory: tour.mainCategory,
    budget: tour.budget,
    additionalInfo: tour.additionalInfo,
  );
}

Map<String, dynamic> _tourToJson(Tour tour) {
  return {
    'id': tour.id,
    'title': tour.title,
    'country': tour.country,
    'city': tour.city,
    'type': tour.type.name,
    'description': tour.description,
    'coverUrl': tour.coverUrl,
    'gallery': tour.gallery,
    'durationHours': tour.durationHours,
    'distanceKm': tour.distanceKm,
    'rating': tour.rating,
    'reviewCount': tour.reviewCount,
    'likes': tour.likes,
    'difficulty': tour.difficulty.name,
    'language': tour.language,
    'tags': tour.tags,
    'isPublished': tour.isPublished,
    'isAiGenerated': tour.isAiGenerated,
    'shortSummary': tour.shortSummary,
    'subcategories': tour.subcategories,
    'featuredExperience': tour.featuredExperience,
    'placeHistory': tour.placeHistory,
    'culturalContext': tour.culturalContext,
    'availableLanguages': tour.availableLanguages,
    'recommendedAudience': tour.recommendedAudience,
    'bestSeason': tour.bestSeason,
    'recommendedSchedule': tour.recommendedSchedule,
    'meetingPoint': tour.meetingPoint,
    'meetingPointInfo': _locationInfoToJson(tour.meetingPointInfo),
    'includes': tour.includes,
    'excludes': tour.excludes,
    'recommendations': tour.recommendations,
    'whatToBring': tour.whatToBring,
    'tourRules': tour.tourRules,
    'keywords': tour.keywords,
    'mainCategory': tour.mainCategory,
    'budget': {
      'low': tour.budget.low,
      'medium': tour.budget.medium,
      'high': tour.budget.high,
    },
    'additionalInfo': {
      'accesibilidad': tour.additionalInfo.accesibilidad,
      'mascotasPermitidas': tour.additionalInfo.mascotasPermitidas,
      'aptoParaNinos': tour.additionalInfo.aptoParaNinos,
      'aptoParaAdultosMayores': tour.additionalInfo.aptoParaAdultosMayores,
    },
    'creationJson': tour.toCreationJson(),
    'stops': [for (final stop in tour.stops) _stopToJson(stop)],
  };
}

Map<String, dynamic> _stopToJson(TourStop stop) {
  return {
    'id': stop.id,
    'name': stop.name,
    'latitude': stop.location.latitude,
    'longitude': stop.location.longitude,
    'imageUrl': stop.imageUrl,
    'description': stop.description,
    'activities': stop.activities,
    'curiousFacts': stop.curiousFacts,
    'tips': stop.tips,
    'locationInfo': _locationInfoToJson(stop.locationInfo),
    'images': stop.images,
    'suggestedMinutes': stop.suggestedMinutes,
    'order': stop.order,
  };
}

Tour _tourFromJson(Map<String, dynamic> json) {
  return Tour(
    id: _string(json['id'], 'manual-${DateTime.now().microsecondsSinceEpoch}'),
    title: _string(json['title'], 'Tour sin nombre'),
    country: _string(json['country'], 'Mundo'),
    city: _string(json['city'], 'Personalizado'),
    type: _enumValue(TourType.values, _string(json['type'], 'custom')),
    description: _string(json['description'], ''),
    coverUrl: _string(json['coverUrl'], ''),
    gallery: _stringList(json['gallery']),
    durationHours: _double(json['durationHours'], 2.5),
    distanceKm: _double(json['distanceKm'], 0),
    rating: _double(json['rating'], 0),
    reviewCount: _int(json['reviewCount'], 0),
    likes: _int(json['likes'], 0),
    difficulty: _enumValue(
      TourDifficulty.values,
      _string(json['difficulty'], 'easy'),
    ),
    language: _string(json['language'], 'es'),
    tags: _stringList(json['tags']),
    stops: [
      for (final item in json['stops'] is List ? json['stops'] as List : [])
        if (item is Map) _stopFromJson(Map<String, dynamic>.from(item)),
    ],
    isPublished: json['isPublished'] == true,
    isAiGenerated: json['isAiGenerated'] == true,
    shortSummary: _string(json['shortSummary'], ''),
    subcategories: _stringList(json['subcategories']),
    featuredExperience: _string(json['featuredExperience'], ''),
    placeHistory: _string(json['placeHistory'], ''),
    culturalContext: _string(json['culturalContext'], ''),
    availableLanguages: _stringList(json['availableLanguages']).isEmpty
        ? [_string(json['language'], 'es')]
        : _stringList(json['availableLanguages']),
    recommendedAudience: _stringList(json['recommendedAudience']),
    bestSeason: _string(json['bestSeason'], ''),
    recommendedSchedule: _string(json['recommendedSchedule'], ''),
    meetingPoint: _string(json['meetingPoint'], ''),
    meetingPointInfo: _locationInfoFromJson(json['meetingPointInfo']),
    includes: _stringList(json['includes']),
    excludes: _stringList(json['excludes']),
    recommendations: _stringList(json['recommendations']),
    whatToBring: _stringList(json['whatToBring']),
    tourRules: _stringList(json['tourRules']),
    keywords: _stringList(json['keywords']),
    mainCategory: _string(json['mainCategory'], ''),
    budget: _budgetFromJson(json['budget']),
    additionalInfo: _additionalInfoFromJson(json['additionalInfo']),
  );
}

TourStop _stopFromJson(Map<String, dynamic> json) {
  return TourStop(
    id: _string(json['id'], 'stop-${DateTime.now().microsecondsSinceEpoch}'),
    name: _string(json['name'], 'Parada'),
    location: GeoPoint(
      latitude: _double(json['latitude'], 0),
      longitude: _double(json['longitude'], 0),
    ),
    imageUrl: _string(json['imageUrl'], ''),
    description: _string(json['description'], ''),
    activities: _stringList(json['activities']).isEmpty
        ? const ['Explorar']
        : _stringList(json['activities']),
    curiousFacts: _stringList(json['curiousFacts']),
    tips: _stringList(json['tips']).isEmpty
        ? const ['Confirma horarios locales antes de llegar']
        : _stringList(json['tips']),
    locationInfo: _locationInfoFromJson(json['locationInfo']),
    images: _stringList(json['images']),
    suggestedMinutes: _int(json['suggestedMinutes'], 25),
    order: _int(json['order'], 0),
  );
}

Map<String, dynamic> _locationInfoToJson(TourLocationInfo location) {
  return {
    'nombreLugar': location.nombreLugar,
    'direccion': location.direccion,
    'ciudad': location.ciudad,
    'region': location.region,
    'pais': location.pais,
    'placeId': location.placeId,
    'urlMapa': location.urlMapa,
  };
}

TourLocationInfo _locationInfoFromJson(Object? value) {
  if (value is! Map) return TourLocationInfo.empty;
  final json = Map<String, dynamic>.from(value);
  return TourLocationInfo(
    nombreLugar: _string(json['nombreLugar'] ?? json['nombre_lugar'], ''),
    direccion: _string(json['direccion'], ''),
    ciudad: _string(json['ciudad'], ''),
    region: _string(json['region'], ''),
    pais: _string(json['pais'], ''),
    placeId: _string(json['placeId'] ?? json['place_id'], ''),
    urlMapa: _string(json['urlMapa'] ?? json['url_mapa'], ''),
  );
}

TourBudget _budgetFromJson(Object? value) {
  if (value is! Map) return TourBudget.empty;
  final json = Map<String, dynamic>.from(value);
  return TourBudget(
    low: _int(json['low'] ?? json['bajo'], 0),
    medium: _int(json['medium'] ?? json['medio'], 0),
    high: _int(json['high'] ?? json['alto'], 0),
  );
}

TourAdditionalInfo _additionalInfoFromJson(Object? value) {
  if (value is! Map) return TourAdditionalInfo.standard;
  final json = Map<String, dynamic>.from(value);
  return TourAdditionalInfo(
    accesibilidad: _string(
      json['accesibilidad'],
      TourAdditionalInfo.standard.accesibilidad,
    ),
    mascotasPermitidas:
        json['mascotasPermitidas'] == true ||
        json['mascotas_permitidas'] == true,
    aptoParaNinos:
        json['aptoParaNinos'] == false || json['apto_para_ninos'] == false
        ? false
        : true,
    aptoParaAdultosMayores:
        json['aptoParaAdultosMayores'] == false ||
            json['apto_para_adultos_mayores'] == false
        ? false
        : true,
  );
}

T _enumValue<T extends Enum>(List<T> values, String name) {
  return values.firstWhere(
    (item) => item.name == name,
    orElse: () => values.first,
  );
}

String _string(Object? value, String fallback) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? fallback : text;
}

List<String> _stringList(Object? value) {
  if (value is! List) return const [];
  return [for (final item in value) item.toString()];
}

int _int(Object? value, int fallback) {
  if (value is int) return value;
  if (value is num) return value.round();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

double _double(Object? value, double fallback) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? fallback;
}

final tourCommentsProvider = FutureProvider.family<List<TourComment>, String>((ref, tourId) async {
  final blockedUsers = await ref.watch(blockedUsersProvider.future);
  return ref.watch(tourRepositoryProvider).getTourComments(tourId, blockedUsers: blockedUsers);
});

final userRatingsProvider = FutureProvider.family<List<UserTourRating>, String>((ref, userId) async {
  return ref.watch(tourRepositoryProvider).getUserRatings(userId);
});

final userStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final user = ref.watch(authUserProvider).valueOrNull;
  if (user == null) return {'createdTours': 0, 'participants': 0, 'toursRated': 0};
  return ref.watch(tourRepositoryProvider).getUserStats(user.id);
});

class TourParticipantsController extends AsyncNotifier<List<TourWithParticipants>> {
  @override
  FutureOr<List<TourWithParticipants>> build() async {
    ref.watch(authUserProvider);
    final user = ref.read(authServiceProvider).currentUser;
    if (user == null) return const [];
    return ref.watch(tourRepositoryProvider).getToursWithParticipants();
  }

  Future<void> join(String tourId) async {
    await ref.read(tourRepositoryProvider).joinTour(tourId);
    ref.invalidate(userStatsProvider);
    ref.invalidateSelf();
  }
}

final tourParticipantsProvider = AsyncNotifierProvider<TourParticipantsController, List<TourWithParticipants>>(
  TourParticipantsController.new,
);



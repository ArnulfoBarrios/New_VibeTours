import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
  ];

  /// No description provided for @appName.
  ///
  /// In es, this message translates to:
  /// **'VIBETOURS'**
  String get appName;

  /// No description provided for @onboardingTitle.
  ///
  /// In es, this message translates to:
  /// **'Tu guia turistica con IA'**
  String get onboardingTitle;

  /// No description provided for @onboardingSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Descubre, crea y recorre tours reales con mapas, voz y recomendaciones personalizadas.'**
  String get onboardingSubtitle;

  /// No description provided for @start.
  ///
  /// In es, this message translates to:
  /// **'Comenzar'**
  String get start;

  /// No description provided for @skip.
  ///
  /// In es, this message translates to:
  /// **'Saltar'**
  String get skip;

  /// No description provided for @profileTitle.
  ///
  /// In es, this message translates to:
  /// **'Perfil turistico'**
  String get profileTitle;

  /// No description provided for @profileSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Elige tus intereses para personalizar recomendaciones.'**
  String get profileSubtitle;

  /// No description provided for @continueAction.
  ///
  /// In es, this message translates to:
  /// **'Continuar'**
  String get continueAction;

  /// No description provided for @home.
  ///
  /// In es, this message translates to:
  /// **'Inicio'**
  String get home;

  /// No description provided for @tours.
  ///
  /// In es, this message translates to:
  /// **'Tours'**
  String get tours;

  /// No description provided for @aiPlanner.
  ///
  /// In es, this message translates to:
  /// **'VibeTour AI'**
  String get aiPlanner;

  /// No description provided for @create.
  ///
  /// In es, this message translates to:
  /// **'Crear'**
  String get create;

  /// No description provided for @profile.
  ///
  /// In es, this message translates to:
  /// **'Perfil'**
  String get profile;

  /// No description provided for @settings.
  ///
  /// In es, this message translates to:
  /// **'Ajustes'**
  String get settings;

  /// No description provided for @recommendedTours.
  ///
  /// In es, this message translates to:
  /// **'Tours recomendados'**
  String get recommendedTours;

  /// No description provided for @nearbyPlaces.
  ///
  /// In es, this message translates to:
  /// **'Lugares cercanos'**
  String get nearbyPlaces;

  /// No description provided for @nearbyEvents.
  ///
  /// In es, this message translates to:
  /// **'Eventos cercanos'**
  String get nearbyEvents;

  /// No description provided for @popularTours.
  ///
  /// In es, this message translates to:
  /// **'Mas populares'**
  String get popularTours;

  /// No description provided for @searchTours.
  ///
  /// In es, this message translates to:
  /// **'Buscar tours'**
  String get searchTours;

  /// No description provided for @filters.
  ///
  /// In es, this message translates to:
  /// **'Filtros'**
  String get filters;

  /// No description provided for @country.
  ///
  /// In es, this message translates to:
  /// **'Pais'**
  String get country;

  /// No description provided for @city.
  ///
  /// In es, this message translates to:
  /// **'Ciudad'**
  String get city;

  /// No description provided for @type.
  ///
  /// In es, this message translates to:
  /// **'Tipo'**
  String get type;

  /// No description provided for @duration.
  ///
  /// In es, this message translates to:
  /// **'Duracion'**
  String get duration;

  /// No description provided for @rating.
  ///
  /// In es, this message translates to:
  /// **'Calificacion'**
  String get rating;

  /// No description provided for @startTour.
  ///
  /// In es, this message translates to:
  /// **'Iniciar tour'**
  String get startTour;

  /// No description provided for @save.
  ///
  /// In es, this message translates to:
  /// **'Guardar'**
  String get save;

  /// No description provided for @share.
  ///
  /// In es, this message translates to:
  /// **'Compartir'**
  String get share;

  /// No description provided for @love.
  ///
  /// In es, this message translates to:
  /// **'Me encanta'**
  String get love;

  /// No description provided for @route.
  ///
  /// In es, this message translates to:
  /// **'Ruta'**
  String get route;

  /// No description provided for @stops.
  ///
  /// In es, this message translates to:
  /// **'Paradas'**
  String get stops;

  /// No description provided for @distance.
  ///
  /// In es, this message translates to:
  /// **'Distancia'**
  String get distance;

  /// No description provided for @remaining.
  ///
  /// In es, this message translates to:
  /// **'Restante'**
  String get remaining;

  /// No description provided for @voiceGuide.
  ///
  /// In es, this message translates to:
  /// **'Guia por voz'**
  String get voiceGuide;

  /// No description provided for @handsFree.
  ///
  /// In es, this message translates to:
  /// **'Manos libres'**
  String get handsFree;

  /// No description provided for @recalculate.
  ///
  /// In es, this message translates to:
  /// **'Recalcular'**
  String get recalculate;

  /// No description provided for @nextStop.
  ///
  /// In es, this message translates to:
  /// **'Siguiente parada'**
  String get nextStop;

  /// No description provided for @myTours.
  ///
  /// In es, this message translates to:
  /// **'Mis tours'**
  String get myTours;

  /// No description provided for @manualCreation.
  ///
  /// In es, this message translates to:
  /// **'Creacion manual'**
  String get manualCreation;

  /// No description provided for @tourName.
  ///
  /// In es, this message translates to:
  /// **'Nombre del tour'**
  String get tourName;

  /// No description provided for @description.
  ///
  /// In es, this message translates to:
  /// **'Descripcion'**
  String get description;

  /// No description provided for @coverImage.
  ///
  /// In es, this message translates to:
  /// **'Imagen portada'**
  String get coverImage;

  /// No description provided for @gallery.
  ///
  /// In es, this message translates to:
  /// **'Galeria'**
  String get gallery;

  /// No description provided for @category.
  ///
  /// In es, this message translates to:
  /// **'Categoria'**
  String get category;

  /// No description provided for @tags.
  ///
  /// In es, this message translates to:
  /// **'Etiquetas'**
  String get tags;

  /// No description provided for @difficulty.
  ///
  /// In es, this message translates to:
  /// **'Dificultad'**
  String get difficulty;

  /// No description provided for @language.
  ///
  /// In es, this message translates to:
  /// **'Idioma'**
  String get language;

  /// No description provided for @addStop.
  ///
  /// In es, this message translates to:
  /// **'Agregar parada'**
  String get addStop;

  /// No description provided for @previewMap.
  ///
  /// In es, this message translates to:
  /// **'Vista previa en mapa'**
  String get previewMap;

  /// No description provided for @destination.
  ///
  /// In es, this message translates to:
  /// **'Destino'**
  String get destination;

  /// No description provided for @freePrompt.
  ///
  /// In es, this message translates to:
  /// **'Prompt libre'**
  String get freePrompt;

  /// No description provided for @detecting.
  ///
  /// In es, this message translates to:
  /// **'Detectando experiencia'**
  String get detecting;

  /// No description provided for @generateTour.
  ///
  /// In es, this message translates to:
  /// **'Generar tour'**
  String get generateTour;

  /// No description provided for @generatingTitle.
  ///
  /// In es, this message translates to:
  /// **'Creando tu VibeTour'**
  String get generatingTitle;

  /// No description provided for @generatingDestination.
  ///
  /// In es, this message translates to:
  /// **'Analizando destino'**
  String get generatingDestination;

  /// No description provided for @generatingPlaces.
  ///
  /// In es, this message translates to:
  /// **'Buscando lugares'**
  String get generatingPlaces;

  /// No description provided for @generatingRoute.
  ///
  /// In es, this message translates to:
  /// **'Organizando ruta'**
  String get generatingRoute;

  /// No description provided for @generatingImages.
  ///
  /// In es, this message translates to:
  /// **'Generando imagenes'**
  String get generatingImages;

  /// No description provided for @generatingExperience.
  ///
  /// In es, this message translates to:
  /// **'Creando experiencia'**
  String get generatingExperience;

  /// No description provided for @guestLimit.
  ///
  /// In es, this message translates to:
  /// **'Demo gratuita: {count} tours IA restantes'**
  String guestLimit(Object count);

  /// No description provided for @login.
  ///
  /// In es, this message translates to:
  /// **'Iniciar sesion'**
  String get login;

  /// No description provided for @logout.
  ///
  /// In es, this message translates to:
  /// **'Cerrar sesion'**
  String get logout;

  /// No description provided for @appearance.
  ///
  /// In es, this message translates to:
  /// **'Apariencia'**
  String get appearance;

  /// No description provided for @notifications.
  ///
  /// In es, this message translates to:
  /// **'Notificaciones'**
  String get notifications;

  /// No description provided for @mapPreference.
  ///
  /// In es, this message translates to:
  /// **'Preferencia de mapa'**
  String get mapPreference;

  /// No description provided for @helpCenter.
  ///
  /// In es, this message translates to:
  /// **'Centro de ayuda'**
  String get helpCenter;

  /// No description provided for @privacy.
  ///
  /// In es, this message translates to:
  /// **'Politica de privacidad'**
  String get privacy;

  /// No description provided for @terms.
  ///
  /// In es, this message translates to:
  /// **'Terminos y condiciones'**
  String get terms;

  /// No description provided for @rateApp.
  ///
  /// In es, this message translates to:
  /// **'Calificar app'**
  String get rateApp;

  /// No description provided for @monthlyActivity.
  ///
  /// In es, this message translates to:
  /// **'Actividad mensual'**
  String get monthlyActivity;

  /// No description provided for @favoriteCategories.
  ///
  /// In es, this message translates to:
  /// **'Categorias favoritas'**
  String get favoriteCategories;

  /// No description provided for @favoriteDestinations.
  ///
  /// In es, this message translates to:
  /// **'Destinos favoritos'**
  String get favoriteDestinations;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}

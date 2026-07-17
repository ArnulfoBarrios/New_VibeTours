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
  /// **'Describe tu tour'**
  String get freePrompt;

  /// No description provided for @voicePromptPreparing.
  ///
  /// In es, this message translates to:
  /// **'Preparando microfono...'**
  String get voicePromptPreparing;

  /// No description provided for @voicePromptListening.
  ///
  /// In es, this message translates to:
  /// **'Escuchando tu tour...'**
  String get voicePromptListening;

  /// No description provided for @voicePromptStopped.
  ///
  /// In es, this message translates to:
  /// **'La grabacion se detuvo.'**
  String get voicePromptStopped;

  /// No description provided for @voicePromptPermissionDenied.
  ///
  /// In es, this message translates to:
  /// **'Permiso de microfono denegado. Activalo desde Ajustes.'**
  String get voicePromptPermissionDenied;

  /// No description provided for @voicePromptUnavailable.
  ///
  /// In es, this message translates to:
  /// **'El reconocimiento de voz no esta disponible en este dispositivo.'**
  String get voicePromptUnavailable;

  /// No description provided for @voicePromptNoMatch.
  ///
  /// In es, this message translates to:
  /// **'No entendimos claramente tu voz. Intenta otra vez.'**
  String get voicePromptNoMatch;

  /// No description provided for @voicePromptBusy.
  ///
  /// In es, this message translates to:
  /// **'El servicio de voz esta ocupado. Espera un momento.'**
  String get voicePromptBusy;

  /// No description provided for @voicePromptNetworkError.
  ///
  /// In es, this message translates to:
  /// **'Revisa tu conexion e intenta otra vez.'**
  String get voicePromptNetworkError;

  /// No description provided for @voicePromptError.
  ///
  /// In es, this message translates to:
  /// **'No pudimos procesar la entrada por voz.'**
  String get voicePromptError;

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

  /// No description provided for @explore.
  ///
  /// In es, this message translates to:
  /// **'Explorar'**
  String get explore;

  /// No description provided for @noToursAvailable.
  ///
  /// In es, this message translates to:
  /// **'No hay tours disponibles'**
  String get noToursAvailable;

  /// No description provided for @featured.
  ///
  /// In es, this message translates to:
  /// **'DESTACADO'**
  String get featured;

  /// No description provided for @days.
  ///
  /// In es, this message translates to:
  /// **'días'**
  String get days;

  /// No description provided for @planTrip.
  ///
  /// In es, this message translates to:
  /// **'Planificar viaje'**
  String get planTrip;

  /// No description provided for @continuePlanning.
  ///
  /// In es, this message translates to:
  /// **'Continuar planificando'**
  String get continuePlanning;

  /// No description provided for @continuePlanningSub.
  ///
  /// In es, this message translates to:
  /// **'Retoma donde lo dejaste'**
  String get continuePlanningSub;

  /// No description provided for @viewAll.
  ///
  /// In es, this message translates to:
  /// **'Ver todo'**
  String get viewAll;

  /// No description provided for @coastToCoast.
  ///
  /// In es, this message translates to:
  /// **'De costa a costa'**
  String get coastToCoast;

  /// No description provided for @coastToCoastSub.
  ///
  /// In es, this message translates to:
  /// **'Rascacielos, cañones salvajes y playas de surf'**
  String get coastToCoastSub;

  /// No description provided for @wildBeauty.
  ///
  /// In es, this message translates to:
  /// **'Belleza salvaje'**
  String get wildBeauty;

  /// No description provided for @wildBeautySub.
  ///
  /// In es, this message translates to:
  /// **'Cielos infinitos, grandes animales y horizontes sin fin'**
  String get wildBeautySub;

  /// No description provided for @biography.
  ///
  /// In es, this message translates to:
  /// **'Biografía'**
  String get biography;

  /// No description provided for @editProfilePhoto.
  ///
  /// In es, this message translates to:
  /// **'Cambiar foto de perfil'**
  String get editProfilePhoto;

  /// No description provided for @chooseFromGallery.
  ///
  /// In es, this message translates to:
  /// **'Elegir de la galería'**
  String get chooseFromGallery;

  /// No description provided for @imageUrl.
  ///
  /// In es, this message translates to:
  /// **'URL de la imagen'**
  String get imageUrl;

  /// No description provided for @cancel.
  ///
  /// In es, this message translates to:
  /// **'Cancelar'**
  String get cancel;

  /// No description provided for @saveUrl.
  ///
  /// In es, this message translates to:
  /// **'Guardar URL'**
  String get saveUrl;

  /// No description provided for @defaultBio.
  ///
  /// In es, this message translates to:
  /// **'Añade una biografía y tus gustos aquí...'**
  String get defaultBio;

  /// No description provided for @createdTours.
  ///
  /// In es, this message translates to:
  /// **'Tours Creados'**
  String get createdTours;

  /// No description provided for @toursRated.
  ///
  /// In es, this message translates to:
  /// **'Calificados'**
  String get toursRated;

  /// No description provided for @participants.
  ///
  /// In es, this message translates to:
  /// **'Participantes'**
  String get participants;

  /// No description provided for @errorLoadingStats.
  ///
  /// In es, this message translates to:
  /// **'Error al cargar estadísticas'**
  String get errorLoadingStats;

  /// No description provided for @preferences.
  ///
  /// In es, this message translates to:
  /// **'Preferencias'**
  String get preferences;

  /// No description provided for @goPremium.
  ///
  /// In es, this message translates to:
  /// **'Hazte premium'**
  String get goPremium;

  /// No description provided for @currency.
  ///
  /// In es, this message translates to:
  /// **'Moneda'**
  String get currency;

  /// No description provided for @support.
  ///
  /// In es, this message translates to:
  /// **'Soporte'**
  String get support;

  /// No description provided for @about.
  ///
  /// In es, this message translates to:
  /// **'Acerca de'**
  String get about;

  /// No description provided for @feedback.
  ///
  /// In es, this message translates to:
  /// **'Comentarios'**
  String get feedback;

  /// No description provided for @rateUs.
  ///
  /// In es, this message translates to:
  /// **'Clasifícanos'**
  String get rateUs;

  /// No description provided for @legal.
  ///
  /// In es, this message translates to:
  /// **'Legal'**
  String get legal;

  /// No description provided for @termsOfService.
  ///
  /// In es, this message translates to:
  /// **'Términos de servicio'**
  String get termsOfService;

  /// No description provided for @privacyPolicy.
  ///
  /// In es, this message translates to:
  /// **'Política de Privacidad'**
  String get privacyPolicy;

  /// No description provided for @introSlogan1.
  ///
  /// In es, this message translates to:
  /// **'Tu viaje en minutos,\nno en semanas.'**
  String get introSlogan1;

  /// No description provided for @introWhatType.
  ///
  /// In es, this message translates to:
  /// **'Dime qué tipo de viajes te gustan.'**
  String get introWhatType;

  /// No description provided for @startNow.
  ///
  /// In es, this message translates to:
  /// **'Comienza'**
  String get startNow;

  /// No description provided for @alreadyUsedApp.
  ///
  /// In es, this message translates to:
  /// **'¿Ya has usado VibeTours? '**
  String get alreadyUsedApp;

  /// No description provided for @interestRomantic.
  ///
  /// In es, this message translates to:
  /// **'❤️ Romántico'**
  String get interestRomantic;

  /// No description provided for @interestParty.
  ///
  /// In es, this message translates to:
  /// **'🎉 Fiesta'**
  String get interestParty;

  /// No description provided for @interestNature.
  ///
  /// In es, this message translates to:
  /// **'🌳 Naturaleza'**
  String get interestNature;

  /// No description provided for @interestBeach.
  ///
  /// In es, this message translates to:
  /// **'⛱️ Playa'**
  String get interestBeach;

  /// No description provided for @interestSafari.
  ///
  /// In es, this message translates to:
  /// **'🦁 Safari'**
  String get interestSafari;

  /// No description provided for @interestAdventure.
  ///
  /// In es, this message translates to:
  /// **'🏔️ Aventura'**
  String get interestAdventure;

  /// No description provided for @interestArtCulture.
  ///
  /// In es, this message translates to:
  /// **'🎨 Arte y cultura'**
  String get interestArtCulture;

  /// No description provided for @interestFamily.
  ///
  /// In es, this message translates to:
  /// **'👨‍👩‍👧 Familia'**
  String get interestFamily;

  /// No description provided for @interestGourmet.
  ///
  /// In es, this message translates to:
  /// **'🍽️ Gourmet'**
  String get interestGourmet;

  /// No description provided for @interestShopping.
  ///
  /// In es, this message translates to:
  /// **'🛍️ Compras'**
  String get interestShopping;

  /// No description provided for @interestWellness.
  ///
  /// In es, this message translates to:
  /// **'🧘 Bienestar'**
  String get interestWellness;

  /// No description provided for @interestSkiing.
  ///
  /// In es, this message translates to:
  /// **'🎿 Esquí'**
  String get interestSkiing;

  /// No description provided for @interestHiking.
  ///
  /// In es, this message translates to:
  /// **'🥾 Senderismo'**
  String get interestHiking;

  /// No description provided for @interestOther.
  ///
  /// In es, this message translates to:
  /// **'💭 ¿Otra cosa?'**
  String get interestOther;

  /// No description provided for @trips.
  ///
  /// In es, this message translates to:
  /// **'Viajes'**
  String get trips;

  /// No description provided for @legalPrivacyPolicy.
  ///
  /// In es, this message translates to:
  /// **'Política de Privacidad'**
  String get legalPrivacyPolicy;

  /// No description provided for @legalTermsConditions.
  ///
  /// In es, this message translates to:
  /// **'Términos y Condiciones'**
  String get legalTermsConditions;

  /// No description provided for @legalPrivacyDesc.
  ///
  /// In es, this message translates to:
  /// **'Tu ubicación y preferencias se usan para personalizar tours, clima, lugares cercanos y eventos.'**
  String get legalPrivacyDesc;

  /// No description provided for @legalTermsDesc.
  ///
  /// In es, this message translates to:
  /// **'Usa VIBETOURS como guía de apoyo. Confirma condiciones reales antes de desplazarte.'**
  String get legalTermsDesc;

  /// No description provided for @pqrsTitle.
  ///
  /// In es, this message translates to:
  /// **'Crear PQRS'**
  String get pqrsTitle;

  /// No description provided for @pqrsDesc.
  ///
  /// In es, this message translates to:
  /// **'Cuéntanos tu experiencia. Estamos aquí para escucharte y mejorar nuestro servicio.'**
  String get pqrsDesc;

  /// No description provided for @pqrsReqType.
  ///
  /// In es, this message translates to:
  /// **'Tipo de solicitud'**
  String get pqrsReqType;

  /// No description provided for @pqrsPetition.
  ///
  /// In es, this message translates to:
  /// **'Petición'**
  String get pqrsPetition;

  /// No description provided for @pqrsComplaint.
  ///
  /// In es, this message translates to:
  /// **'Queja'**
  String get pqrsComplaint;

  /// No description provided for @pqrsClaim.
  ///
  /// In es, this message translates to:
  /// **'Reclamo'**
  String get pqrsClaim;

  /// No description provided for @pqrsSuggestion.
  ///
  /// In es, this message translates to:
  /// **'Sugerencia'**
  String get pqrsSuggestion;

  /// No description provided for @pqrsSubject.
  ///
  /// In es, this message translates to:
  /// **'Asunto'**
  String get pqrsSubject;

  /// No description provided for @pqrsSubjectHint.
  ///
  /// In es, this message translates to:
  /// **'Resumen corto de tu solicitud'**
  String get pqrsSubjectHint;

  /// No description provided for @pqrsMessage.
  ///
  /// In es, this message translates to:
  /// **'Mensaje'**
  String get pqrsMessage;

  /// No description provided for @pqrsMessageHint.
  ///
  /// In es, this message translates to:
  /// **'Describe detalladamente los hechos...'**
  String get pqrsMessageHint;

  /// No description provided for @pqrsSend.
  ///
  /// In es, this message translates to:
  /// **'Enviar'**
  String get pqrsSend;

  /// No description provided for @pqrsSending.
  ///
  /// In es, this message translates to:
  /// **'Enviando...'**
  String get pqrsSending;

  /// No description provided for @pqrsFastResponse.
  ///
  /// In es, this message translates to:
  /// **'Respuesta rápida'**
  String get pqrsFastResponse;

  /// No description provided for @pqrsUnder24h.
  ///
  /// In es, this message translates to:
  /// **'Menos de 24h hábiles'**
  String get pqrsUnder24h;

  /// No description provided for @pqrsSecure.
  ///
  /// In es, this message translates to:
  /// **'Seguro'**
  String get pqrsSecure;

  /// No description provided for @pqrsSsl.
  ///
  /// In es, this message translates to:
  /// **'Cifrado SSL'**
  String get pqrsSsl;

  /// No description provided for @pqrsCreateTab.
  ///
  /// In es, this message translates to:
  /// **'Crear'**
  String get pqrsCreateTab;

  /// No description provided for @pqrsHistoryTab.
  ///
  /// In es, this message translates to:
  /// **'Historial'**
  String get pqrsHistoryTab;

  /// No description provided for @pqrsErrorFill.
  ///
  /// In es, this message translates to:
  /// **'Completa asunto y mensaje con más detalle.'**
  String get pqrsErrorFill;

  /// No description provided for @pqrsErrorSupabase.
  ///
  /// In es, this message translates to:
  /// **'Supabase no está configurado para enviar PQRS.'**
  String get pqrsErrorSupabase;

  /// No description provided for @pqrsErrorLogin.
  ///
  /// In es, this message translates to:
  /// **'Inicia sesión para enviar tu PQRS.'**
  String get pqrsErrorLogin;

  /// No description provided for @pqrsSuccess.
  ///
  /// In es, this message translates to:
  /// **'PQRS enviada. Te responderemos en menos de 24h hábiles.'**
  String get pqrsSuccess;

  /// No description provided for @aiHello.
  ///
  /// In es, this message translates to:
  /// **'Hola {name},\n¿qué quieres hacer?'**
  String aiHello(String name);

  /// No description provided for @aiAdvancedOptions.
  ///
  /// In es, this message translates to:
  /// **'Opciones avanzadas'**
  String get aiAdvancedOptions;

  /// No description provided for @aiStart.
  ///
  /// In es, this message translates to:
  /// **'Comenzar'**
  String get aiStart;

  /// No description provided for @aiDetected.
  ///
  /// In es, this message translates to:
  /// **'Detectamos:'**
  String get aiDetected;

  /// No description provided for @aiSaveTour.
  ///
  /// In es, this message translates to:
  /// **'Guardar tour'**
  String get aiSaveTour;

  /// No description provided for @aiTourSaved.
  ///
  /// In es, this message translates to:
  /// **'Tour guardado exitosamente'**
  String get aiTourSaved;

  /// No description provided for @aiPreviewTour.
  ///
  /// In es, this message translates to:
  /// **'Previsualizar tour'**
  String get aiPreviewTour;

  /// No description provided for @aiEditTour.
  ///
  /// In es, this message translates to:
  /// **'Editar tour'**
  String get aiEditTour;

  /// No description provided for @aiDays.
  ///
  /// In es, this message translates to:
  /// **'días'**
  String get aiDays;

  /// No description provided for @aiHoursPerDay.
  ///
  /// In es, this message translates to:
  /// **'h/día'**
  String get aiHoursPerDay;

  /// No description provided for @helpGuides.
  ///
  /// In es, this message translates to:
  /// **'Guías de la App'**
  String get helpGuides;

  /// No description provided for @helpDetailed.
  ///
  /// In es, this message translates to:
  /// **'Guía detallada'**
  String get helpDetailed;

  /// No description provided for @helpDetailedSub.
  ///
  /// In es, this message translates to:
  /// **'Para explorar, crear, editar, guardar y disfrutar tours.'**
  String get helpDetailedSub;

  /// No description provided for @helpSec1.
  ///
  /// In es, this message translates to:
  /// **'1. Cuenta'**
  String get helpSec1;

  /// No description provided for @helpSec2.
  ///
  /// In es, this message translates to:
  /// **'2. Descubrir'**
  String get helpSec2;

  /// No description provided for @helpSec3.
  ///
  /// In es, this message translates to:
  /// **'3. Tours'**
  String get helpSec3;

  /// No description provided for @helpSec4.
  ///
  /// In es, this message translates to:
  /// **'4. Mapa'**
  String get helpSec4;

  /// No description provided for @helpSec5.
  ///
  /// In es, this message translates to:
  /// **'5. Crear'**
  String get helpSec5;

  /// No description provided for @helpSec6.
  ///
  /// In es, this message translates to:
  /// **'6. AI'**
  String get helpSec6;

  /// No description provided for @helpSec7.
  ///
  /// In es, this message translates to:
  /// **'7. Editar'**
  String get helpSec7;

  /// No description provided for @helpSec8.
  ///
  /// In es, this message translates to:
  /// **'8. Perfil'**
  String get helpSec8;

  /// No description provided for @helpSec9.
  ///
  /// In es, this message translates to:
  /// **'9. PQRS'**
  String get helpSec9;

  /// No description provided for @helpTitle1.
  ///
  /// In es, this message translates to:
  /// **'1. Cuenta, invitado e inicio de sesión'**
  String get helpTitle1;

  /// No description provided for @helpTitle2.
  ///
  /// In es, this message translates to:
  /// **'2. Descubrir lugares cerca de ti'**
  String get helpTitle2;

  /// No description provided for @helpTitle3.
  ///
  /// In es, this message translates to:
  /// **'3. Pantalla Tours'**
  String get helpTitle3;

  /// No description provided for @helpTitle4.
  ///
  /// In es, this message translates to:
  /// **'4. Mapa y navegación'**
  String get helpTitle4;

  /// No description provided for @helpTitle5.
  ///
  /// In es, this message translates to:
  /// **'5. Creación manual de Tours'**
  String get helpTitle5;

  /// No description provided for @helpTitle6.
  ///
  /// In es, this message translates to:
  /// **'6. IA VibeTour (Planificador)'**
  String get helpTitle6;

  /// No description provided for @helpTitle7.
  ///
  /// In es, this message translates to:
  /// **'7. Edición y guardado'**
  String get helpTitle7;

  /// No description provided for @helpTitle8.
  ///
  /// In es, this message translates to:
  /// **'8. Perfil y personalización'**
  String get helpTitle8;

  /// No description provided for @helpTitle9.
  ///
  /// In es, this message translates to:
  /// **'9. PQRS y Soporte'**
  String get helpTitle9;

  /// No description provided for @goodMorning.
  ///
  /// In es, this message translates to:
  /// **'Buenos días'**
  String get goodMorning;

  /// No description provided for @editorsChoice.
  ///
  /// In es, this message translates to:
  /// **'SELECCIÓN DEL EDITOR'**
  String get editorsChoice;

  /// No description provided for @whereToNext.
  ///
  /// In es, this message translates to:
  /// **'¿A dónde vamos?'**
  String get whereToNext;

  /// No description provided for @toursForYou.
  ///
  /// In es, this message translates to:
  /// **'Tours para ti'**
  String get toursForYou;

  /// No description provided for @yourCurrentArea.
  ///
  /// In es, this message translates to:
  /// **'Tu zona actual'**
  String get yourCurrentArea;

  /// No description provided for @nearbyPointOfInterest.
  ///
  /// In es, this message translates to:
  /// **'Punto de interes cercano'**
  String get nearbyPointOfInterest;

  /// No description provided for @upcomingEvents.
  ///
  /// In es, this message translates to:
  /// **'Próximos Eventos'**
  String get upcomingEvents;

  /// No description provided for @all.
  ///
  /// In es, this message translates to:
  /// **'Todos'**
  String get all;

  /// No description provided for @allFem.
  ///
  /// In es, this message translates to:
  /// **'Todas'**
  String get allFem;

  /// No description provided for @any.
  ///
  /// In es, this message translates to:
  /// **'Cualquiera'**
  String get any;

  /// No description provided for @searchDestination.
  ///
  /// In es, this message translates to:
  /// **'Buscar destino...'**
  String get searchDestination;

  /// No description provided for @matchAffinity.
  ///
  /// In es, this message translates to:
  /// **'Afinidad'**
  String get matchAffinity;

  /// No description provided for @vibeMatchAffinity.
  ///
  /// In es, this message translates to:
  /// **'Afinidad Vibe'**
  String get vibeMatchAffinity;

  /// No description provided for @typeUrban.
  ///
  /// In es, this message translates to:
  /// **'Urbano'**
  String get typeUrban;

  /// No description provided for @typeHistorical.
  ///
  /// In es, this message translates to:
  /// **'Histórico'**
  String get typeHistorical;

  /// No description provided for @typeGastronomic.
  ///
  /// In es, this message translates to:
  /// **'Gastronómico'**
  String get typeGastronomic;

  /// No description provided for @typeCultural.
  ///
  /// In es, this message translates to:
  /// **'Cultural'**
  String get typeCultural;

  /// No description provided for @typeEcological.
  ///
  /// In es, this message translates to:
  /// **'Ecológico'**
  String get typeEcological;

  /// No description provided for @typeRomantic.
  ///
  /// In es, this message translates to:
  /// **'Romántico'**
  String get typeRomantic;

  /// No description provided for @typeSports.
  ///
  /// In es, this message translates to:
  /// **'Deportivo'**
  String get typeSports;

  /// No description provided for @typeNightlife.
  ///
  /// In es, this message translates to:
  /// **'Nocturno'**
  String get typeNightlife;

  /// No description provided for @typeFamily.
  ///
  /// In es, this message translates to:
  /// **'Familiar'**
  String get typeFamily;

  /// No description provided for @typeCustom.
  ///
  /// In es, this message translates to:
  /// **'Personalizado'**
  String get typeCustom;

  /// No description provided for @appearanceSystem.
  ///
  /// In es, this message translates to:
  /// **'Sistema'**
  String get appearanceSystem;

  /// No description provided for @appearanceLight.
  ///
  /// In es, this message translates to:
  /// **'Claro'**
  String get appearanceLight;

  /// No description provided for @appearanceDark.
  ///
  /// In es, this message translates to:
  /// **'Oscuro'**
  String get appearanceDark;

  /// No description provided for @pqrsMyPqrs.
  ///
  /// In es, this message translates to:
  /// **'Mis PQRS'**
  String get pqrsMyPqrs;

  /// No description provided for @pqrsHistorySub.
  ///
  /// In es, this message translates to:
  /// **'Historial de tus solicitudes y respuestas del administrador'**
  String get pqrsHistorySub;

  /// No description provided for @pqrsStatusAnswered.
  ///
  /// In es, this message translates to:
  /// **'RESPONDIDO'**
  String get pqrsStatusAnswered;

  /// No description provided for @pqrsStatusOpen.
  ///
  /// In es, this message translates to:
  /// **'PENDIENTE'**
  String get pqrsStatusOpen;

  /// No description provided for @pqrsTapToView.
  ///
  /// In es, this message translates to:
  /// **'Toca para ver la respuesta'**
  String get pqrsTapToView;

  /// No description provided for @pqrsAdminResponse.
  ///
  /// In es, this message translates to:
  /// **'Respuesta del administrador'**
  String get pqrsAdminResponse;

  /// No description provided for @pqrsClose.
  ///
  /// In es, this message translates to:
  /// **'Cerrar'**
  String get pqrsClose;

  /// No description provided for @pqrsEmpty.
  ///
  /// In es, this message translates to:
  /// **'Aún no tienes solicitudes en el historial.'**
  String get pqrsEmpty;

  /// No description provided for @helpBody1a.
  ///
  /// In es, this message translates to:
  /// **'Puedes abrir VibeTours como invitado para explorar tours aprobados, lugares cercanos, el mapa basico y detalles publicos.'**
  String get helpBody1a;

  /// No description provided for @helpBody1b.
  ///
  /// In es, this message translates to:
  /// **'Para crear tours, guardar favoritos en la nube, comentar, calificar, enviar PQRS o pedir disponibilidad necesitas iniciar sesion.'**
  String get helpBody1b;

  /// No description provided for @helpBody1c.
  ///
  /// In es, this message translates to:
  /// **'Si intentas una accion privada, VibeTours mostrara el aviso \'Inicia sesion para continuar\' sin perder lo que estabas viendo.'**
  String get helpBody1c;

  /// No description provided for @helpBody1d.
  ///
  /// In es, this message translates to:
  /// **'El login por correo se mantiene disponible. Si Google esta configurado, tambien puedes entrar con tu cuenta de Google.'**
  String get helpBody1d;

  /// No description provided for @helpBody2a.
  ///
  /// In es, this message translates to:
  /// **'La seccion Descubrir muestra lugares destacados usando tu ubicacion y recomendaciones cercanas.'**
  String get helpBody2a;

  /// No description provided for @helpBody2b.
  ///
  /// In es, this message translates to:
  /// **'Si el buscador esta vacio, veras recomendaciones populares o cercanas para que la pantalla nunca quede sin contenido.'**
  String get helpBody2b;

  /// No description provided for @helpBody2c.
  ///
  /// In es, this message translates to:
  /// **'Puedes buscar palabras como museo, restaurante, parque, playa o mirador para encontrar lugares reales.'**
  String get helpBody2c;

  /// No description provided for @helpBody2d.
  ///
  /// In es, this message translates to:
  /// **'Usa filtros de categoria, precio, distancia y apto para menores para ajustar los resultados.'**
  String get helpBody2d;

  /// No description provided for @helpBody3a.
  ///
  /// In es, this message translates to:
  /// **'Explora tours creados por la comunidad o generados por nuestra IA.'**
  String get helpBody3a;

  /// No description provided for @helpBody3b.
  ///
  /// In es, this message translates to:
  /// **'Usa la barra de busqueda superior para buscar tours por nombre o palabra clave.'**
  String get helpBody3b;

  /// No description provided for @helpBody3c.
  ///
  /// In es, this message translates to:
  /// **'Toca el icono de filtros para ajustar la busqueda por categoria, precio y mas.'**
  String get helpBody3c;

  /// No description provided for @helpBody4a.
  ///
  /// In es, this message translates to:
  /// **'Visualiza lugares turisticos, eventos y puntos de interes directamente en el mapa.'**
  String get helpBody4a;

  /// No description provided for @helpBody4b.
  ///
  /// In es, this message translates to:
  /// **'Toca sobre los pines para ver una tarjeta rapida del lugar.'**
  String get helpBody4b;

  /// No description provided for @helpBody4c.
  ///
  /// In es, this message translates to:
  /// **'Al tocar una tarjeta, se abrira el detalle del lugar donde puedes guardarlo, pedir disponibilidad si es un restaurante/hotel, o iniciar la ruta hasta alli.'**
  String get helpBody4c;

  /// No description provided for @helpBody5a.
  ///
  /// In es, this message translates to:
  /// **'Crea tus propios tours agregando un nombre, descripcion e imagen de portada.'**
  String get helpBody5a;

  /// No description provided for @helpBody5b.
  ///
  /// In es, this message translates to:
  /// **'Agrega paradas (lugares) buscandolos en nuestra base de datos conectada a mapas.'**
  String get helpBody5b;

  /// No description provided for @helpBody5c.
  ///
  /// In es, this message translates to:
  /// **'Puedes definir cuantas personas y cuantos dias dura el tour.'**
  String get helpBody5c;

  /// No description provided for @helpBody6a.
  ///
  /// In es, this message translates to:
  /// **'Genera un tour completo simplemente describiendo lo que quieres ver y hacer con la IA.'**
  String get helpBody6a;

  /// No description provided for @helpBody6b.
  ///
  /// In es, this message translates to:
  /// **'Puedes usar opciones avanzadas para especificar si dura dias u horas.'**
  String get helpBody6b;

  /// No description provided for @helpBody6c.
  ///
  /// In es, this message translates to:
  /// **'Una vez generado el tour, puedes guardarlo en tu cuenta o editarlo para agregar o quitar paradas antes de guardarlo.'**
  String get helpBody6c;

  /// No description provided for @helpBody7a.
  ///
  /// In es, this message translates to:
  /// **'Puedes editar tus tours creados en la seccion de \'Mis Tours\'.'**
  String get helpBody7a;

  /// No description provided for @helpBody7b.
  ///
  /// In es, this message translates to:
  /// **'Guarda tus lugares favoritos y organizalos para consultarlos rapidamente.'**
  String get helpBody7b;

  /// No description provided for @helpBody8a.
  ///
  /// In es, this message translates to:
  /// **'Completa tu perfil turistico eligiendo tus intereses y categorias favoritas.'**
  String get helpBody8a;

  /// No description provided for @helpBody8b.
  ///
  /// In es, this message translates to:
  /// **'Cambia tu foto, nombre y preferencias de idioma y tema visual.'**
  String get helpBody8b;

  /// No description provided for @helpBody9a.
  ///
  /// In es, this message translates to:
  /// **'Envia Peticiones, Quejas, Reclamos y Sugerencias directamente desde la app.'**
  String get helpBody9a;

  /// No description provided for @helpBody9b.
  ///
  /// In es, this message translates to:
  /// **'Revisa el estado de tus PQRS y las respuestas del administrador en la pestana \'Historial\'.'**
  String get helpBody9b;

  /// No description provided for @privSec1Title.
  ///
  /// In es, this message translates to:
  /// **'Datos que recopilamos'**
  String get privSec1Title;

  /// No description provided for @privSec1Body.
  ///
  /// In es, this message translates to:
  /// **'Podemos procesar email, identificador de usuario, nombre visible, foto de perfil, biografía, preferencias turísticas, favoritos, tours creados, tours realizados, calificación de tours, historial de PQRS, ubicación aproximada y datos técnicos del dispositivo necesarios para operar y optimizar la app.'**
  String get privSec1Body;

  /// No description provided for @privSec2Title.
  ///
  /// In es, this message translates to:
  /// **'Uso de ubicación y permisos'**
  String get privSec2Title;

  /// No description provided for @privSec2Body.
  ///
  /// In es, this message translates to:
  /// **'La ubicación precisa o aproximada se utiliza para calcular clima local, lugares cercanos, eventos de la zona, progreso durante un tour, distancia restante y recomendaciones en tiempo real. Puedes revocar el permiso desde los ajustes del sistema, aunque algunas funciones dependerán de la ubicación manual.'**
  String get privSec2Body;

  /// No description provided for @privSec3Title.
  ///
  /// In es, this message translates to:
  /// **'Inteligencia Artificial y Recomendaciones'**
  String get privSec3Title;

  /// No description provided for @privSec3Body.
  ///
  /// In es, this message translates to:
  /// **'Las solicitudes al planificador IA pueden incluir destino, ciudad, país, duración, tipo de tour, idioma y texto libre. Usamos estos datos anónimamente para generar rutas lógicas, descripciones, paradas e imágenes. No compartimos tus datos personales con los proveedores de IA, solo los parámetros de búsqueda.'**
  String get privSec3Body;

  /// No description provided for @privSec4Title.
  ///
  /// In es, this message translates to:
  /// **'Almacenamiento, Seguridad y Sincronización'**
  String get privSec4Title;

  /// No description provided for @privSec4Body.
  ///
  /// In es, this message translates to:
  /// **'Tus datos de cuenta y preferencias (moneda, idioma, logros) se almacenan de manera segura en Supabase con políticas de seguridad de nivel de fila (RLS). La app móvil solo utiliza claves públicas para el acceso, asegurando que tus datos están protegidos contra accesos no autorizados.'**
  String get privSec4Body;

  /// No description provided for @privSec5Title.
  ///
  /// In es, this message translates to:
  /// **'Contenido compartido y Público'**
  String get privSec5Title;

  /// No description provided for @privSec5Body.
  ///
  /// In es, this message translates to:
  /// **'Si decides publicar tours, dejar comentarios, valoraciones o enviar PQRS, este contenido estará asociado a tu cuenta. Los tours marcados como privados y los borradores no serán visibles para la comunidad.'**
  String get privSec5Body;

  /// No description provided for @privSec6Title.
  ///
  /// In es, this message translates to:
  /// **'Terceros y Analíticas'**
  String get privSec6Title;

  /// No description provided for @privSec6Body.
  ///
  /// In es, this message translates to:
  /// **'Podemos compartir datos anonimizados con servicios de analítica para entender cómo se utiliza la aplicación y mejorar nuestros algoritmos de recomendación. Nunca venderemos tus datos a terceros para fines publicitarios.'**
  String get privSec6Body;

  /// No description provided for @privSec7Title.
  ///
  /// In es, this message translates to:
  /// **'Retención y eliminación de datos'**
  String get privSec7Title;

  /// No description provided for @privSec7Body.
  ///
  /// In es, this message translates to:
  /// **'Conservamos tus datos mientras tu cuenta esté activa o sea necesario para prestar el servicio, seguridad, soporte y obligaciones legales. Puedes solicitar una copia de tus datos o su eliminación definitiva a través del módulo de PQRS o contactando a soporte técnico.'**
  String get privSec7Body;

  /// No description provided for @termsSec1Title.
  ///
  /// In es, this message translates to:
  /// **'Aceptación y Uso de la aplicación'**
  String get termsSec1Title;

  /// No description provided for @termsSec1Body.
  ///
  /// In es, this message translates to:
  /// **'Al usar VIBETOURS, aceptas estos términos en su totalidad. La app ofrece descubrimiento, creación y recorrido de tours turísticos. El usuario se compromete a usar la app de forma responsable, respetando normativas locales, el medio ambiente y evitando zonas restringidas, propiedades privadas o peligrosas.'**
  String get termsSec1Body;

  /// No description provided for @termsSec2Title.
  ///
  /// In es, this message translates to:
  /// **'Exactitud de Mapas, Rutas y Precios'**
  String get termsSec2Title;

  /// No description provided for @termsSec2Body.
  ///
  /// In es, this message translates to:
  /// **'Los mapas, tiempos, distancias, rutas y precios (incluso convertidos a diferentes monedas) son estimaciones referenciales. Pueden existir cierres, cambios de horario, variaciones cambiarias, clima adverso o riesgos. Verifica siempre la información con fuentes oficiales antes de desplazarte o realizar compras.'**
  String get termsSec2Body;

  /// No description provided for @termsSec3Title.
  ///
  /// In es, this message translates to:
  /// **'Contenido generado por IA (VibeTour IA)'**
  String get termsSec3Title;

  /// No description provided for @termsSec3Body.
  ///
  /// In es, this message translates to:
  /// **'Los tours generados por nuestra Inteligencia Artificial son recomendaciones automatizadas basadas en bases de datos turísticas. Aunque nos esforzamos por ofrecer lugares reales y rutas coherentes, VIBETOURS no garantiza su precisión absoluta. El usuario debe validar horarios, accesibilidad y existencia real del lugar.'**
  String get termsSec3Body;

  /// No description provided for @termsSec4Title.
  ///
  /// In es, this message translates to:
  /// **'Propiedad Intelectual y Derechos de Autor'**
  String get termsSec4Title;

  /// No description provided for @termsSec4Body.
  ///
  /// In es, this message translates to:
  /// **'Todo el contenido original de la app pertenece a VIBETOURS. Al crear y hacer público un tour en nuestra plataforma, nos concedes una licencia no exclusiva para mostrarlo, promocionarlo y adaptarlo dentro del servicio.'**
  String get termsSec4Body;

  /// No description provided for @termsSec5Title.
  ///
  /// In es, this message translates to:
  /// **'Responsabilidad del usuario y Riesgos'**
  String get termsSec5Title;

  /// No description provided for @termsSec5Body.
  ///
  /// In es, this message translates to:
  /// **'El turismo al aire libre implica riesgos inherentes. El usuario es el único responsable de su seguridad, su salud, sus pertenencias y su comportamiento. VIBETOURS no actúa como agencia de viajes ni reemplaza a guías oficiales, autoridades o servicios de emergencia.'**
  String get termsSec5Body;

  /// No description provided for @termsSec6Title.
  ///
  /// In es, this message translates to:
  /// **'Directrices de Publicación de Tours y Reseñas'**
  String get termsSec6Title;

  /// No description provided for @termsSec6Body.
  ///
  /// In es, this message translates to:
  /// **'Queda estrictamente prohibido publicar contenido falso, difamatorio, ofensivo, discriminatorio, peligroso, spam o que infrinja derechos de autor o privacidad. VIBETOURS se reserva el derecho de moderar, ocultar o eliminar contenido y suspender cuentas que violen estas reglas.'**
  String get termsSec6Body;

  /// No description provided for @termsSec7Title.
  ///
  /// In es, this message translates to:
  /// **'Soporte, Reclamos y PQRS'**
  String get termsSec7Title;

  /// No description provided for @termsSec7Body.
  ///
  /// In es, this message translates to:
  /// **'Todas las peticiones, quejas, reclamos y sugerencias deben canalizarse a través del módulo PQRS integrado en la app. El tiempo objetivo de respuesta es menor a 24 horas hábiles, sujeto a disponibilidad técnica y complejidad del requerimiento.'**
  String get termsSec7Body;

  /// No description provided for @helpBody4d.
  ///
  /// In es, this message translates to:
  /// **'Cuando inicias un tour, el mapa te mostrara el progreso y la distancia restante a cada parada.'**
  String get helpBody4d;

  /// No description provided for @helpBody7c.
  ///
  /// In es, this message translates to:
  /// **'Guarda tours de otros usuarios en tus favoritos para acceder a ellos rapidamente.'**
  String get helpBody7c;

  /// No description provided for @helpBody8c.
  ///
  /// In es, this message translates to:
  /// **'Tus preferencias se utilizan para personalizar las recomendaciones en la seccion Descubrir y en la generacion de IA.'**
  String get helpBody8c;

  /// No description provided for @helpBody9c.
  ///
  /// In es, this message translates to:
  /// **'Puedes consultar el estado de tus solicitudes en el historial de PQRS.'**
  String get helpBody9c;

  /// No description provided for @authRequireTitle.
  ///
  /// In es, this message translates to:
  /// **'Inicia sesión para continuar'**
  String get authRequireTitle;

  /// No description provided for @authRequireBody.
  ///
  /// In es, this message translates to:
  /// **'Tu perfil, tus tours manuales y tus borradores privados se activan cuando entras con tu cuenta.'**
  String get authRequireBody;

  /// No description provided for @authLogin.
  ///
  /// In es, this message translates to:
  /// **'Iniciar sesión'**
  String get authLogin;

  /// No description provided for @authLoginTitle.
  ///
  /// In es, this message translates to:
  /// **'Iniciar sesión'**
  String get authLoginTitle;

  /// No description provided for @authCreateAccount.
  ///
  /// In es, this message translates to:
  /// **'Crea tu cuenta'**
  String get authCreateAccount;

  /// No description provided for @authSyncPrompt.
  ///
  /// In es, this message translates to:
  /// **'Regístrate para sincronizar tu itinerario en todos tus dispositivos y nunca pierdas un viaje.'**
  String get authSyncPrompt;

  /// No description provided for @authContinueGoogle.
  ///
  /// In es, this message translates to:
  /// **'Continuar con Google'**
  String get authContinueGoogle;

  /// No description provided for @authEmail.
  ///
  /// In es, this message translates to:
  /// **'Correo electrónico'**
  String get authEmail;

  /// No description provided for @authPassword.
  ///
  /// In es, this message translates to:
  /// **'Contraseña'**
  String get authPassword;

  /// No description provided for @authConfirmPassword.
  ///
  /// In es, this message translates to:
  /// **'Confirmar contraseña'**
  String get authConfirmPassword;

  /// No description provided for @authEnter.
  ///
  /// In es, this message translates to:
  /// **'Entrar'**
  String get authEnter;

  /// No description provided for @authCreateAccountBtn.
  ///
  /// In es, this message translates to:
  /// **'Crear cuenta'**
  String get authCreateAccountBtn;

  /// No description provided for @authNoAccount.
  ///
  /// In es, this message translates to:
  /// **'¿No tienes cuenta? '**
  String get authNoAccount;

  /// No description provided for @authRegister.
  ///
  /// In es, this message translates to:
  /// **'Regístrate'**
  String get authRegister;

  /// No description provided for @authHasAccount.
  ///
  /// In es, this message translates to:
  /// **'¿Ya tienes una cuenta? '**
  String get authHasAccount;

  /// No description provided for @authTermsPrompt.
  ///
  /// In es, this message translates to:
  /// **'Al continuar aceptas los Términos y la Política de Privacidad.'**
  String get authTermsPrompt;

  /// No description provided for @authErrorInvalid.
  ///
  /// In es, this message translates to:
  /// **'Ingresa email y una contraseña de al menos 6 caracteres.'**
  String get authErrorInvalid;

  /// No description provided for @authErrorMismatch.
  ///
  /// In es, this message translates to:
  /// **'Las contraseñas no coinciden.'**
  String get authErrorMismatch;

  /// No description provided for @authSuccessCreated.
  ///
  /// In es, this message translates to:
  /// **'Cuenta creada. Revisa tu correo si Supabase pide confirmar.'**
  String get authSuccessCreated;

  /// No description provided for @authErrorSupabase.
  ///
  /// In es, this message translates to:
  /// **'Configura SUPABASE_URL y SUPABASE_ANON_KEY para iniciar sesión.'**
  String get authErrorSupabase;

  /// No description provided for @authErrorGoogle.
  ///
  /// In es, this message translates to:
  /// **'Agrega GOOGLE_WEB_CLIENT_ID para usar Google nativo.'**
  String get authErrorGoogle;

  /// No description provided for @authLoginPrompt.
  ///
  /// In es, this message translates to:
  /// **'Iniciar sesión'**
  String get authLoginPrompt;

  /// No description provided for @prefTravelPreferences.
  ///
  /// In es, this message translates to:
  /// **'Preferencias de viaje'**
  String get prefTravelPreferences;

  /// No description provided for @prefStepOf.
  ///
  /// In es, this message translates to:
  /// **'Paso {current} de {total}'**
  String prefStepOf(Object current, Object total);

  /// No description provided for @prefCompleteProfile.
  ///
  /// In es, this message translates to:
  /// **'Completar Perfil'**
  String get prefCompleteProfile;

  /// No description provided for @prefNext.
  ///
  /// In es, this message translates to:
  /// **'Siguiente'**
  String get prefNext;

  /// No description provided for @prefSolo.
  ///
  /// In es, this message translates to:
  /// **'Solo'**
  String get prefSolo;

  /// No description provided for @prefCouple.
  ///
  /// In es, this message translates to:
  /// **'Pareja'**
  String get prefCouple;

  /// No description provided for @prefFriends.
  ///
  /// In es, this message translates to:
  /// **'Amigos'**
  String get prefFriends;

  /// No description provided for @prefFamily.
  ///
  /// In es, this message translates to:
  /// **'Familia'**
  String get prefFamily;

  /// No description provided for @prefBudgetEcon.
  ///
  /// In es, this message translates to:
  /// **'Económico'**
  String get prefBudgetEcon;

  /// No description provided for @prefBudgetMod.
  ///
  /// In es, this message translates to:
  /// **'Moderado'**
  String get prefBudgetMod;

  /// No description provided for @prefBudgetLux.
  ///
  /// In es, this message translates to:
  /// **'Lujo'**
  String get prefBudgetLux;

  /// No description provided for @prefTransWalk.
  ///
  /// In es, this message translates to:
  /// **'Caminando'**
  String get prefTransWalk;

  /// No description provided for @prefTransPub.
  ///
  /// In es, this message translates to:
  /// **'Transporte Público'**
  String get prefTransPub;

  /// No description provided for @prefTransCar.
  ///
  /// In es, this message translates to:
  /// **'Auto Rentado'**
  String get prefTransCar;

  /// No description provided for @prefTransTaxi.
  ///
  /// In es, this message translates to:
  /// **'Taxis/Apps'**
  String get prefTransTaxi;

  /// No description provided for @prefTimeMorn.
  ///
  /// In es, this message translates to:
  /// **'Mañanas'**
  String get prefTimeMorn;

  /// No description provided for @prefTimeAft.
  ///
  /// In es, this message translates to:
  /// **'Tardes'**
  String get prefTimeAft;

  /// No description provided for @prefTimeEve.
  ///
  /// In es, this message translates to:
  /// **'Noches'**
  String get prefTimeEve;

  /// No description provided for @prefIntBeaches.
  ///
  /// In es, this message translates to:
  /// **'Playas'**
  String get prefIntBeaches;

  /// No description provided for @prefIntNature.
  ///
  /// In es, this message translates to:
  /// **'Naturaleza'**
  String get prefIntNature;

  /// No description provided for @prefIntMuseums.
  ///
  /// In es, this message translates to:
  /// **'Museos'**
  String get prefIntMuseums;

  /// No description provided for @prefIntMonuments.
  ///
  /// In es, this message translates to:
  /// **'Monumentos históricos'**
  String get prefIntMonuments;

  /// No description provided for @prefIntGastronomy.
  ///
  /// In es, this message translates to:
  /// **'Gastronomía'**
  String get prefIntGastronomy;

  /// No description provided for @prefIntShopping.
  ///
  /// In es, this message translates to:
  /// **'Compras'**
  String get prefIntShopping;

  /// No description provided for @prefIntNightlife.
  ///
  /// In es, this message translates to:
  /// **'Vida nocturna'**
  String get prefIntNightlife;

  /// No description provided for @prefIntAdventures.
  ///
  /// In es, this message translates to:
  /// **'Aventuras'**
  String get prefIntAdventures;

  /// No description provided for @prefIntFamActivities.
  ///
  /// In es, this message translates to:
  /// **'Actividades familiares'**
  String get prefIntFamActivities;

  /// No description provided for @prefTitleTraveler.
  ///
  /// In es, this message translates to:
  /// **'Tipo de Viajero'**
  String get prefTitleTraveler;

  /// No description provided for @prefSubTraveler.
  ///
  /// In es, this message translates to:
  /// **'¿Con quién sueles viajar?'**
  String get prefSubTraveler;

  /// No description provided for @prefTitleBudget.
  ///
  /// In es, this message translates to:
  /// **'Presupuesto Ideal'**
  String get prefTitleBudget;

  /// No description provided for @prefSubBudget.
  ///
  /// In es, this message translates to:
  /// **'¿Cuál es tu presupuesto promedio por viaje?'**
  String get prefSubBudget;

  /// No description provided for @prefTitlePace.
  ///
  /// In es, this message translates to:
  /// **'Ritmo de Viaje'**
  String get prefTitlePace;

  /// No description provided for @prefSubPace.
  ///
  /// In es, this message translates to:
  /// **'¿Cómo prefieres vivir tus días de tour?'**
  String get prefSubPace;

  /// No description provided for @prefPaceRelaxed.
  ///
  /// In es, this message translates to:
  /// **'Ritmo Relajado'**
  String get prefPaceRelaxed;

  /// No description provided for @prefPaceRelaxedDesc.
  ///
  /// In es, this message translates to:
  /// **'Un lugar por día, mucho tiempo libre.'**
  String get prefPaceRelaxedDesc;

  /// No description provided for @prefPaceBalanced.
  ///
  /// In es, this message translates to:
  /// **'Ritmo Equilibrado'**
  String get prefPaceBalanced;

  /// No description provided for @prefPaceBalancedDesc.
  ///
  /// In es, this message translates to:
  /// **'Combinación ideal de visitas y descansos.'**
  String get prefPaceBalancedDesc;

  /// No description provided for @prefPaceFast.
  ///
  /// In es, this message translates to:
  /// **'Ritmo Acelerado'**
  String get prefPaceFast;

  /// No description provided for @prefPaceFastDesc.
  ///
  /// In es, this message translates to:
  /// **'Ver lo más posible, sin parar.'**
  String get prefPaceFastDesc;

  /// No description provided for @prefTitleTransport.
  ///
  /// In es, this message translates to:
  /// **'Modo de Transporte'**
  String get prefTitleTransport;

  /// No description provided for @prefSubTransport.
  ///
  /// In es, this message translates to:
  /// **'¿Cómo prefieres moverte en el destino?'**
  String get prefSubTransport;

  /// No description provided for @prefTitleTime.
  ///
  /// In es, this message translates to:
  /// **'Horario Preferido'**
  String get prefTitleTime;

  /// No description provided for @prefSubTime.
  ///
  /// In es, this message translates to:
  /// **'¿En qué momento del día prefieres hacer tours?'**
  String get prefSubTime;

  /// No description provided for @prefTitleInterests.
  ///
  /// In es, this message translates to:
  /// **'Tus Intereses'**
  String get prefTitleInterests;

  /// No description provided for @prefSubInterests.
  ///
  /// In es, this message translates to:
  /// **'¿Qué te apasiona descubrir?'**
  String get prefSubInterests;

  /// No description provided for @prefTitleLocation.
  ///
  /// In es, this message translates to:
  /// **'Permisos de Ubicación'**
  String get prefTitleLocation;

  /// No description provided for @prefSubLocation.
  ///
  /// In es, this message translates to:
  /// **'Para sugerirte lugares cercanos y optimizar tus rutas, necesitamos acceso a tu ubicación.'**
  String get prefSubLocation;

  /// No description provided for @prefBtnLocation.
  ///
  /// In es, this message translates to:
  /// **'Permitir Acceso'**
  String get prefBtnLocation;

  /// No description provided for @prefAiPrompt.
  ///
  /// In es, this message translates to:
  /// **'Hola. Me gustaría que me diseñes un viaje para {traveler}, manejando un presupuesto {budget}. Prefiero llevar un ritmo {pace} y me gustaría moverme principalmente en {transport}. El momento ideal para mis actividades sería por las {time}. Mis intereses principales son: {interests}.'**
  String prefAiPrompt(
    Object traveler,
    Object budget,
    Object pace,
    Object transport,
    Object time,
    Object interests,
  );

  /// No description provided for @prefAlmostDone.
  ///
  /// In es, this message translates to:
  /// **'¡Casi terminamos!'**
  String get prefAlmostDone;

  /// No description provided for @prefPleaseGrant.
  ///
  /// In es, this message translates to:
  /// **'Por favor concede el permiso para tener la mejor experiencia.'**
  String get prefPleaseGrant;

  /// No description provided for @prefGrantPermission.
  ///
  /// In es, this message translates to:
  /// **'Conceder Permiso'**
  String get prefGrantPermission;

  /// No description provided for @prefPermissionGranted.
  ///
  /// In es, this message translates to:
  /// **'¡Permiso concedido!'**
  String get prefPermissionGranted;

  /// No description provided for @prefPermissionDenied.
  ///
  /// In es, this message translates to:
  /// **'Permiso denegado. Podrás activarlo después.'**
  String get prefPermissionDenied;

  /// No description provided for @adminAccessRestricted.
  ///
  /// In es, this message translates to:
  /// **'Acceso restringido'**
  String get adminAccessRestricted;

  /// No description provided for @adminAccessRestrictedBody.
  ///
  /// In es, this message translates to:
  /// **'El administrador de VIBETOURS usa una cuenta única.'**
  String get adminAccessRestrictedBody;

  /// No description provided for @adminBackToSettings.
  ///
  /// In es, this message translates to:
  /// **'Volver a ajustes'**
  String get adminBackToSettings;

  /// No description provided for @adminNotifications.
  ///
  /// In es, this message translates to:
  /// **'Notificaciones'**
  String get adminNotifications;

  /// No description provided for @adminRefreshTours.
  ///
  /// In es, this message translates to:
  /// **'Actualizar tours'**
  String get adminRefreshTours;

  /// No description provided for @adminClosePanel.
  ///
  /// In es, this message translates to:
  /// **'Cerrar administrador'**
  String get adminClosePanel;

  /// No description provided for @adminLoadingPending.
  ///
  /// In es, this message translates to:
  /// **'Cargando tours pendientes'**
  String get adminLoadingPending;

  /// No description provided for @adminLoadingPendingBody.
  ///
  /// In es, this message translates to:
  /// **'Estamos consultando las solicitudes guardadas en Supabase.'**
  String get adminLoadingPendingBody;

  /// No description provided for @adminCouldNotLoad.
  ///
  /// In es, this message translates to:
  /// **'No se pudieron cargar'**
  String get adminCouldNotLoad;

  /// No description provided for @adminNoPendingTours.
  ///
  /// In es, this message translates to:
  /// **'Sin tours pendientes'**
  String get adminNoPendingTours;

  /// No description provided for @adminNoPendingToursBody.
  ///
  /// In es, this message translates to:
  /// **'Los tours manuales e IA nuevos apareceran aqui para aprobarlos o rechazarlos.'**
  String get adminNoPendingToursBody;

  /// No description provided for @adminControlCenter.
  ///
  /// In es, this message translates to:
  /// **'Centro de control con VibeTours'**
  String get adminControlCenter;

  /// No description provided for @adminControlCenterBody.
  ///
  /// In es, this message translates to:
  /// **'Gestiona aprobaciones, PQRS y metricas con permisos de administrador.'**
  String get adminControlCenterBody;

  /// No description provided for @adminNewReports.
  ///
  /// In es, this message translates to:
  /// **'Nuevos reportes'**
  String get adminNewReports;

  /// No description provided for @adminPqrsManagement.
  ///
  /// In es, this message translates to:
  /// **'Gestion de PQRS'**
  String get adminPqrsManagement;

  /// No description provided for @adminActiveTickets.
  ///
  /// In es, this message translates to:
  /// **'{count} Tickets Activos'**
  String adminActiveTickets(String count);

  /// No description provided for @adminToursToApprove.
  ///
  /// In es, this message translates to:
  /// **'Tours por aprobar'**
  String get adminToursToApprove;

  /// No description provided for @adminPqrsTitle.
  ///
  /// In es, this message translates to:
  /// **'Gestion de PQRS'**
  String get adminPqrsTitle;

  /// No description provided for @adminPqrsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Supervisa y responde las solicitudes de tus usuarios en tiempo real.'**
  String get adminPqrsSubtitle;

  /// No description provided for @adminSearchPqrs.
  ///
  /// In es, this message translates to:
  /// **'Buscar PQRS...'**
  String get adminSearchPqrs;

  /// No description provided for @adminNoPqrs.
  ///
  /// In es, this message translates to:
  /// **'Sin PQRS'**
  String get adminNoPqrs;

  /// No description provided for @adminNoPqrsBody.
  ///
  /// In es, this message translates to:
  /// **'Cuando los usuarios escriban, sus casos apareceran aqui.'**
  String get adminNoPqrsBody;

  /// No description provided for @adminSystemRole.
  ///
  /// In es, this message translates to:
  /// **'Administrador de Sistemas - Operaciones Globales'**
  String get adminSystemRole;

  /// No description provided for @adminAdministrativeActions.
  ///
  /// In es, this message translates to:
  /// **'Acciones Administrativas'**
  String get adminAdministrativeActions;

  /// No description provided for @adminModeratedToursHistory.
  ///
  /// In es, this message translates to:
  /// **'Historial de Tours Moderados'**
  String get adminModeratedToursHistory;

  /// No description provided for @adminModeratedToursHistorySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Revisar y gestionar tours aceptados o rechazados'**
  String get adminModeratedToursHistorySubtitle;

  /// No description provided for @adminPaymentHistory.
  ///
  /// In es, this message translates to:
  /// **'Historial de Pagos'**
  String get adminPaymentHistory;

  /// No description provided for @adminPaymentHistorySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Transacciones financieras y pagos de monetización'**
  String get adminPaymentHistorySubtitle;

  /// No description provided for @adminPqrsHistory.
  ///
  /// In es, this message translates to:
  /// **'Historial de PQRS'**
  String get adminPqrsHistory;

  /// No description provided for @adminPqrsHistorySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Casos respondidos y resoluciones de soporte'**
  String get adminPqrsHistorySubtitle;

  /// No description provided for @adminPlatformPulseSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Estado del sistema y usuarios activos de la semana.'**
  String get adminPlatformPulseSubtitle;

  /// No description provided for @adminLoadingActiveUsers.
  ///
  /// In es, this message translates to:
  /// **'Cargando usuarios activos...'**
  String get adminLoadingActiveUsers;

  /// No description provided for @adminConnectedUsersThisWeek.
  ///
  /// In es, this message translates to:
  /// **'Usuarios conectados esta semana: {count}'**
  String adminConnectedUsersThisWeek(int count);

  /// No description provided for @adminSystemIntegrity.
  ///
  /// In es, this message translates to:
  /// **'INTEGRIDAD DEL SISTEMA'**
  String get adminSystemIntegrity;

  /// No description provided for @adminSelectCase.
  ///
  /// In es, this message translates to:
  /// **'Selecciona un caso'**
  String get adminSelectCase;

  /// No description provided for @adminSelectCaseBody.
  ///
  /// In es, this message translates to:
  /// **'El panel de respuesta aparece cuando eliges un PQRS.'**
  String get adminSelectCaseBody;

  /// No description provided for @adminResponseTitle.
  ///
  /// In es, this message translates to:
  /// **'Respuesta del administrador'**
  String get adminResponseTitle;

  /// No description provided for @adminDraftSaved.
  ///
  /// In es, this message translates to:
  /// **'Borrador guardado'**
  String get adminDraftSaved;

  /// No description provided for @adminResponseHint.
  ///
  /// In es, this message translates to:
  /// **'Escribe aqui la respuesta oficial para el usuario...'**
  String get adminResponseHint;

  /// No description provided for @adminSaveResponse.
  ///
  /// In es, this message translates to:
  /// **'Guardar respuesta'**
  String get adminSaveResponse;

  /// No description provided for @adminPostpone.
  ///
  /// In es, this message translates to:
  /// **'Posponer'**
  String get adminPostpone;

  /// No description provided for @adminStatusAnswered.
  ///
  /// In es, this message translates to:
  /// **'RESPONDIDO'**
  String get adminStatusAnswered;

  /// No description provided for @adminStatusPending.
  ///
  /// In es, this message translates to:
  /// **'PENDIENTE'**
  String get adminStatusPending;

  /// No description provided for @adminPopularTopics.
  ///
  /// In es, this message translates to:
  /// **'Distribución de PQRS'**
  String get adminPopularTopics;

  /// No description provided for @adminTopicRefunds.
  ///
  /// In es, this message translates to:
  /// **'Reembolsos'**
  String get adminTopicRefunds;

  /// No description provided for @adminTopicSchedules.
  ///
  /// In es, this message translates to:
  /// **'Horarios'**
  String get adminTopicSchedules;

  /// No description provided for @adminTopicBilling.
  ///
  /// In es, this message translates to:
  /// **'Facturacion'**
  String get adminTopicBilling;

  /// No description provided for @adminTourStops.
  ///
  /// In es, this message translates to:
  /// **'{count} paradas'**
  String adminTourStops(int count);

  /// No description provided for @adminCreatedWithAI.
  ///
  /// In es, this message translates to:
  /// **'Creado con IA'**
  String get adminCreatedWithAI;

  /// No description provided for @adminCreatedManually.
  ///
  /// In es, this message translates to:
  /// **'Creado manualmente'**
  String get adminCreatedManually;

  /// No description provided for @adminApprove.
  ///
  /// In es, this message translates to:
  /// **'Aprobar'**
  String get adminApprove;

  /// No description provided for @adminReject.
  ///
  /// In es, this message translates to:
  /// **'Rechazar'**
  String get adminReject;

  /// No description provided for @adminWriteOfficialResponse.
  ///
  /// In es, this message translates to:
  /// **'Escribe una respuesta oficial para el usuario.'**
  String get adminWriteOfficialResponse;

  /// No description provided for @adminResponseSaved.
  ///
  /// In es, this message translates to:
  /// **'Respuesta guardada para el usuario.'**
  String get adminResponseSaved;

  /// No description provided for @adminSupabaseNotConfigured.
  ///
  /// In es, this message translates to:
  /// **'Supabase no esta configurado.'**
  String get adminSupabaseNotConfigured;

  /// No description provided for @adminCouldNotLoadPending.
  ///
  /// In es, this message translates to:
  /// **'No se pudieron cargar los tours pendientes. Revisa permisos o migraciones.'**
  String get adminCouldNotLoadPending;

  /// No description provided for @adminTourApproved.
  ///
  /// In es, this message translates to:
  /// **'{title} aprobado para publicacion.'**
  String adminTourApproved(String title);

  /// No description provided for @adminTourRejected.
  ///
  /// In es, this message translates to:
  /// **'{title} rechazado.'**
  String adminTourRejected(String title);

  /// No description provided for @adminCouldNotApproveTour.
  ///
  /// In es, this message translates to:
  /// **'No se pudo aprobar el tour. Revisa permisos o conexion.'**
  String get adminCouldNotApproveTour;

  /// No description provided for @adminCouldNotRejectTour.
  ///
  /// In es, this message translates to:
  /// **'No se pudo rechazar el tour. Revisa permisos o conexion.'**
  String get adminCouldNotRejectTour;

  /// No description provided for @adminSectionAdministration.
  ///
  /// In es, this message translates to:
  /// **'Administración'**
  String get adminSectionAdministration;

  /// No description provided for @adminControlPanelTitle.
  ///
  /// In es, this message translates to:
  /// **'Panel de Control Administrador'**
  String get adminControlPanelTitle;

  /// No description provided for @adminControlPanelSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Gestionar tours pendientes y soporte'**
  String get adminControlPanelSubtitle;

  /// No description provided for @adminSectionPerformance.
  ///
  /// In es, this message translates to:
  /// **'Rendimiento y visualización'**
  String get adminSectionPerformance;

  /// No description provided for @admin120HzPreferred.
  ///
  /// In es, this message translates to:
  /// **'120Hz preferido'**
  String get admin120HzPreferred;

  /// No description provided for @admin60HzSaving.
  ///
  /// In es, this message translates to:
  /// **'60Hz ahorro'**
  String get admin60HzSaving;

  /// No description provided for @adminToursEventsRecs.
  ///
  /// In es, this message translates to:
  /// **'Tours, eventos, recomendaciones'**
  String get adminToursEventsRecs;

  /// No description provided for @adminMapAuto.
  ///
  /// In es, this message translates to:
  /// **'Automático (Tema)'**
  String get adminMapAuto;

  /// No description provided for @adminMapDay.
  ///
  /// In es, this message translates to:
  /// **'Día (Claro)'**
  String get adminMapDay;

  /// No description provided for @adminMapNight.
  ///
  /// In es, this message translates to:
  /// **'Noche (Oscuro)'**
  String get adminMapNight;

  /// No description provided for @adminMapSatellite.
  ///
  /// In es, this message translates to:
  /// **'Satélite (Híbrido)'**
  String get adminMapSatellite;

  /// No description provided for @adminMapPrefTitle.
  ///
  /// In es, this message translates to:
  /// **'Preferencia de mapa'**
  String get adminMapPrefTitle;

  /// No description provided for @adminMapAuto2.
  ///
  /// In es, this message translates to:
  /// **'Automático'**
  String get adminMapAuto2;

  /// No description provided for @adminMapAutoSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Sincronizado con el brillo de la app'**
  String get adminMapAutoSubtitle;

  /// No description provided for @adminMapDay2.
  ///
  /// In es, this message translates to:
  /// **'Día'**
  String get adminMapDay2;

  /// No description provided for @adminMapDaySubtitle.
  ///
  /// In es, this message translates to:
  /// **'Mapa claro y nítido'**
  String get adminMapDaySubtitle;

  /// No description provided for @adminMapNight2.
  ///
  /// In es, this message translates to:
  /// **'Noche'**
  String get adminMapNight2;

  /// No description provided for @adminMapNightSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Diseño oscuro premium'**
  String get adminMapNightSubtitle;

  /// No description provided for @adminMapSatellite2.
  ///
  /// In es, this message translates to:
  /// **'Satélite'**
  String get adminMapSatellite2;

  /// No description provided for @adminMapSatelliteSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Fotografía aérea ESRI'**
  String get adminMapSatelliteSubtitle;

  /// No description provided for @adminHistoryScreenTitle.
  ///
  /// In es, this message translates to:
  /// **'Historial de Tours Moderados'**
  String get adminHistoryScreenTitle;

  /// No description provided for @adminHistoryEmpty.
  ///
  /// In es, this message translates to:
  /// **'Historial vacío'**
  String get adminHistoryEmpty;

  /// No description provided for @adminHistoryEmptyBody.
  ///
  /// In es, this message translates to:
  /// **'Aún no se ha aceptado ni rechazado ningún tour.'**
  String get adminHistoryEmptyBody;

  /// No description provided for @adminHistoryReviewed.
  ///
  /// In es, this message translates to:
  /// **'Revisado: {date}'**
  String adminHistoryReviewed(String date);

  /// No description provided for @adminHistoryApproved.
  ///
  /// In es, this message translates to:
  /// **'ACEPTADO'**
  String get adminHistoryApproved;

  /// No description provided for @adminHistoryRejected.
  ///
  /// In es, this message translates to:
  /// **'RECHAZADO'**
  String get adminHistoryRejected;

  /// No description provided for @adminHistoryErrorLoading.
  ///
  /// In es, this message translates to:
  /// **'Error al cargar el historial: {error}'**
  String adminHistoryErrorLoading(String error);

  /// No description provided for @adminPaymentTitle.
  ///
  /// In es, this message translates to:
  /// **'Historial de Pagos'**
  String get adminPaymentTitle;

  /// No description provided for @adminPaymentComingSoon.
  ///
  /// In es, this message translates to:
  /// **'Monetización Próximamente'**
  String get adminPaymentComingSoon;

  /// No description provided for @adminPaymentComingSoonBody.
  ///
  /// In es, this message translates to:
  /// **'Esta sección mostrará las transacciones financieras y pagos a proveedores en una futura actualización, una vez que se implemente la monetización en la plataforma VIBETOURS.'**
  String get adminPaymentComingSoonBody;

  /// No description provided for @adminPqrsHistoryScreenTitle.
  ///
  /// In es, this message translates to:
  /// **'Historial de PQRS Respondidos'**
  String get adminPqrsHistoryScreenTitle;

  /// No description provided for @adminPqrsHistoryEmpty.
  ///
  /// In es, this message translates to:
  /// **'Sin PQRS respondidos'**
  String get adminPqrsHistoryEmpty;

  /// No description provided for @adminPqrsHistoryEmptyBody.
  ///
  /// In es, this message translates to:
  /// **'El historial estará disponible cuando respondas las consultas de soporte de tus usuarios.'**
  String get adminPqrsHistoryEmptyBody;

  /// No description provided for @adminPqrsUser.
  ///
  /// In es, this message translates to:
  /// **'Usuario: {id}... • Creado: {date}'**
  String adminPqrsUser(String id, String date);

  /// No description provided for @adminOriginalQuery.
  ///
  /// In es, this message translates to:
  /// **'Consulta original:'**
  String get adminOriginalQuery;

  /// No description provided for @adminOfficialResponse.
  ///
  /// In es, this message translates to:
  /// **'Respuesta oficial del Administrador:'**
  String get adminOfficialResponse;

  /// No description provided for @adminPqrsErrorLoading.
  ///
  /// In es, this message translates to:
  /// **'Error al cargar PQRS respondidos: {error}'**
  String adminPqrsErrorLoading(String error);

  /// No description provided for @adminKindPetition.
  ///
  /// In es, this message translates to:
  /// **'Peticion'**
  String get adminKindPetition;

  /// No description provided for @adminKindComplaint.
  ///
  /// In es, this message translates to:
  /// **'Queja'**
  String get adminKindComplaint;

  /// No description provided for @adminKindClaim.
  ///
  /// In es, this message translates to:
  /// **'Reclamo'**
  String get adminKindClaim;

  /// No description provided for @adminKindSuggestion.
  ///
  /// In es, this message translates to:
  /// **'Sugerencia'**
  String get adminKindSuggestion;

  /// No description provided for @adminNoSubject.
  ///
  /// In es, this message translates to:
  /// **'Sin asunto'**
  String get adminNoSubject;

  /// No description provided for @adminDemoTicket1Subject.
  ///
  /// In es, this message translates to:
  /// **'Duda sobre horarios en Medellin'**
  String get adminDemoTicket1Subject;

  /// No description provided for @adminDemoTicket1Body.
  ///
  /// In es, this message translates to:
  /// **'A que hora exactamente sale el transporte desde el punto de encuentro?'**
  String get adminDemoTicket1Body;

  /// No description provided for @adminDemoTicket2Subject.
  ///
  /// In es, this message translates to:
  /// **'Imagen de tour repetida'**
  String get adminDemoTicket2Subject;

  /// No description provided for @adminDemoTicket2Body.
  ///
  /// In es, this message translates to:
  /// **'Un tour aparece con una imagen que no corresponde al destino.'**
  String get adminDemoTicket2Body;
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

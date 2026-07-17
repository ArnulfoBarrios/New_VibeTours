// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'VIBETOURS';

  @override
  String get onboardingTitle => 'Your AI tourism guide';

  @override
  String get onboardingSubtitle =>
      'Discover, create, and follow real tours with maps, voice, and personalized recommendations.';

  @override
  String get start => 'Start';

  @override
  String get skip => 'Skip';

  @override
  String get profileTitle => 'Tourist profile';

  @override
  String get profileSubtitle =>
      'Choose your interests to personalize recommendations.';

  @override
  String get continueAction => 'Continue';

  @override
  String get home => 'Home';

  @override
  String get tours => 'Tours';

  @override
  String get aiPlanner => 'VibeTour AI';

  @override
  String get create => 'Create';

  @override
  String get profile => 'Profile';

  @override
  String get settings => 'Settings';

  @override
  String get recommendedTours => 'Recommended tours';

  @override
  String get nearbyPlaces => 'Nearby places';

  @override
  String get nearbyEvents => 'Nearby events';

  @override
  String get popularTours => 'Most popular';

  @override
  String get searchTours => 'Search tours';

  @override
  String get filters => 'Filters';

  @override
  String get country => 'Country';

  @override
  String get city => 'City';

  @override
  String get type => 'Type';

  @override
  String get duration => 'Duration';

  @override
  String get rating => 'Rating';

  @override
  String get startTour => 'Start tour';

  @override
  String get save => 'Save';

  @override
  String get share => 'Share';

  @override
  String get love => 'Love';

  @override
  String get route => 'Route';

  @override
  String get stops => 'Stops';

  @override
  String get distance => 'Distance';

  @override
  String get remaining => 'Remaining';

  @override
  String get voiceGuide => 'Voice guide';

  @override
  String get handsFree => 'Hands-free';

  @override
  String get recalculate => 'Recalculate';

  @override
  String get nextStop => 'Next stop';

  @override
  String get myTours => 'My tours';

  @override
  String get manualCreation => 'Manual creation';

  @override
  String get tourName => 'Tour name';

  @override
  String get description => 'Description';

  @override
  String get coverImage => 'Cover image';

  @override
  String get gallery => 'Gallery';

  @override
  String get category => 'Category';

  @override
  String get tags => 'Tags';

  @override
  String get difficulty => 'Difficulty';

  @override
  String get language => 'Language';

  @override
  String get addStop => 'Add stop';

  @override
  String get previewMap => 'Map preview';

  @override
  String get destination => 'Destination';

  @override
  String get freePrompt => 'Describe your tour';

  @override
  String get voicePromptPreparing => 'Preparing microphone...';

  @override
  String get voicePromptListening => 'Listening to your tour...';

  @override
  String get voicePromptStopped => 'Voice capture stopped.';

  @override
  String get voicePromptPermissionDenied =>
      'Microphone permission denied. Enable it in Settings.';

  @override
  String get voicePromptUnavailable =>
      'Speech recognition is unavailable on this device.';

  @override
  String get voicePromptNoMatch => 'We did not catch that clearly. Try again.';

  @override
  String get voicePromptBusy =>
      'The speech service is busy. Please wait a moment.';

  @override
  String get voicePromptNetworkError => 'Check your connection and try again.';

  @override
  String get voicePromptError => 'We could not process the voice input.';

  @override
  String get detecting => 'Detecting experience';

  @override
  String get generateTour => 'Generate tour';

  @override
  String get generatingTitle => 'Creating your VibeTour';

  @override
  String get generatingDestination => 'Analyzing destination';

  @override
  String get generatingPlaces => 'Searching places';

  @override
  String get generatingRoute => 'Organizing route';

  @override
  String get generatingImages => 'Generating images';

  @override
  String get generatingExperience => 'Creating experience';

  @override
  String guestLimit(Object count) {
    return 'Free demo: $count AI tours left';
  }

  @override
  String get login => 'Sign in';

  @override
  String get logout => 'Sign out';

  @override
  String get appearance => 'Appearance';

  @override
  String get notifications => 'Notifications';

  @override
  String get mapPreference => 'Map preference';

  @override
  String get helpCenter => 'Help center';

  @override
  String get privacy => 'Privacy policy';

  @override
  String get terms => 'Terms and conditions';

  @override
  String get rateApp => 'Rate app';

  @override
  String get monthlyActivity => 'Monthly activity';

  @override
  String get favoriteCategories => 'Favorite categories';

  @override
  String get favoriteDestinations => 'Favorite destinations';

  @override
  String get explore => 'Explore';

  @override
  String get noToursAvailable => 'No tours available';

  @override
  String get featured => 'FEATURED';

  @override
  String get days => 'days';

  @override
  String get planTrip => 'Plan trip';

  @override
  String get continuePlanning => 'Continue planning';

  @override
  String get continuePlanningSub => 'Pick up where you left off';

  @override
  String get viewAll => 'View all';

  @override
  String get coastToCoast => 'Coast to coast';

  @override
  String get coastToCoastSub => 'Skyscrapers, wild canyons and surf beaches';

  @override
  String get wildBeauty => 'Wild beauty';

  @override
  String get wildBeautySub => 'Endless skies, big animals and endless horizons';

  @override
  String get biography => 'Biography';

  @override
  String get editProfilePhoto => 'Change profile photo';

  @override
  String get chooseFromGallery => 'Choose from gallery';

  @override
  String get imageUrl => 'Image URL';

  @override
  String get cancel => 'Cancel';

  @override
  String get saveUrl => 'Save URL';

  @override
  String get defaultBio => 'Add a biography and your tastes here...';

  @override
  String get createdTours => 'Created Tours';

  @override
  String get toursRated => 'Rated';

  @override
  String get participants => 'Participants';

  @override
  String get errorLoadingStats => 'Error loading stats';

  @override
  String get preferences => 'Preferences';

  @override
  String get goPremium => 'Go premium';

  @override
  String get currency => 'Currency';

  @override
  String get support => 'Support';

  @override
  String get about => 'About';

  @override
  String get feedback => 'Feedback';

  @override
  String get rateUs => 'Rate us';

  @override
  String get legal => 'Legal';

  @override
  String get termsOfService => 'Terms of service';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get introSlogan1 => 'Your trip in minutes,\nnot weeks.';

  @override
  String get introWhatType => 'Tell me what kind of trips you like.';

  @override
  String get startNow => 'Start now';

  @override
  String get alreadyUsedApp => 'Already used VibeTours? ';

  @override
  String get interestRomantic => '❤️ Romantic';

  @override
  String get interestParty => '🎉 Party';

  @override
  String get interestNature => '🌳 Nature';

  @override
  String get interestBeach => '⛱️ Beach';

  @override
  String get interestSafari => '🦁 Safari';

  @override
  String get interestAdventure => '🏔️ Adventure';

  @override
  String get interestArtCulture => '🎨 Art & culture';

  @override
  String get interestFamily => '👨‍👩‍👧 Family';

  @override
  String get interestGourmet => '🍽️ Gourmet';

  @override
  String get interestShopping => '🛍️ Shopping';

  @override
  String get interestWellness => '🧘 Wellness';

  @override
  String get interestSkiing => '🎿 Skiing';

  @override
  String get interestHiking => '🥾 Hiking';

  @override
  String get interestOther => '💭 Something else?';

  @override
  String get trips => 'Trips';

  @override
  String get legalPrivacyPolicy => 'Privacy Policy';

  @override
  String get legalTermsConditions => 'Terms and Conditions';

  @override
  String get legalPrivacyDesc =>
      'Your location and preferences are used to customize tours, weather, nearby places and events.';

  @override
  String get legalTermsDesc =>
      'Use VIBETOURS as a supporting guide. Confirm real conditions before traveling.';

  @override
  String get pqrsTitle => 'Create PQRS';

  @override
  String get pqrsDesc =>
      'Tell us about your experience. We are here to listen and improve our service.';

  @override
  String get pqrsReqType => 'Request type';

  @override
  String get pqrsPetition => 'Petition';

  @override
  String get pqrsComplaint => 'Complaint';

  @override
  String get pqrsClaim => 'Claim';

  @override
  String get pqrsSuggestion => 'Suggestion';

  @override
  String get pqrsSubject => 'Subject';

  @override
  String get pqrsSubjectHint => 'Short summary of your request';

  @override
  String get pqrsMessage => 'Message';

  @override
  String get pqrsMessageHint => 'Describe the facts in detail...';

  @override
  String get pqrsSend => 'Send';

  @override
  String get pqrsSending => 'Sending...';

  @override
  String get pqrsFastResponse => 'Fast response';

  @override
  String get pqrsUnder24h => 'Under 24 business hours';

  @override
  String get pqrsSecure => 'Secure';

  @override
  String get pqrsSsl => 'SSL Encryption';

  @override
  String get pqrsCreateTab => 'Create';

  @override
  String get pqrsHistoryTab => 'History';

  @override
  String get pqrsErrorFill => 'Fill out subject and message with more detail.';

  @override
  String get pqrsErrorSupabase => 'Supabase is not configured to send PQRS.';

  @override
  String get pqrsErrorLogin => 'Log in to send your PQRS.';

  @override
  String get pqrsSuccess =>
      'PQRS sent. We will respond in less than 24 business hours.';

  @override
  String aiHello(String name) {
    return 'Hello $name,\nwhat do you want\nto experience?';
  }

  @override
  String get aiAdvancedOptions => 'Advanced options';

  @override
  String get aiStart => 'Start';

  @override
  String get aiDetected => 'Detected:';

  @override
  String get aiSaveTour => 'Save tour';

  @override
  String get aiTourSaved => 'Tour saved successfully';

  @override
  String get aiPreviewTour => 'Preview tour';

  @override
  String get aiEditTour => 'Edit tour';

  @override
  String get aiDays => 'days';

  @override
  String get aiHoursPerDay => 'h/day';

  @override
  String get helpGuides => 'App Guides';

  @override
  String get helpDetailed => 'Detailed guide';

  @override
  String get helpDetailedSub =>
      'To explore, create, edit, save and enjoy tours.';

  @override
  String get helpSec1 => '1. Account';

  @override
  String get helpSec2 => '2. Discover';

  @override
  String get helpSec3 => '3. Tours';

  @override
  String get helpSec4 => '4. Map';

  @override
  String get helpSec5 => '5. Create';

  @override
  String get helpSec6 => '6. AI';

  @override
  String get helpSec7 => '7. Edit';

  @override
  String get helpSec8 => '8. Profile';

  @override
  String get helpSec9 => '9. PQRS';

  @override
  String get helpTitle1 => '1. Account, guest and login';

  @override
  String get helpTitle2 => '2. Discover places near you';

  @override
  String get helpTitle3 => '3. Tours Screen';

  @override
  String get helpTitle4 => '4. Map and navigation';

  @override
  String get helpTitle5 => '5. Manual Tour Creation';

  @override
  String get helpTitle6 => '6. VibeTour AI (Planner)';

  @override
  String get helpTitle7 => '7. Editing and saving';

  @override
  String get helpTitle8 => '8. Profile and personalization';

  @override
  String get helpTitle9 => '9. PQRS and Support';

  @override
  String get goodMorning => 'Good morning';

  @override
  String get editorsChoice => 'EDITOR\'S CHOICE';

  @override
  String get whereToNext => 'Where to next?';

  @override
  String get toursForYou => 'Tours for you';

  @override
  String get yourCurrentArea => 'Your current area';

  @override
  String get nearbyPointOfInterest => 'Nearby point of interest';

  @override
  String get upcomingEvents => 'Upcoming events';

  @override
  String get all => 'All';

  @override
  String get allFem => 'All';

  @override
  String get any => 'Any';

  @override
  String get searchDestination => 'Search destination...';

  @override
  String get matchAffinity => 'Match';

  @override
  String get vibeMatchAffinity => 'Vibe Match';

  @override
  String get typeUrban => 'Urban';

  @override
  String get typeHistorical => 'Historical';

  @override
  String get typeGastronomic => 'Gastronomic';

  @override
  String get typeCultural => 'Cultural';

  @override
  String get typeEcological => 'Ecological';

  @override
  String get typeRomantic => 'Romantic';

  @override
  String get typeSports => 'Sports';

  @override
  String get typeNightlife => 'Nightlife';

  @override
  String get typeFamily => 'Family';

  @override
  String get typeCustom => 'Custom';

  @override
  String get appearanceSystem => 'System';

  @override
  String get appearanceLight => 'Light';

  @override
  String get appearanceDark => 'Dark';

  @override
  String get pqrsMyPqrs => 'My PQRS';

  @override
  String get pqrsHistorySub =>
      'History of your requests and administrator responses';

  @override
  String get pqrsStatusAnswered => 'ANSWERED';

  @override
  String get pqrsStatusOpen => 'OPEN';

  @override
  String get pqrsTapToView => 'Tap to view response';

  @override
  String get pqrsAdminResponse => 'Administrator Response';

  @override
  String get pqrsClose => 'Close';

  @override
  String get pqrsEmpty => 'You don\'t have any requests in your history yet.';

  @override
  String get helpBody1a =>
      'You can open VibeTours as a guest to explore approved tours, nearby places, the basic map and public details.';

  @override
  String get helpBody1b =>
      'To create tours, save favorites in the cloud, comment, rate, send PQRS or request availability you need to log in.';

  @override
  String get helpBody1c =>
      'If you try a private action, VibeTours will show the warning \'Log in to continue\' without losing what you were seeing.';

  @override
  String get helpBody1d =>
      'Email login remains available. If Google is configured, you can also log in with your Google account.';

  @override
  String get helpBody2a =>
      'The Discover section shows highlighted places using your location and nearby recommendations.';

  @override
  String get helpBody2b =>
      'If the search engine is empty, you will see popular or nearby recommendations so that the screen is never empty of content.';

  @override
  String get helpBody2c =>
      'You can search for words like museum, restaurant, park, beach or viewpoint to find real places.';

  @override
  String get helpBody2d =>
      'Use filters for category, price, distance and suitable for minors to adjust the results.';

  @override
  String get helpBody3a =>
      'Explore tours created by the community or generated by our AI.';

  @override
  String get helpBody3b =>
      'Use the top search bar to search for tours by name or keyword.';

  @override
  String get helpBody3c =>
      'Tap the filter icon to adjust the search by category, price and more.';

  @override
  String get helpBody4a =>
      'View tourist places, events and points of interest directly on the map.';

  @override
  String get helpBody4b => 'Tap on the pins to see a quick card of the place.';

  @override
  String get helpBody4c =>
      'By touching a card, the detail of the place will open where you can save it, ask for availability if it is a restaurant/hotel, or start the route there.';

  @override
  String get helpBody5a =>
      'Create your own tours by adding a name, description and cover image.';

  @override
  String get helpBody5b =>
      'Add stops (places) by searching them in our database connected to maps.';

  @override
  String get helpBody5c =>
      'You can define how many people and how many days the tour lasts.';

  @override
  String get helpBody6a =>
      'Generate a complete tour simply by describing what you want to see and do with the AI.';

  @override
  String get helpBody6b =>
      'You can use advanced options to specify if it lasts days or hours.';

  @override
  String get helpBody6c =>
      'Once the tour is generated, you can save it in your account or edit it to add or remove stops before saving it.';

  @override
  String get helpBody7a =>
      'You can edit your created tours in the \'My Tours\' section.';

  @override
  String get helpBody7b =>
      'Save your favorite places and organize them to consult them quickly.';

  @override
  String get helpBody8a =>
      'Complete your tourist profile by choosing your favorite interests and categories.';

  @override
  String get helpBody8b =>
      'Change your photo, name and preferences for language and visual theme.';

  @override
  String get helpBody9a =>
      'Send Petitions, Complaints, Claims and Suggestions directly from the app.';

  @override
  String get helpBody9b =>
      'Check the status of your PQRS and administrator responses in the \'History\' tab.';

  @override
  String get privSec1Title => 'Data we collect';

  @override
  String get privSec1Body =>
      'We can process email, user identifier, display name, profile picture, biography, tourist preferences, favorites, created tours, completed tours, tour rating, PQRS history, approximate location and technical device data necessary to operate and optimize the app.';

  @override
  String get privSec2Title => 'Use of location and permissions';

  @override
  String get privSec2Body =>
      'Precise or approximate location is used to calculate local weather, nearby places, area events, progress during a tour, remaining distance and real-time recommendations. You can revoke permission from system settings, although some functions will depend on manual location.';

  @override
  String get privSec3Title => 'Artificial Intelligence and Recommendations';

  @override
  String get privSec3Body =>
      'Requests to the AI planner can include destination, city, country, duration, tour type, language and free text. We use these data anonymously to generate logical routes, descriptions, stops and images. We do not share your personal data with AI providers, only search parameters.';

  @override
  String get privSec4Title => 'Storage, Security and Synchronization';

  @override
  String get privSec4Body =>
      'Your account data and preferences (currency, language, achievements) are securely stored in Supabase with row-level security (RLS) policies. The mobile app only uses public keys for access, ensuring that your data is protected against unauthorized access.';

  @override
  String get privSec5Title => 'Shared and Public Content';

  @override
  String get privSec5Body =>
      'If you decide to publish tours, leave comments, ratings or send PQRS, this content will be associated with your account. Tours marked as private and drafts will not be visible to the community.';

  @override
  String get privSec6Title => 'Third parties and Analytics';

  @override
  String get privSec6Body =>
      'We can share anonymized data with analytics services to understand how the application is used and improve our recommendation algorithms. We will never sell your data to third parties for advertising purposes.';

  @override
  String get privSec7Title => 'Data retention and deletion';

  @override
  String get privSec7Body =>
      'We keep your data as long as your account is active or necessary to provide the service, security, support and legal obligations. You can request a copy of your data or its definitive deletion through the PQRS module or by contacting technical support.';

  @override
  String get termsSec1Title => 'Acceptance and Use of the application';

  @override
  String get termsSec1Body =>
      'By using VIBETOURS, you accept these terms in their entirety. The app offers discovery, creation and touring of tourist tours. The user agrees to use the app responsibly, respecting local regulations, the environment and avoiding restricted areas, private or dangerous properties.';

  @override
  String get termsSec2Title => 'Accuracy of Maps, Routes and Prices';

  @override
  String get termsSec2Body =>
      'Maps, times, distances, routes and prices (even converted to different currencies) are reference estimates. There may be closures, schedule changes, exchange rate variations, adverse weather or risks. Always verify information with official sources before traveling or making purchases.';

  @override
  String get termsSec3Title => 'AI Generated Content (VibeTour AI)';

  @override
  String get termsSec3Body =>
      'Tours generated by our Artificial Intelligence are automated recommendations based on tourist databases. Although we strive to offer real places and coherent routes, VIBETOURS does not guarantee its absolute accuracy. The user must validate schedules, accessibility and real existence of the place.';

  @override
  String get termsSec4Title => 'Intellectual Property and Copyright';

  @override
  String get termsSec4Body =>
      'All original content of the app belongs to VIBETOURS. By creating and publishing a tour on our platform, you grant us a non-exclusive license to display, promote and adapt it within the service.';

  @override
  String get termsSec5Title => 'User Responsibility and Risks';

  @override
  String get termsSec5Body =>
      'Outdoor tourism involves inherent risks. The user is solely responsible for their safety, health, belongings and behavior. VIBETOURS does not act as a travel agency nor replaces official guides, authorities or emergency services.';

  @override
  String get termsSec6Title => 'Tour Publishing and Review Guidelines';

  @override
  String get termsSec6Body =>
      'It is strictly prohibited to publish false, defamatory, offensive, discriminatory, dangerous, spam content or that infringes copyrights or privacy. VIBETOURS reserves the right to moderate, hide or remove content and suspend accounts that violate these rules.';

  @override
  String get termsSec7Title => 'Support, Claims and PQRS';

  @override
  String get termsSec7Body =>
      'All petitions, complaints, claims and suggestions must be channeled through the PQRS module integrated in the app. The target response time is less than 24 business hours, subject to technical availability and complexity of the requirement.';

  @override
  String get helpBody4d =>
      'When you start a tour, the map will show you the progress and remaining distance to each stop.';

  @override
  String get helpBody7c =>
      'Save other users\' tours in your favorites to access them quickly.';

  @override
  String get helpBody8c =>
      'Your preferences are used to customize recommendations in the Discover section and in AI generation.';

  @override
  String get helpBody9c =>
      'You can check the status of your requests in the PQRS history.';

  @override
  String get authRequireTitle => 'Log in to continue';

  @override
  String get authRequireBody =>
      'Your profile, manual tours and private drafts are activated when you log in with your account.';

  @override
  String get authLogin => 'Log in';

  @override
  String get authLoginTitle => 'Log in';

  @override
  String get authCreateAccount => 'Create your account';

  @override
  String get authSyncPrompt =>
      'Sign up to sync your itinerary across all your devices and never miss a trip.';

  @override
  String get authContinueGoogle => 'Continue with Google';

  @override
  String get authEmail => 'Email';

  @override
  String get authPassword => 'Password';

  @override
  String get authConfirmPassword => 'Confirm password';

  @override
  String get authEnter => 'Enter';

  @override
  String get authCreateAccountBtn => 'Create account';

  @override
  String get authNoAccount => 'Don\'t have an account? ';

  @override
  String get authRegister => 'Sign up';

  @override
  String get authHasAccount => 'Already have an account? ';

  @override
  String get authTermsPrompt =>
      'By continuing you accept the Terms and Privacy Policy.';

  @override
  String get authErrorInvalid =>
      'Enter email and a password of at least 6 characters.';

  @override
  String get authErrorMismatch => 'Passwords do not match.';

  @override
  String get authSuccessCreated =>
      'Account created. Check your email if Supabase asks to confirm.';

  @override
  String get authErrorSupabase =>
      'Configure SUPABASE_URL and SUPABASE_ANON_KEY to log in.';

  @override
  String get authErrorGoogle =>
      'Add GOOGLE_WEB_CLIENT_ID to use native Google.';

  @override
  String get authLoginPrompt => 'Log in';

  @override
  String get prefTravelPreferences => 'Travel preferences';

  @override
  String prefStepOf(Object current, Object total) {
    return 'Step $current of $total';
  }

  @override
  String get prefCompleteProfile => 'Complete Profile';

  @override
  String get prefNext => 'Next';

  @override
  String get prefSolo => 'Just me';

  @override
  String get prefCouple => 'Couple';

  @override
  String get prefFriends => 'Friends';

  @override
  String get prefFamily => 'Family';

  @override
  String get prefBudgetEcon => 'Economic';

  @override
  String get prefBudgetMod => 'Moderate';

  @override
  String get prefBudgetLux => 'Luxury';

  @override
  String get prefTransWalk => 'Walking';

  @override
  String get prefTransPub => 'Public Transport';

  @override
  String get prefTransCar => 'Rental Car';

  @override
  String get prefTransTaxi => 'Taxis/Apps';

  @override
  String get prefTimeMorn => 'Mornings';

  @override
  String get prefTimeAft => 'Afternoons';

  @override
  String get prefTimeEve => 'Evenings';

  @override
  String get prefIntBeaches => 'Beaches';

  @override
  String get prefIntNature => 'Nature';

  @override
  String get prefIntMuseums => 'Museums';

  @override
  String get prefIntMonuments => 'Historical monuments';

  @override
  String get prefIntGastronomy => 'Gastronomy';

  @override
  String get prefIntShopping => 'Shopping';

  @override
  String get prefIntNightlife => 'Nightlife';

  @override
  String get prefIntAdventures => 'Adventures';

  @override
  String get prefIntFamActivities => 'Family activities';

  @override
  String get prefTitleTraveler => 'Traveler Type';

  @override
  String get prefSubTraveler => 'Who do you usually travel with?';

  @override
  String get prefTitleBudget => 'Ideal Budget';

  @override
  String get prefSubBudget => 'What is your average budget per trip?';

  @override
  String get prefTitlePace => 'Travel Pace';

  @override
  String get prefSubPace => 'How do you prefer to experience your tour days?';

  @override
  String get prefPaceRelaxed => 'Relaxed Pace';

  @override
  String get prefPaceRelaxedDesc => 'One place a day, lots of free time.';

  @override
  String get prefPaceBalanced => 'Balanced Pace';

  @override
  String get prefPaceBalancedDesc => 'Ideal mix of visits and breaks.';

  @override
  String get prefPaceFast => 'Fast Pace';

  @override
  String get prefPaceFastDesc => 'See as much as possible, non-stop.';

  @override
  String get prefTitleTransport => 'Transport Mode';

  @override
  String get prefSubTransport => 'How do you prefer to get around?';

  @override
  String get prefTitleTime => 'Preferred Time';

  @override
  String get prefSubTime => 'When do you prefer to do tours?';

  @override
  String get prefTitleInterests => 'Your Interests';

  @override
  String get prefSubInterests => 'What are you passionate about discovering?';

  @override
  String get prefTitleLocation => 'Location Permissions';

  @override
  String get prefSubLocation =>
      'To suggest nearby places and optimize your routes, we need access to your location.';

  @override
  String get prefBtnLocation => 'Allow Access';

  @override
  String prefAiPrompt(
    Object traveler,
    Object budget,
    Object pace,
    Object transport,
    Object time,
    Object interests,
  ) {
    return 'Hi. I\'d like you to design a trip for $traveler, with a $budget budget. I prefer a $pace pace and would like to get around mainly by $transport. The ideal time for my activities would be in the $time. My main interests are: $interests.';
  }

  @override
  String get prefAlmostDone => 'Almost done!';

  @override
  String get prefPleaseGrant =>
      'Please grant permission to have the best experience.';

  @override
  String get prefGrantPermission => 'Grant Permission';

  @override
  String get prefPermissionGranted => 'Permission granted!';

  @override
  String get prefPermissionDenied =>
      'Permission denied. You can enable it later.';

  @override
  String get adminAccessRestricted => 'Restricted access';

  @override
  String get adminAccessRestrictedBody =>
      'The VIBETOURS administrator uses a unique account.';

  @override
  String get adminBackToSettings => 'Back to settings';

  @override
  String get adminNotifications => 'Notifications';

  @override
  String get adminRefreshTours => 'Refresh tours';

  @override
  String get adminClosePanel => 'Close administrator';

  @override
  String get adminLoadingPending => 'Loading pending tours';

  @override
  String get adminLoadingPendingBody =>
      'We are checking the requests saved in Supabase.';

  @override
  String get adminCouldNotLoad => 'Could not load';

  @override
  String get adminNoPendingTours => 'No pending tours';

  @override
  String get adminNoPendingToursBody =>
      'New manual and AI tours will appear here to approve or reject them.';

  @override
  String get adminControlCenter => 'Control Center with VibeTours';

  @override
  String get adminControlCenterBody =>
      'Manage approvals, PQRS and metrics with administrator permissions.';

  @override
  String get adminNewReports => 'New reports';

  @override
  String get adminPqrsManagement => 'PQRS Management';

  @override
  String adminActiveTickets(String count) {
    return '$count Active Tickets';
  }

  @override
  String get adminToursToApprove => 'Tours to approve';

  @override
  String get adminPqrsTitle => 'PQRS Management';

  @override
  String get adminPqrsSubtitle =>
      'Monitor and respond to your users\' requests in real time.';

  @override
  String get adminSearchPqrs => 'Search PQRS...';

  @override
  String get adminNoPqrs => 'No PQRS';

  @override
  String get adminNoPqrsBody =>
      'When users write, their cases will appear here.';

  @override
  String get adminSystemRole => 'Systems Administrator - Global Operations';

  @override
  String get adminAdministrativeActions => 'Administrative Actions';

  @override
  String get adminModeratedToursHistory => 'Moderated Tours History';

  @override
  String get adminModeratedToursHistorySubtitle =>
      'Review and manage accepted or rejected tours';

  @override
  String get adminPaymentHistory => 'Payment History';

  @override
  String get adminPaymentHistorySubtitle =>
      'Financial transactions and monetization payments';

  @override
  String get adminPqrsHistory => 'PQRS History';

  @override
  String get adminPqrsHistorySubtitle =>
      'Responded cases and support resolutions';

  @override
  String get adminPlatformPulseSubtitle =>
      'System status and active users this week.';

  @override
  String get adminLoadingActiveUsers => 'Loading active users...';

  @override
  String adminConnectedUsersThisWeek(int count) {
    return 'Connected users this week: $count';
  }

  @override
  String get adminSystemIntegrity => 'SYSTEM INTEGRITY';

  @override
  String get adminSelectCase => 'Select a case';

  @override
  String get adminSelectCaseBody =>
      'The response panel appears when you choose a PQRS.';

  @override
  String get adminResponseTitle => 'Administrator response';

  @override
  String get adminDraftSaved => 'Draft saved';

  @override
  String get adminResponseHint =>
      'Write the official response for the user here...';

  @override
  String get adminSaveResponse => 'Save response';

  @override
  String get adminPostpone => 'Postpone';

  @override
  String get adminStatusAnswered => 'ANSWERED';

  @override
  String get adminStatusPending => 'PENDING';

  @override
  String get adminPopularTopics => 'PQRS Distribution';

  @override
  String get adminTopicRefunds => 'Refunds';

  @override
  String get adminTopicSchedules => 'Schedules';

  @override
  String get adminTopicBilling => 'Billing';

  @override
  String adminTourStops(int count) {
    return '$count stops';
  }

  @override
  String get adminCreatedWithAI => 'Created with AI';

  @override
  String get adminCreatedManually => 'Created manually';

  @override
  String get adminApprove => 'Approve';

  @override
  String get adminReject => 'Reject';

  @override
  String get adminWriteOfficialResponse =>
      'Write an official response for the user.';

  @override
  String get adminResponseSaved => 'Response saved for the user.';

  @override
  String get adminSupabaseNotConfigured => 'Supabase is not configured.';

  @override
  String get adminCouldNotLoadPending =>
      'Could not load pending tours. Check permissions or migrations.';

  @override
  String adminTourApproved(String title) {
    return '$title approved for publication.';
  }

  @override
  String adminTourRejected(String title) {
    return '$title rejected.';
  }

  @override
  String get adminCouldNotApproveTour =>
      'Could not approve the tour. Check permissions or connection.';

  @override
  String get adminCouldNotRejectTour =>
      'Could not reject the tour. Check permissions or connection.';

  @override
  String get adminSectionAdministration => 'Administration';

  @override
  String get adminControlPanelTitle => 'Administrator Control Panel';

  @override
  String get adminControlPanelSubtitle => 'Manage pending tours and support';

  @override
  String get adminSectionPerformance => 'Performance and display';

  @override
  String get admin120HzPreferred => '120Hz preferred';

  @override
  String get admin60HzSaving => '60Hz saving';

  @override
  String get adminToursEventsRecs => 'Tours, events, recommendations';

  @override
  String get adminMapAuto => 'Automatic (Theme)';

  @override
  String get adminMapDay => 'Day (Light)';

  @override
  String get adminMapNight => 'Night (Dark)';

  @override
  String get adminMapSatellite => 'Satellite (Hybrid)';

  @override
  String get adminMapPrefTitle => 'Map preference';

  @override
  String get adminMapAuto2 => 'Automatic';

  @override
  String get adminMapAutoSubtitle => 'Synced with the app brightness';

  @override
  String get adminMapDay2 => 'Day';

  @override
  String get adminMapDaySubtitle => 'Clear and crisp map';

  @override
  String get adminMapNight2 => 'Night';

  @override
  String get adminMapNightSubtitle => 'Premium dark design';

  @override
  String get adminMapSatellite2 => 'Satellite';

  @override
  String get adminMapSatelliteSubtitle => 'ESRI aerial photography';

  @override
  String get adminHistoryScreenTitle => 'Moderated Tours History';

  @override
  String get adminHistoryEmpty => 'Empty history';

  @override
  String get adminHistoryEmptyBody =>
      'No tour has been accepted or rejected yet.';

  @override
  String adminHistoryReviewed(String date) {
    return 'Reviewed: $date';
  }

  @override
  String get adminHistoryApproved => 'APPROVED';

  @override
  String get adminHistoryRejected => 'REJECTED';

  @override
  String adminHistoryErrorLoading(String error) {
    return 'Error loading history: $error';
  }

  @override
  String get adminPaymentTitle => 'Payment History';

  @override
  String get adminPaymentComingSoon => 'Monetization Coming Soon';

  @override
  String get adminPaymentComingSoonBody =>
      'This section will show financial transactions and provider payments in a future update, once monetization is implemented on the VIBETOURS platform.';

  @override
  String get adminPqrsHistoryScreenTitle => 'Answered PQRS History';

  @override
  String get adminPqrsHistoryEmpty => 'No answered PQRS';

  @override
  String get adminPqrsHistoryEmptyBody =>
      'History will be available when you respond to your users\' support queries.';

  @override
  String adminPqrsUser(String id, String date) {
    return 'User: $id... • Created: $date';
  }

  @override
  String get adminOriginalQuery => 'Original query:';

  @override
  String get adminOfficialResponse => 'Official Administrator Response:';

  @override
  String adminPqrsErrorLoading(String error) {
    return 'Error loading answered PQRS: $error';
  }

  @override
  String get adminKindPetition => 'Petition';

  @override
  String get adminKindComplaint => 'Complaint';

  @override
  String get adminKindClaim => 'Claim';

  @override
  String get adminKindSuggestion => 'Suggestion';

  @override
  String get adminNoSubject => 'No subject';

  @override
  String get adminDemoTicket1Subject => 'Question about schedules in Medellin';

  @override
  String get adminDemoTicket1Body =>
      'What time exactly does the transport leave from the meeting point?';

  @override
  String get adminDemoTicket2Subject => 'Repeated tour image';

  @override
  String get adminDemoTicket2Body =>
      'A tour appears with an image that does not match the destination.';
}

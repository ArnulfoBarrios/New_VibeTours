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
  String get legalOpenFullWeb => 'View full document on web';

  @override
  String get legalWebNotice =>
      'Review the full, up-to-date and detailed terms on our official legal portal.';

  @override
  String get errorOpeningWeb => 'Could not open web browser.';

  @override
  String get pqrsTitle => 'New Request';

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
  String get pqrsErrorSupabase =>
      'Supabase is not configured to send requests.';

  @override
  String get pqrsErrorLogin => 'Log in to send your request.';

  @override
  String get pqrsSuccess =>
      'Request sent. We will respond in less than 24 business hours.';

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
      'Learn how to master all tools, Artificial Intelligence, and live audio-guided tours.';

  @override
  String get helpSearchPlaceholder => 'Search in app guides...';

  @override
  String get helpChipAll => 'All';

  @override
  String get helpChipAI => 'VibeTour AI';

  @override
  String get helpChipLive => 'Live Tour';

  @override
  String get helpChipExplore => 'Discover & Map';

  @override
  String get helpChipCreator => 'Create Tours';

  @override
  String get helpChipProfile => 'Profile & Settings';

  @override
  String get helpChipSupport => 'Support & PQRS';

  @override
  String get helpNoResults => 'No guides found for your search.';

  @override
  String get helpTipTitle => '💡 Best Usage Tips';

  @override
  String get helpSectionAITitle => '🤖 AI Planner Master Guide';

  @override
  String get helpSectionAISub =>
      'How to use Artificial Intelligence to generate high-level customized tours.';

  @override
  String get helpAI1Title => '1. Set Up Your Parameters';

  @override
  String get helpAI1Body =>
      'Before typing your request, select the destination (city or country), duration (hours or days), transport mode (walking, car, bicycle), and budget level (Budget, Moderate, or Luxury).';

  @override
  String get helpAI2Title => '2. Writing Effective Prompts';

  @override
  String get helpAI2Body =>
      'Be specific and clear about what you want. Instead of saying \'I want to see the city\', write: \'4-hour photography route through historical architecture in Medellín, with stops at traditional coffee shops and urban viewpoints\'.';

  @override
  String get helpAI2Tip =>
      'Pro Tip: Include special conditions like \'kid-friendly\', \'vegetarian options\', or \'avoid steep walks\'.';

  @override
  String get helpAI3Title => '3. Route Generation & Optimization';

  @override
  String get helpAI3Body =>
      'The AI analyzes real verified location data, orders stops logically to minimize travel time, and generates enriched descriptions with history, local secrets, and stop-specific tips.';

  @override
  String get helpAI4Title => '4. Editing Your Generated Itinerary';

  @override
  String get helpAI4Body =>
      'You are not limited to the initial result. Reorder stops, add new points directly from the map, update cover photos, and customize descriptions before saving the tour to your account.';

  @override
  String get helpSectionLiveTitle => '🧭 Live Tours & GPS Audio Guide';

  @override
  String get helpSectionLiveSub =>
      'Navigate with hands-free real-time voice guidance without constantly looking at your screen.';

  @override
  String get helpLive1Title => '1. Starting Live Navigation';

  @override
  String get helpLive1Body =>
      'Open any tour in your library or explore public community tours, then tap \'Start Live Tour\'.';

  @override
  String get helpLive2Title => '2. Automatic Proximity Audio Guide';

  @override
  String get helpLive2Body =>
      'With GPS enabled, when approaching any tour stop, the app will automatically play text-to-speech audio narration detailing the location\'s history and facts.';

  @override
  String get helpLive2Tip =>
      'Pro Tip: You can put your smartphone in your pocket or wear earphones. The service keeps running seamlessly in the background.';

  @override
  String get helpLive3Title => '3. Progress Tracking & Next Stop';

  @override
  String get helpLive3Body =>
      'The screen displays exact distance to the next stop, estimated time of arrival, and lets you manually mark visited stops.';

  @override
  String get helpSectionExploreTitle =>
      '🗺️ Discover, Filters & Interactive Map';

  @override
  String get helpSectionExploreSub =>
      'Find recommended tourist spots, events, and experiences.';

  @override
  String get helpExplore1Title => '1. Search & Categories';

  @override
  String get helpExplore1Body =>
      'Use the search bar to find specific places or filter by categories (Urban, Historical, Gastronomic, Ecological, Nightlife, Romantic).';

  @override
  String get helpExplore1Tip =>
      'Pro Tip: If your search query is empty, popular recommendations in your current area will automatically display.';

  @override
  String get helpExplore2Title => '2. Cards & Location Details';

  @override
  String get helpExplore2Body =>
      'Tap any map pin or place card in Discover to check photos, business hours, ratings, and send availability requests.';

  @override
  String get helpExplore3Title => '3. Interactive Map & Layers';

  @override
  String get helpExplore3Body =>
      'The interactive map allows switching map styles, viewing color-coded pins, and re-centering the camera on your current GPS location.';

  @override
  String get helpSectionCreatorTitle => '🎨 Manual Tour Creator';

  @override
  String get helpSectionCreatorSub =>
      'Design and publish custom tourist itineraries for the community.';

  @override
  String get helpCreator1Title => '1. General Tour Details';

  @override
  String get helpCreator1Body =>
      'Enter a catchy title, descriptive text, primary tourist category, and upload a vibrant cover photo.';

  @override
  String get helpCreator2Title => '2. Adding & Reordering Stops';

  @override
  String get helpCreator2Body =>
      'Add stops by searching places by name or tapping directly on the map. Drag and drop stops to adjust the optimal visiting sequence.';

  @override
  String get helpCreator3Title => '3. Privacy & Publishing';

  @override
  String get helpCreator3Body =>
      'Choose whether to keep the tour private for personal trips or publish it for other VIBETOURS travelers to discover and rate.';

  @override
  String get helpSectionProfileTitle => '👤 Account, Profile & Interface';

  @override
  String get helpSectionProfileSub =>
      'Cloud sync, traveler customization, and visual themes.';

  @override
  String get helpProfile1Title => '1. Guest Mode vs Registered Account';

  @override
  String get helpProfile1Body =>
      'Explore the app as a guest, or log in with email/Google to sync created tours, favorites, and ratings in the cloud.';

  @override
  String get helpProfile2Title => '2. Customize Traveler Profile';

  @override
  String get helpProfile2Body =>
      'Set up your avatar, bio, and preferred tourist categories so the app and AI tailor suggestions specifically to your profile.';

  @override
  String get helpProfile3Title => '3. Light & Dark Themes';

  @override
  String get helpProfile3Body =>
      'Switch between Light Mode and Dark Mode in Settings for comfortable viewing day or night.';

  @override
  String get helpSectionSupportTitle => '🛠️ Support, PQRS & Community';

  @override
  String get helpSectionSupportSub =>
      'Help channels, feedback, and customer support.';

  @override
  String get helpSupport1Title => '1. Managing PQRS';

  @override
  String get helpSupport1Body =>
      'Submit Petitions, Complaints, Claims, or Suggestions directly from Support and check real-time admin responses.';

  @override
  String get helpSupport2Title => '2. Ratings & Feedback';

  @override
  String get helpSupport2Body =>
      'Rate the app or leave suggestions in Profile to help us continuously improve VIBETOURS.';

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
  String get upcomingEvents => 'Upcoming Events';

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
  String get pqrsMyPqrs => 'My Requests';

  @override
  String get pqrsHistorySub =>
      'History of your requests and administrator responses';

  @override
  String get pqrsStatusAnswered => 'ANSWERED';

  @override
  String get pqrsStatusOpen => 'PENDING';

  @override
  String get pqrsTapToView => 'Tap to view response';

  @override
  String get pqrsAdminResponse => 'Admin response';

  @override
  String get pqrsClose => 'Close';

  @override
  String get pqrsEmpty => 'You don\'t have any requests in your history yet.';

  @override
  String get helpBody1a =>
      'You can open VibeTours as a guest to explore approved tours, nearby places, basic map, and public details.';

  @override
  String get helpBody1b =>
      'To create tours, save favorites to the cloud, comment, rate, send PQRS, or check availability, you need to sign in.';

  @override
  String get helpBody1c =>
      'If you try a private action, VibeTours will display a \'Sign in to continue\' prompt without losing what you were viewing.';

  @override
  String get helpBody1d =>
      'Email login remains available. If Google is configured, you can also sign in with your Google account.';

  @override
  String get helpBody2a =>
      'The Discover section shows featured places using your location and nearby recommendations.';

  @override
  String get helpBody2b =>
      'If the search bar is empty, you will see popular or nearby recommendations so the screen is never left empty.';

  @override
  String get helpBody2c =>
      'You can search for words like museum, restaurant, park, beach, or viewpoint to find real places.';

  @override
  String get helpBody2d =>
      'Use category, price, distance, and kid-friendly filters to refine the results.';

  @override
  String get helpBody3a =>
      'Explore tours created by the community or generated by our AI.';

  @override
  String get helpBody3b =>
      'Use the top search bar to search for tours by name or keyword.';

  @override
  String get helpBody3c =>
      'Tap the filter icon to refine your search by category, price, and more.';

  @override
  String get helpBody4a =>
      'Visualize tourist spots, events, and points of interest directly on the map.';

  @override
  String get helpBody4b => 'Tap on pins to view a quick place card.';

  @override
  String get helpBody4c =>
      'Tapping a card opens the place details where you can save it, check availability if it\'s a restaurant/hotel, or start a route there.';

  @override
  String get helpBody5a =>
      'Create your own tours by adding a name, description, and cover image.';

  @override
  String get helpBody5b =>
      'Add stops (places) by searching for them in our map-connected database.';

  @override
  String get helpBody5c =>
      'You can define how many people and how many days the tour lasts.';

  @override
  String get helpBody6a =>
      'Generate a complete tour simply by describing what you want to see and do using AI.';

  @override
  String get helpBody6b =>
      'You can use advanced options to specify whether it lasts days or hours.';

  @override
  String get helpBody6c =>
      'Once the tour is generated, you can save it to your account or edit it to add or remove stops before saving.';

  @override
  String get helpBody7a =>
      'You can edit your created tours in the \'My Tours\' section.';

  @override
  String get helpBody7b =>
      'Save your favorite places and organize them to access them quickly.';

  @override
  String get helpBody8a =>
      'Complete your tourist profile by choosing your favorite interests and categories.';

  @override
  String get helpBody8b =>
      'Change your photo, name, and language/theme preferences.';

  @override
  String get helpBody9a =>
      'Send Requests, Complaints, Claims, and Suggestions (PQRS) directly from the app.';

  @override
  String get helpBody9b =>
      'Check the status of your PQRS and administrator responses in the \'History\' tab.';

  @override
  String get privSec1Title => 'Personal Data We Collect';

  @override
  String get privSec1Body =>
      'We process your email, user ID, display name, travel preferences, tour history and favorites. We apply data minimization in compliance with GDPR, collecting only what is essential to operate the app.';

  @override
  String get privSec2Title => 'Foreground GPS Location';

  @override
  String get privSec2Body =>
      'We use precise location exclusively during active tours to calculate distances, local weather and audio triggers (via Android Foreground Service). VibeTours never secretly tracks your location when the app is closed.';

  @override
  String get privSec3Title => 'Voice Dictation and Microphone';

  @override
  String get privSec3Body =>
      'Microphone access is only active when you tap the dictation button or enable hands-free mode. Speech is processed transiently in device memory; we never record or store audio files on our servers.';

  @override
  String get privSec4Title => 'Artificial Intelligence (Zero Training)';

  @override
  String get privSec4Body =>
      'Requests to our AI planner contain only anonymized travel parameters. Under enterprise agreements with our AI providers, your personal data is never used to train public AI models.';

  @override
  String get privSec5Title => 'Security, Storage and Supabase';

  @override
  String get privSec5Body =>
      'Your data is stored with AES-256 encryption in Supabase, safeguarded by Row Level Security (RLS) policies. Only you have authorized access to your private profile information.';

  @override
  String get privSec6Title => 'Advertising (AdMob) and Diagnostics';

  @override
  String get privSec6Body =>
      'We never sell your data to third parties. To keep basic tours free, we display ads via Google AdMob and collect anonymous crash reports with Firebase Crashlytics to optimize stability.';

  @override
  String get privSec7Title => 'Your Rights and Account Deletion';

  @override
  String get privSec7Body =>
      'You have full rights under GDPR/CCPA to access, update or permanently delete your account and personal data anytime via Profile > Settings > Delete Account, or by emailing emotivavibetours@gmail.com.';

  @override
  String get termsSec1Title => 'Nature of Service and Minimum Age';

  @override
  String get termsSec1Body =>
      'VIBETOURS is a cultural technology and guided itinerary platform; not a travel agency or emergency service. General use requires at least 14 years of age; creating and publishing tours requires 18 years.';

  @override
  String get termsSec2Title => 'Accuracy of Maps, Schedules and Prices';

  @override
  String get termsSec2Body =>
      'Vector maps, routes and times rely on OpenStreetMap and TomTom as reference estimates. Urban conditions, weather and opening hours may change. Always verify official sources before traveling.';

  @override
  String get termsSec3Title => 'Pedestrian Safety and Risk Assumption';

  @override
  String get termsSec3Body =>
      'Walking tours carry inherent public space risks (traffic, weather, terrain). You participate voluntarily at your own risk. Always remain aware of your surroundings and respect local traffic laws.';

  @override
  String get termsSec4Title => 'AI Generated Itineraries';

  @override
  String get termsSec4Body =>
      'Tours generated by VibeTour AI are automated recommendations designed to inspire your trip. While we strive for accuracy, AI may produce inaccuracies; always verify accessibility and conditions.';

  @override
  String get termsSec5Title => 'Community Tours and Free Tours';

  @override
  String get termsSec5Body =>
      'Community creators and local guides are independent operators. In Free Tours, tips are voluntary and given directly to the guide; VibeTours charges no fees. Please cancel reservations in advance if unable to attend.';

  @override
  String get termsSec6Title => 'Community Rules and Intellectual Property';

  @override
  String get termsSec6Body =>
      'Publishing offensive, defamatory, fraudulent or copyright-infringing content is strictly prohibited. We moderate and remove offending content within 24 hours. App software and assets belong to VibeTours.';

  @override
  String get termsSec7Title => 'Account Termination and Support';

  @override
  String get termsSec7Body =>
      'VibeTours reserves the right to suspend accounts for violations. Users may cancel their account anytime. For support, contact us in-app or via emotivavibetours@gmail.com (reply within 24-48 business hours).';

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
  String get adminSectionPerformance => 'Display and preferences';

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

  @override
  String get heatmapTitle => 'Heatmap & Density Map';

  @override
  String get heatmapSubtitle => 'Real-time monitoring of tourist foot traffic';

  @override
  String get heatmapToursToday => 'Tours Today';

  @override
  String get heatmapAvgTime => 'Average Time';

  @override
  String get heatmapPerStop => 'Per stop';

  @override
  String get heatmapHottestZone => 'Hottest Zone';

  @override
  String get heatmapFilterZone => 'Filter by Zone';

  @override
  String get heatmapTimeRange => 'Time Range';

  @override
  String get heatmapLiveHeat => 'LIVE HEAT';

  @override
  String get heatmapPeakHoursTitle => 'Foot Traffic by Schedule (Peak Hours)';

  @override
  String get heatmapPeakHoursSubtitle =>
      'Distribution of walkers throughout the day';

  @override
  String get heatmapTopZones => 'Highest Density Zones';

  @override
  String heatmapVisits(int count) {
    return '$count visits';
  }

  @override
  String get aiNewChat => 'New Chat';

  @override
  String get attachPhotos => 'Attach photos';

  @override
  String photosSelected(int count) {
    return '$count photo(s) selected';
  }

  @override
  String get submitReview => 'Submit Review';

  @override
  String get aboutMe => 'About me';

  @override
  String get addBioPlaceholder => 'Add a bio and your interests here...';

  @override
  String get writeAboutYourself => 'Write something about yourself...';

  @override
  String get digitalPassportTitle => '🛂 Digital Travel Passport';

  @override
  String get explorerLevel => 'Explorer Level';

  @override
  String get statsTravelled => 'Travelled';

  @override
  String get statsStops => 'Stops';

  @override
  String get statsBadges => 'Badges';

  @override
  String get achievementBadges => '🏅 Achievement Badges';

  @override
  String get badgeRouteCreatorTitle => 'Route Creator';

  @override
  String badgeRouteCreatorSubtitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count tours created',
      one: '1 tour created',
    );
    return '$_temp0';
  }

  @override
  String get badgeRouteCreatorReason =>
      'Awarded for creating tours in the community.';

  @override
  String get badgeTouristCriticTitle => 'Tour Critic';

  @override
  String badgeTouristCriticSubtitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reviews given',
      one: '1 review given',
    );
    return '$_temp0';
  }

  @override
  String get badgeTouristCriticReason => 'Awarded for rating explored tours.';

  @override
  String get badgeCommunityGuideTitle => 'Community Guide';

  @override
  String badgeCommunityGuideSubtitle(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count participants',
      one: '1 participant',
    );
    return '$_temp0';
  }

  @override
  String get badgeCommunityGuideReason =>
      'Awarded for inspiring travelers to join your tours.';

  @override
  String get badgeVibeExplorerTitle => 'VIBE Explorer';

  @override
  String get badgeVibeExplorerSubtitle => 'Active profile';

  @override
  String get badgeVibeExplorerReason => 'Awarded to active VIBETOURS members.';

  @override
  String get within5km => 'Within 5km';

  @override
  String get noActiveParticipants => 'No active participants in your tours.';

  @override
  String get noParticipantsYet => 'No participants yet.';

  @override
  String participantsCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count participants',
      one: '1 participant',
    );
    return '$_temp0';
  }

  @override
  String get tourSkip => 'Skip';

  @override
  String get tourNext => 'Next';

  @override
  String get tourPrevious => 'Previous';

  @override
  String get tourFinish => 'Got it';

  @override
  String tourStepIndicator(int current, int total) {
    return 'Step $current of $total';
  }

  @override
  String get tourHomeNavTitle => 'Main Navigation';

  @override
  String get tourHomeNavDesc =>
      'Access Explore, AI Chat, Tours Catalog, and your Profile.';

  @override
  String get tourHomeHeroTitle => 'Featured Tour';

  @override
  String get tourHomeHeroDesc =>
      'Discover the top recommended experience of the day with photos, reviews, and audio guide.';

  @override
  String get tourHomeWeatherTitle => 'Real-Time Weather';

  @override
  String get tourHomeWeatherDesc =>
      'Check weather conditions and rain alerts before starting your journey.';

  @override
  String get tourHomeToursForYouTitle => 'Tours for You';

  @override
  String get tourHomeToursForYouDesc =>
      'Explore tour recommendations personalized to your preferences and travel affinity.';

  @override
  String get tourHomeNearbyTitle => 'Nearby Places';

  @override
  String get tourHomeNearbyDesc =>
      'Discover tourist attractions, parks, and points of interest within kilometers of your real-time location.';

  @override
  String get tourHomeEventsTitle => 'Upcoming Events';

  @override
  String get tourHomeEventsDesc =>
      'Browse cultural festivals, fairs, and entertainment activities scheduled in the city.';

  @override
  String get tourToursSearchTitle => 'Quick Search';

  @override
  String get tourToursSearchDesc =>
      'Search destinations by name, city, or keywords.';

  @override
  String get tourToursFilterTitle => 'Category Filters';

  @override
  String get tourToursFilterDesc =>
      'Filter tours by country, city, or theme (cultural, gastronomic, etc.).';

  @override
  String get tourToursCardTitle => 'Tour Cards';

  @override
  String get tourToursCardDesc =>
      'Tap any tour to view stops, listen to an audio preview, and start.';

  @override
  String get tourDetailStartTitle => 'Start Live Tour';

  @override
  String get tourDetailStartDesc =>
      'Start real-time GPS navigation with automatic voice narrations.';

  @override
  String get tourDetailOfflineTitle => 'Offline Download';

  @override
  String get tourDetailOfflineDesc =>
      'Save maps and audios to your device to use without internet or mobile data.';

  @override
  String get tourDetailStopsTitle => 'Route & Stops';

  @override
  String get tourDetailStopsDesc =>
      'Explore the sequence of waypoints and preview audio for each stop.';

  @override
  String get tourLiveRecenterTitle => 'Map & Recenter';

  @override
  String get tourLiveRecenterDesc =>
      'Track your GPS position in real time and use the compass for orientation.';

  @override
  String get tourLiveAudioTitle => 'Smart Audio Guide';

  @override
  String get tourLiveAudioDesc =>
      'Control audio playback for stories and history at each point of interest.';

  @override
  String get tourLiveAiAssistantTitle => 'AI Voice Assistant';

  @override
  String get tourLiveAiAssistantDesc =>
      'Ask the AI about nearby restaurants, fun facts, or on-route assistance.';

  @override
  String get tourLiveSosTitle => 'SOS Safety Button';

  @override
  String get tourLiveSosDesc =>
      'Access local emergency numbers and immediate assistance.';

  @override
  String get tourSettingsRefreshTitle => 'Performance & Display';

  @override
  String get tourSettingsRefreshDesc =>
      'Switch between 60Hz for battery saving or 120Hz for maximum smoothness.';

  @override
  String get tourSettingsMapTitle => 'Map Style';

  @override
  String get tourSettingsMapDesc =>
      'Choose between auto, day, night, or satellite map views.';

  @override
  String get tourSettingsNotifTitle => 'Notifications';

  @override
  String get tourSettingsNotifDesc =>
      'Receive alerts about nearby places and local events.';

  @override
  String get tourSettingsGuidesSection => 'Guides & Tutorials';

  @override
  String get tourSettingsGuidesSubtitle =>
      'Review how each section of the app works';

  @override
  String get tourReplayHome => 'Home Screen Guide';

  @override
  String get tourReplayTours => 'Tours Catalog Guide';

  @override
  String get tourReplayDetail => 'Tour Detail Guide';

  @override
  String get tourReplayLive => 'Live Navigation Guide';

  @override
  String get tourReplaySettings => 'Settings Guide';

  @override
  String get tourResetAll => 'Reset all tutorials';

  @override
  String get tourResetAllSuccess =>
      'Tutorials reset. They will show when visiting each screen.';

  @override
  String get nearbyEnableLocationPrompt =>
      'Enable your location to explore attractions and tourist spots around you.';

  @override
  String get enableLocationBtn => 'Enable location';

  @override
  String get licensesTitle => 'Licenses & Attributions';

  @override
  String get licensesSubtitle =>
      'Open-source software and data powering VIBETOURS';

  @override
  String get licensesSearchPlaceholder => 'Search library or package...';

  @override
  String get licensesOpenSourceSection => 'Open Source Libraries';

  @override
  String get licensesDataAttributions => 'Attributions & Open Data';

  @override
  String get licensesCountSingular => '1 license';

  @override
  String licensesCountPlural(int count) {
    return '$count licenses';
  }

  @override
  String licensesNoResults(String query) {
    return 'No licenses found for \"$query\"';
  }

  @override
  String get licensesCopy => 'Copy text';

  @override
  String get licensesCopied => 'License text copied to clipboard';

  @override
  String licensesAllPackagesCount(int count) {
    return '$count installed packages';
  }

  @override
  String get premiumComingSoonBadge => 'COMING SOON';

  @override
  String get premiumComingSoonTitle => 'VIBETOURS Premium';

  @override
  String get premiumComingSoonDescription =>
      'We are preparing our Premium plan to elevate your travel experience. It will be available in an upcoming update.';

  @override
  String get premiumFeatureAiLimitsTitle => 'Extended AI Limits';

  @override
  String get premiumFeatureAiLimitsDesc =>
      'Higher daily quota for AI-assisted travel itineraries and questions.';

  @override
  String get premiumFeatureRoutesTitle => 'More Complete Tours';

  @override
  String get premiumFeatureRoutesDesc =>
      'Support for longer routes and detailed waypoints.';

  @override
  String get premiumFeaturePriorityTitle => 'Priority Access';

  @override
  String get premiumFeaturePriorityDesc =>
      'Faster response times and early access to upcoming features.';

  @override
  String get premiumUnderstoodBtn => 'Got it!';
}

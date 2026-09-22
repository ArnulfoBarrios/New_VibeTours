import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/app_config.dart';
import '../domain/models.dart';

class DiscoveryRepository {
  static final Map<String, String> _imageCache = {};

  static String _imageCacheKey(
    String name, {
    String placeId = '',
    String city = '',
    double? latitude,
    double? longitude,
  }) {
    final normalizedName = name
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'\s+'), ' ');
    final normalizedCity = city
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'\s+'), ' ');
    final location = latitude != null && longitude != null
        ? '${latitude.toStringAsFixed(4)},${longitude.toStringAsFixed(4)}'
        : '';
    return 'nearby-image-v2|$normalizedName|${placeId.trim().toLowerCase()}|$normalizedCity|$location';
  }

  static String? _directImageUrlFromTags(
    Map<String, dynamic>? tags, {
    String placeName = '',
    String category = '',
  }) {
    if (tags == null || tags.isEmpty) return null;

    final candidates = [
      tags['image']?.toString().trim(),
      tags['wikimedia_commons']?.toString().trim(),
    ].whereType<String>().where((value) => value.isNotEmpty);

    for (final value in candidates) {
      if (value.toLowerCase().startsWith('category:')) continue;
      final url = value.startsWith('http://') || value.startsWith('https://')
          ? value
          : value.startsWith('File:')
              ? 'https://commons.wikimedia.org/wiki/Special:FilePath/${Uri.encodeComponent(value.replaceFirst('File:', '').trim())}?width=800'
              : 'https://commons.wikimedia.org/wiki/Special:FilePath/${Uri.encodeComponent(value.trim())}?width=800';
      if (_isUsableImageUrl(url, placeName: placeName, category: category)) {
        return url;
      }
    }
    return null;
  }

  static bool _isUsableImageUrl(
    String url, {
    String placeName = '',
    String category = '',
    String imageTitle = '',
    String pageTitle = '',
  }) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

    final lowerPlace = placeName.toLowerCase();
    final haystack = '$url $imageTitle $pageTitle'
        .toLowerCase()
        .replaceAll(RegExp(r'[_%\-]+'), ' ');
    const blockedImageTerms = [
      'map',
      'mapa',
      'locator',
      'location map',
      'flag',
      'bandera',
      'logo',
      'escudo',
      'coat of arms',
      'diagram',
      'chart',
      'schema',
      'symbol',
      'icon',
      'screenshot',
      'document',
      '.pdf',
    ];
    for (final term in blockedImageTerms) {
      if (lowerPlace.contains(term)) continue;
      if (haystack.contains(term)) return false;
    }

    final lowerCategory = category.toLowerCase();
    final isNature = lowerCategory == 'nature' ||
        RegExp(r'ci[ée]naga|laguna|humedal|manglar|parque|reserva|sendero|bosque|r[íi]o|jard[íi]n bot[aá]nico')
            .hasMatch(lowerPlace);
    final isBeach = lowerCategory == 'beach' ||
        RegExp(r'playa|beach|bah[íi]a|isla|cayo|costa|litoral').hasMatch(lowerPlace);
    final isSports = lowerCategory == 'sports' ||
        RegExp(r'estadio|coliseo|cancha|patin[oó]dromo|vel[oó]dromo').hasMatch(lowerPlace);
    final isSecular = lowerCategory != 'religious' &&
        !RegExp(r'iglesia|catedral|templo|sinagoga|parroquia|bas[ií]lica|santuario|convento').hasMatch(lowerPlace);

    if ((isNature || isBeach || isSports || isSecular) &&
        RegExp(r'church|cathedral|iglesia|catedral|templo|basilica|basílica|convent|icono \(religi|vladimirskaya|virgen mar[íi]a|theotokos').hasMatch(haystack)) {
      return false;
    }
    return true;
  }

  static List<String> _imageSearchTokens(String value) {
    const stopWords = {
      'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'y', 'en', 'the', 'of', 'and',
    };
    return value
        .toLowerCase()
        .replaceAll('á', 'a')
        .replaceAll('é', 'e')
        .replaceAll('í', 'i')
        .replaceAll('ó', 'o')
        .replaceAll('ú', 'u')
        .replaceAll('ü', 'u')
        .replaceAll('ñ', 'n')
        .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
        .split(RegExp(r'\s+'))
        .where((token) => token.length >= 3 && !stopWords.contains(token))
        .toSet()
        .toList();
  }

  static bool _isRelevantImageTitle(String title, String placeName) {
    final candidate = _imageSearchTokens(title.replaceFirst(RegExp(r'^File:\s*', caseSensitive: false), ''));
    final requested = _imageSearchTokens(placeName);
    if (candidate.isEmpty || requested.isEmpty) return false;

    final normalizedTitle = candidate.join(' ');
    final normalizedPlace = requested.join(' ');
    if (normalizedTitle == normalizedPlace ||
        normalizedTitle.contains(normalizedPlace) ||
        normalizedPlace.contains(normalizedTitle)) {
      return true;
    }

    final overlap = requested.where(candidate.contains).length;
    final required = requested.length <= 1 ? 1 : 2;
    return overlap >= required && overlap * 2 >= requested.length;
  }

  /// Asynchronously resolves the authentic photograph of a place from
  /// Wikipedia Search API or Wikimedia Commons Search API, caching the result.
  static Future<String> fetchRealPlaceImageUrl(
    String name, {
    String category = 'Atraccion',
    String placeId = '',
    Map<String, dynamic>? tags,
    String city = '',
    double? latitude,
    double? longitude,
  }) async {
    final cacheKey = _imageCacheKey(
      name,
      placeId: placeId,
      city: city,
      latitude: latitude,
      longitude: longitude,
    );
    if (_imageCache.containsKey(cacheKey) && _imageCache[cacheKey]!.isNotEmpty) {
      return _imageCache[cacheKey]!;
    }

    // 1. Direct OSM image tags if present
    final directImage = _directImageUrlFromTags(
      tags,
      placeName: name,
      category: category,
    );
    if (directImage != null) {
      _imageCache[cacheKey] = directImage;
      return directImage;
    }

    final cleanName = name.trim();
    final stripped = cleanName
        .replaceFirst(RegExp(r'^(monumento\s+(a\s+la\s+|al\s+|a\s+|de\s+|del\s+)?|estadio\s+(municipal\s+)?|parque\s+(de\s+|del\s+)?|plaza\s+(de\s+|del\s+)?|v[íi]a\s+parque\s+)', caseSensitive: false), '')
        .trim();

    final wikiQueries = <String>{
      cleanName,
      if (stripped.isNotEmpty && stripped.toLowerCase() != cleanName.toLowerCase()) stripped,
      if (city.trim().isNotEmpty) '$cleanName, ${city.trim()}',
      if (city.trim().isNotEmpty && stripped.isNotEmpty && stripped.toLowerCase() != cleanName.toLowerCase())
        '$stripped, ${city.trim()}',
    }.toList();
    String? wikiUrl;
    for (final query in wikiQueries) {
      wikiUrl = await _fetchWikipediaSearchImage(query, placeName: name, category: category);
      if (wikiUrl != null && wikiUrl.isNotEmpty) break;
    }
    if (wikiUrl != null && wikiUrl.isNotEmpty) {
      _imageCache[cacheKey] = wikiUrl;
      return wikiUrl;
    }

    // 3. Wikimedia Commons Search API, also with title validation.
    String? commonsUrl;
    for (final query in wikiQueries) {
      commonsUrl = await _fetchCommonsSearchImage(query, placeName: name, category: category);
      if (commonsUrl != null && commonsUrl.isNotEmpty) break;
    }
    if (commonsUrl != null && commonsUrl.isNotEmpty) {
      _imageCache[cacheKey] = commonsUrl;
      return commonsUrl;
    }

    // Do not invent an image for a real place. The UI will show a neutral
    // surface instead of attributing a generic stock image to that place.
    return '';
  }

  static String resolveDynamicImageForPlace(
    String name, {
    String category = 'Atraccion',
    String placeId = '',
    Map<String, dynamic>? tags,
  }) {
    final cacheKey = _imageCacheKey(name, placeId: placeId);
    if (_imageCache.containsKey(cacheKey) && _imageCache[cacheKey]!.isNotEmpty) {
      return _imageCache[cacheKey]!;
    }
    final directImage = _directImageUrlFromTags(
      tags,
      placeName: name,
      category: category,
    );
    if (directImage != null) {
      _imageCache[cacheKey] = directImage;
      return directImage;
    }
    return _getSafeFallbackImageUrl(category, name, placeId: placeId);
  }

  static Future<String?> _fetchWikipediaSearchImage(
    String rawQuery, {
    String? placeName,
    String category = '',
  }) async {
    final searchTerms = <String>[rawQuery.trim()];

    for (final term in searchTerms) {
      final endpoints = [
        'https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${Uri.encodeComponent(term)}&gsrlimit=5&prop=pageimages&pithumbsize=800&format=json',
        'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${Uri.encodeComponent(term)}&gsrlimit=5&prop=pageimages&pithumbsize=800&format=json',
      ];

      for (final endpoint in endpoints) {
        try {
          final res = await http.get(
            Uri.parse(endpoint),
            headers: {'User-Agent': 'VIBETOURS/1.0 (contact=ops@vibetours.app)'},
          ).timeout(const Duration(seconds: 4));

          if (res.statusCode == 200) {
            final json = jsonDecode(res.body) as Map<String, dynamic>;
            final pages = (json['query'] as Map?)?['pages'] as Map?;
            if (pages != null && pages.isNotEmpty) {
              for (final rawPage in pages.values) {
                final page = rawPage as Map?;
                final title = page?['title']?.toString() ?? '';
                final imageTitle = page?['pageimage']?.toString() ?? '';
                final image = (page?['thumbnail'] as Map?)?['source']?.toString() ??
                    (page?['original'] as Map?)?['source']?.toString();
                if (image != null &&
                    _isRelevantImageTitle(title, placeName ?? rawQuery) &&
                    _isUsableImageUrl(
                      image,
                      placeName: placeName ?? rawQuery,
                      imageTitle: imageTitle,
                      pageTitle: title,
                      category: category,
                    )) {
                  return image;
                }
              }
            }
          }
        } catch (_) {}
      }
    }
    return null;
  }

  static Future<String?> _fetchCommonsSearchImage(
    String query, {
    String? placeName,
    String category = '',
  }) async {
    try {
      final uri = Uri.parse(
        'https://commons.wikimedia.org/w/api.php?action=query&generator=search'
        '&gsrsearch=${Uri.encodeComponent(query)}&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json',
      );
      final res = await http.get(
        uri,
        headers: {'User-Agent': 'VIBETOURS/1.0 (contact=ops@vibetours.app)'},
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final queryObj = data['query'] as Map?;
        final pages = queryObj?['pages'] as Map?;
        if (pages != null && pages.isNotEmpty) {
          for (final rawPage in pages.values) {
            final page = rawPage as Map?;
            final title = page?['title']?.toString() ?? '';
            final imageInfoList = page?['imageinfo'] as List?;
            if (imageInfoList != null && imageInfoList.isNotEmpty) {
              final info = imageInfoList.first as Map?;
              final image = info?['thumburl']?.toString() ?? info?['url']?.toString();
              if (image != null &&
                  _isRelevantImageTitle(title, placeName ?? query) &&
                  _isUsableImageUrl(
                    image,
                    placeName: placeName ?? query,
                    imageTitle: title,
                    pageTitle: title,
                    category: category,
                  )) {
                return image;
              }
            }
          }
        }
      }
    } catch (_) {}
    return null;
  }

  bool _isBlacklisted(String name, String type) {
    final lowerName = name.trim().toLowerCase();
    final lowerType = type.trim().toLowerCase();

    // 1. Descartar nombres puramente genéricos de una sola palabra que no aportan suficiente contexto
    const genericSingleWords = [
      'parque', 'puente', 'arroyo', 'plaza', 'lugar', 'calle', 'avenida',
      'camino', 'sendero', 'cancha', 'estadio', 'estacion', 'estación',
      'edificio', 'torre', 'centro', 'local', 'zona', 'sitio', 'punto',
      'bicicleta', 'placa', 'monolito', 'estela', 'hito', 'cruz', 'piedra'
    ];
    if (genericSingleWords.contains(lowerName)) {
      return true;
    }

    // 2. Palabras clave prohibidas en el nombre (infraestructura, comercios, proyectos residenciales o memoriales menores)
    const blacklistNameKeywords = [
      'cementerio', 'cemetery', 'funeraria', 'jardines del recuerdo', 'jardín del recuerdo',
      'universidad', 'universitaria', 'universitario', 'university', 'colegio', 'school',
      'hospital', 'clinica', 'clínica', 'ips ', 'eps ', 'instituto educativo', 'institución educativa',
      'condominio', 'conjunto residencial', 'edificio', 'torre', 'reserva residencial', 'aptos',
      'apartamento', 'consultorio', 'dental', 'odontología', 'médico',
      'arroyo', 'puente', 'bridge', 'canal', 'quebrada', 'caño', 'drenaje',
      'gasolinera', 'estacion de servicio', 'estación de servicio', 'terpel', 'texaco', 'primax',
      'brio', 'petrobras', 'shell', 'esso', 'mobil', 'peaje', 'subestación', 'subestacion',
      'electrificadora', 'transformador', 'taller', 'serviteca', 'lavadero', 'lavado',
      'parqueadero', 'parking', 'estacionamiento', 'farmacia', 'droguería', 'drogueria',
      'drogas', 'rebaja', 'banco', 'cajero', 'atm', 'davivienda', 'bancolombia', 'bbva',
      'efecty', 'supergiros', 'western union', 'ferretería', 'ferreteria', 'panadería',
      'panaderia', 'supermercado', 'miscelánea', 'miscelanea', 'alcaldía', 'notaría',
      'notaria', 'juzgado', 'comisaría', 'comisaria', 'cai', 'estacion de policia',
      'estación de policía', 'club rotario', 'rotary', 'club de leones', 'placa conmemorativa',
      'monolito', 'bicicleta blanca', 'victimas', 'víctimas', 'oficina', 'bodega',
      'distribuidora', 'empresa', 'inmobiliaria', 'logistica', 'logística', 'almacén', 'almacen',
      'conjunto', 'urbanizacion', 'urbanización', 'santa monica', 'santa mónica', 'reserva',
      'altos de', 'portal de', 'terrazas', 'villas de', 'palmetto', 'torres de'
    ];
    for (final kw in blacklistNameKeywords) {
      if (lowerName.contains(kw)) return true;
    }

    // 3. Tipos o categorías prohibidos
    const blacklistTypeKeywords = [
      'cemetery', 'university', 'college', 'hospital', 'clinic', 'dentist', 'physiotherapist',
      'doctor', 'residential', 'apartment', 'school', 'bridge', 'substation', 'fuel',
      'parking', 'bank', 'atm', 'pharmacy', 'memorial', 'artwork', 'wayside_shrine',
      'wayside_cross', 'bench', 'waste_basket', 'vending_machine', 'real_estate', 'commercial'
    ];
    for (final kw in blacklistTypeKeywords) {
      if (lowerType.contains(kw)) return true;
    }

    return false;
  }

  Future<WeatherSnapshot?> weather({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final url = Uri.parse(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=$latitude'
        '&longitude=$longitude'
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m'
        '&timezone=auto'
      );
      final response = await http.get(url).timeout(const Duration(seconds: 8));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final current = json['current'] as Map<String, dynamic>? ?? const {};
        final code = _int(current['weather_code']);
        final isDay = _int(current['is_day']) == 1;
        
        return WeatherSnapshot(
          locationName: 'Ubicación actual',
          temperatureC: _int(current['temperature_2m']),
          apparentC: _int(current['apparent_temperature'] ?? current['temperature_2m']),
          humidity: _int(current['relative_humidity_2m']),
          windKmh: _int(current['wind_speed_10m']),
          condition: _weatherLabel(code, isDay),
          code: code,
          isDay: isDay,
        );
      }
    } catch (_) {
      // Fall through to return null
    }
    return null;
  }

  Future<List<NearbyPlace>> nearbyPlaces({
    required double latitude,
    required double longitude,
  }) async {
    // 1. Wikipedia GeoSearch with adaptive radius (up to 10 km)
    final wikiPlaces = await _nearbyWikipediaPlaces(latitude: latitude, longitude: longitude);
    if (wikiPlaces.length >= 6) {
      final enriched = await _enrichPlacesWithRealImages(wikiPlaces);
      return _deduplicatePlaces(enriched);
    }

    // 2. OpenStreetMap / Overpass Places (high-precision community-verified nodes)
    final overpassPlaces = await _nearbyOverpassPlaces(latitude, longitude);
    final combined = <NearbyPlace>[...wikiPlaces, ...overpassPlaces];
    if (combined.isNotEmpty) {
      final enriched = await _enrichPlacesWithRealImages(combined);
      return _deduplicatePlaces(enriched);
    }

    // 3. Fallback places if offline
    final fallbacks = _fallbackPlaces(latitude: latitude, longitude: longitude);
    final enriched = await _enrichPlacesWithRealImages(fallbacks);
    return _deduplicatePlaces(enriched);
  }

  Future<List<NearbyPlace>> _nearbyWikipediaPlaces({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final geoUri = Uri.https(
        'es.wikipedia.org',
        '/w/api.php',
        {
          'action': 'query',
          'list': 'geosearch',
          'gscoord': '$latitude|$longitude',
          'gsradius': '10000',
          'gslimit': '50',
          'format': 'json',
        },
      );
      final geoResponse = await http
          .get(geoUri, headers: const {'User-Agent': 'VIBETOURS/1.0 (contact@vibetours.app)'})
          .timeout(const Duration(seconds: 6));
      if (geoResponse.statusCode < 200 || geoResponse.statusCode >= 300) {
        return const [];
      }

      final geoJson = jsonDecode(geoResponse.body) as Map<String, dynamic>;
      final query = geoJson['query'] as Map<String, dynamic>? ?? {};
      final geosearch = query['geosearch'] as List<dynamic>? ?? const [];
      if (geosearch.isEmpty) return const [];

      final Map<int, Map<String, dynamic>> candidateByPageId = {};
      for (final item in geosearch) {
        if (item is! Map) continue;
        final pageId = _int(item['pageid']);
        if (pageId <= 0) continue;

        final rawTitle = item['title']?.toString() ?? '';
        if (rawTitle.isEmpty) continue;
        final cleanName = rawTitle.replaceAll(RegExp(r'\s*\([^)]*\)'), '').trim();
        if (_isBlacklisted(cleanName, 'tourism')) continue;

        final lat = _double(item['lat']);
        final lon = _double(item['lon']);
        final dist = _double(item['dist']).round();
        if (lat == 0.0 || lon == 0.0 || dist > 10000) continue;

        candidateByPageId[pageId] = {
          'rawTitle': rawTitle,
          'cleanName': cleanName,
          'lat': lat,
          'lon': lon,
          'dist': dist,
        };
      }

      if (candidateByPageId.isEmpty) return const [];

      // Query Wikipedia batch API for pageimages and extracts
      final pageIdsParam = candidateByPageId.keys.join('|');
      final batchUri = Uri.https(
        'es.wikipedia.org',
        '/w/api.php',
        {
          'action': 'query',
          'pageids': pageIdsParam,
          'prop': 'pageimages|extracts',
          'pithumbsize': '800',
          'exintro': '1',
          'explaintext': '1',
          'format': 'json',
        },
      );
      final batchResponse = await http
          .get(batchUri, headers: const {'User-Agent': 'VIBETOURS/1.0 (contact@vibetours.app)'})
          .timeout(const Duration(seconds: 6));

      Map<String, dynamic> pagesMap = {};
      if (batchResponse.statusCode >= 200 && batchResponse.statusCode < 300) {
        final batchJson = jsonDecode(batchResponse.body) as Map<String, dynamic>;
        pagesMap = (batchJson['query'] as Map<String, dynamic>?)?['pages'] as Map<String, dynamic>? ?? {};
      }

      final List<NearbyPlace> places = [];
      for (final entry in candidateByPageId.entries) {
        final pageId = entry.key;
        final data = entry.value;
        final cleanName = data['cleanName'] as String;
        final rawTitle = data['rawTitle'] as String;
        final lat = data['lat'] as double;
        final lon = data['lon'] as double;
        final dist = data['dist'] as int;

        final pageData = pagesMap[pageId.toString()] as Map<String, dynamic>?;
        final rawExtract = pageData?['extract']?.toString() ?? '';
        final extract = _normalizeWikipediaText(rawExtract);

        // Filter extinct or demolished places (e.g. Estadio Juana de Arco)
        if (_isExtinctPlace(cleanName, extract)) continue;

        // Filter city-wide administrative entries (e.g. "Barranquilla")
        if (_isCityAdministrativeArticle(cleanName, extract)) continue;

        // Filter non-tourism institutions (e.g. universities, colleges, hospitals)
        if (_isNonTourismInstitution(cleanName, extract)) continue;

        // Check if it is a neighborhood and whether it is emblematic
        final isNeigh = _isNeighborhood(cleanName, extract, rawTitle: rawTitle);
        if (isNeigh && !_isEmblematicNeighborhood(cleanName, extract)) {
          continue;
        }

        final category = _classifyWikipediaPlace(
          cleanName,
          extract,
          isEmblematicNeighborhood: isNeigh,
        );

        final pageThumb = (pageData?['thumbnail'] as Map?)?['source']?.toString();
        final img = (pageThumb != null &&
                pageThumb.isNotEmpty &&
                _isUsableImageUrl(pageThumb, placeName: cleanName, category: category))
            ? pageThumb
            : '';

        final placeIdStr = 'wiki-$pageId';
        places.add(NearbyPlace(
          id: placeIdStr,
          name: cleanName,
          type: isNeigh ? 'Barrio Emblemático' : _typeLabel(category),
          distanceMeters: dist,
          location: GeoPoint(latitude: lat, longitude: lon),
          category: category,
          sourceTags: {
            'wikipedia': rawTitle,
            'pageid': pageId,
            'extract': extract,
            'is_neighborhood': isNeigh,
          },
          imageUrl: img,
          thumbnailUrl: img,
          statusLabel: 'Abierto',
          isOpenNow: true,
        ));
      }

      places.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));
      return places;
    } catch (_) {
      // Return empty list on failure
    }
    return const [];
  }

  static String _normalizeWikipediaText(String text) {
    return text
        .replaceAll(RegExp(r'[\u200B-\u200D\uFEFF\u00A0]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static bool _isExtinctPlace(String name, String extract) {
    final lowerExtract = extract.length > 250
        ? extract.substring(0, 250).toLowerCase()
        : extract.toLowerCase();
    final extinctPattern = RegExp(
      r'\b(fue un|fue una|antiguo|antigua|demolido|demolida|desaparecido|desaparecida|exestadio|ex estadio|ya no existe|inaugurado en \d{4} y demolido)\b',
      caseSensitive: false,
    );
    return extinctPattern.hasMatch(lowerExtract);
  }

  static bool _isCityAdministrativeArticle(String name, String extract) {
    final lowerExtract = extract.length > 250
        ? extract.substring(0, 250).toLowerCase()
        : extract.toLowerCase();
    final cityPattern = RegExp(
      r'\b(es una ciudad|es un municipio colombiano|es un municipio de|es la capital del departamento|es un distrito especial|es el distrito especial)\b',
      caseSensitive: false,
    );
    return cityPattern.hasMatch(lowerExtract);
  }

  static bool _isNonTourismInstitution(String name, String extract) {
    final lower = '$name $extract'.toLowerCase();
    final instPattern = RegExp(
      r'\b(instituci[oó]n de educaci[oó]n|universidad|universitaria|colegio|escuela normal|centro educativo|instituto t[eé]cnico|hospital general|cl[íi]nica privada)\b',
      caseSensitive: false,
    );
    return instPattern.hasMatch(lower);
  }

  static bool _isNeighborhood(String name, String extract, {String rawTitle = ''}) {
    final lowerName = name.toLowerCase();
    final lowerTitle = rawTitle.toLowerCase();
    if (lowerName.startsWith('barrio ') ||
        lowerName.startsWith('comuna ') ||
        lowerName.startsWith('urbanizaci') ||
        lowerName.startsWith('ciudad jardín') ||
        lowerName.startsWith('ciudad jardin') ||
        lowerName.startsWith('el golf') ||
        lowerName.startsWith('villa santos') ||
        lowerTitle.contains('(barrio)')) {
      return true;
    }
    final lowerExtract = extract.length > 350
        ? extract.substring(0, 350).toLowerCase()
        : extract.toLowerCase();
    final neighPattern = RegExp(
      r'\b(es un barrio|es una comuna|es un vecindario|es una urbanizaci[oó]n|es un sector residencial|sector de estratos|barrio de la localidad|barrio de barranquilla|barrio residencial)\b',
      caseSensitive: false,
    );
    return neighPattern.hasMatch(lowerExtract);
  }

  static bool _isEmblematicNeighborhood(String name, String extract) {
    final sanitized = '$name $extract'
        .replaceAll(RegExp(r'localidad\s+(norte-centro\s+hist[oó]rico|centro\s+hist[oó]rico)', caseSensitive: false), '')
        .toLowerCase();
    final heritagePattern = RegExp(
      r'\b(patrimonio|monumento nacional|bien de inter[eé]s cultural|inter[eé]s cultural|arquitectura patrimonial|barrio emblem[aá]tico|emblem[aá]tico barrio|tradicional barrio|barrio tradicional|cuna del carnaval|fundacional)\b',
      caseSensitive: false,
    );
    return heritagePattern.hasMatch(sanitized);
  }

  String _classifyWikipediaPlace(
    String name,
    String extract, {
    bool isEmblematicNeighborhood = false,
  }) {
    if (isEmblematicNeighborhood) return 'historic';
    final lower = '$name $extract'.toLowerCase();
    if (lower.contains('parque') ||
        lower.contains('ciénaga') ||
        lower.contains('cienaga') ||
        lower.contains('jardin botanico') ||
        lower.contains('reserva natural') ||
        lower.contains('humedal')) {
      return 'nature';
    }
    if (lower.contains('museo') ||
        lower.contains('teatro') ||
        lower.contains('casa de la cultura') ||
        lower.contains('galería') ||
        lower.contains('galeria')) {
      return 'museum';
    }
    if (lower.contains('monumento') ||
        lower.contains('estatua') ||
        lower.contains('ventana al mundo') ||
        lower.contains('faro') ||
        lower.contains('castillo')) {
      return 'historic';
    }
    if (lower.contains('estadio') ||
        lower.contains('coliseo') ||
        lower.contains('patinódromo') ||
        lower.contains('patinodromo') ||
        lower.contains('velódromo') ||
        lower.contains('velodromo')) {
      return 'sports';
    }
    if (lower.contains('malecón') ||
        lower.contains('malecon') ||
        lower.contains('puerto') ||
        lower.contains('puerta de oro') ||
        lower.contains('eventos')) {
      return 'attraction';
    }
    if (lower.contains('catedral') ||
        lower.contains('iglesia') ||
        lower.contains('templo') ||
        lower.contains('sinagoga') ||
        lower.contains('parroquia')) {
      return 'religious';
    }
    return 'attraction';
  }

  List<NearbyPlace> _deduplicatePlaces(
    List<NearbyPlace> places, {
    double thresholdMeters = 75.0,
  }) {
    if (places.length <= 1) return places;
    final List<NearbyPlace> result = [];

    for (final place in places) {
      int duplicateIndex = -1;
      for (int i = 0; i < result.length; i++) {
        final existing = result[i];
        if (existing.name.trim().toLowerCase() == place.name.trim().toLowerCase()) {
          duplicateIndex = i;
          break;
        }
        final dist = _distanceMeters(
          place.location.latitude,
          place.location.longitude,
          existing.location.latitude,
          existing.location.longitude,
        );
        if (dist <= thresholdMeters) {
          duplicateIndex = i;
          break;
        }
      }

      if (duplicateIndex == -1) {
        result.add(place);
      } else {
        final existing = result[duplicateIndex];
        final existingIsNeighborhood = existing.sourceTags['is_neighborhood'] == true;
        final placeIsNeighborhood = place.sourceTags['is_neighborhood'] == true;

        if (existingIsNeighborhood && !placeIsNeighborhood) {
          result[duplicateIndex] = place;
        } else if (!existingIsNeighborhood && placeIsNeighborhood) {
          continue;
        } else if (existing.imageUrl.isEmpty && place.imageUrl.isNotEmpty) {
          result[duplicateIndex] = place;
        }
      }
    }

    return result;
  }

  Future<List<NearbyPlace>> _enrichPlacesWithRealImages(List<NearbyPlace> places) async {
    if (places.isEmpty) return places;
    final enriched = await Future.wait(
      places.map((place) async {
        if (place.id.startsWith('fallback-')) return place;
        if (place.imageUrl.isNotEmpty) return place;
        try {
          final realUrl = await fetchRealPlaceImageUrl(
            place.name,
            category: place.category,
            placeId: place.id,
            city: place.sourceTags['addr:city']?.toString() ??
                place.sourceTags['addr:municipality']?.toString() ??
                place.sourceTags['city']?.toString() ?? '',
            latitude: place.location.latitude,
            longitude: place.location.longitude,
            tags: place.sourceTags,
          );
          if (realUrl.isNotEmpty) {
            return place.copyWith(
              imageUrl: realUrl,
              thumbnailUrl: realUrl,
            );
          }
        } catch (_) {}
        return place.copyWith(imageUrl: '', thumbnailUrl: '');
      }),
    );
    return enriched;
  }

  Future<List<NearbyPlace>> searchPlaces(
    String query, {
    double? userLat,
    double? userLon,
  }) async {
    final trimmed = query.trim();
    if (trimmed.length < 2) return const [];
    // 1. High precision Wikipedia search
    final wikiResults = await _searchWikipediaPlaces(
      trimmed,
      userLat: userLat,
      userLon: userLon,
    );
    if (wikiResults.isNotEmpty) {
      return _enrichPlacesWithRealImages(wikiResults);
    }
    try {
      final uri = Uri.parse('https://photon.komoot.io/api/').replace(
        queryParameters: {
          'q': trimmed,
          'limit': '8',
          if (userLat != null && userLon != null) ...{
            'lat': userLat.toString(),
            'lon': userLon.toString(),
          },
        },
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 8));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final features = json['features'] as List<dynamic>? ?? const [];
        final List<NearbyPlace> places = [];
        for (int i = 0; i < features.length; i++) {
          if (features[i] is Map) {
            final place = _nearbyPlaceFromPhotonFeature(Map<String, dynamic>.from(features[i] as Map), i);
            if (!_isBlacklisted(place.name, place.type)) {
              places.add(place);
            }
          }
        }
        return await _enrichPlacesWithRealImages(places);
      }
    } catch (_) {}

    // Fallback to backend discovery search
    for (final base in AppConfig.apiBaseUrls) {
      try {
        final uri = Uri.parse('$base/discovery/search?q=${Uri.encodeComponent(trimmed)}');
        final response = await http.get(uri).timeout(const Duration(seconds: 5));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          final list = json['places'] as List<dynamic>? ?? [];
          if (list.isNotEmpty) {
            final places = list.map((item) {
              final map = item as Map<String, dynamic>;
              final name = (map['name'] ?? '').toString();
              final category = (map['category'] ?? map['type'] ?? 'attraction').toString();
              final placeId = map['id']?.toString() ?? 'search-$name';
              final img = resolveDynamicImageForPlace(name, category: category, placeId: placeId);
              return NearbyPlace(
                id: placeId,
                name: name,
                type: (map['type'] ?? 'Atraccion').toString(),
                distanceMeters: 0,
                location: GeoPoint(
                  latitude: (map['latitude'] as num?)?.toDouble() ?? 0.0,
                  longitude: (map['longitude'] as num?)?.toDouble() ?? 0.0,
                ),
                category: category,
                imageUrl: img,
                thumbnailUrl: img,
                statusLabel: 'Disponible',
                isOpenNow: true,
              );
            }).toList();
            return await _enrichPlacesWithRealImages(places);
          }
        }
      } catch (_) {}
    }

    return const [];
  }

  /// Reverse geocodes a coordinate to obtain a readable place name and address.
  Future<Map<String, String>> reverseGeocode(double lat, double lon) async {
    for (final base in AppConfig.apiBaseUrls) {
      try {
        final uri = Uri.parse('$base/discovery/reverse-geocode?lat=$lat&lng=$lon');
        final response = await http.get(uri).timeout(const Duration(seconds: 5));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          final name = (data['name'] ?? '').toString().trim();
          if (name.isNotEmpty && name != 'Ubicación seleccionada') {
            return {
              'name': name,
              'address': (data['address'] ?? '').toString().trim(),
              'city': (data['city'] ?? '').toString().trim(),
            };
          }
        }
      } catch (_) {}
    }

    try {
      final uri = Uri.parse('https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon');
      final response = await http.get(uri, headers: {'User-Agent': 'VibeToursApp/1.0'}).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final address = data['address'] as Map<String, dynamic>? ?? {};
        final name = (data['name'] ?? address['tourism'] ?? address['historic'] ?? address['amenity'] ?? address['road'] ?? 'Ubicación seleccionada').toString();
        final display = (data['display_name'] ?? '').toString();
        return {
          'name': name,
          'address': display,
          'city': (address['city'] ?? address['town'] ?? address['municipality'] ?? '').toString(),
        };
      }
    } catch (_) {}

    return {
      'name': 'Punto en el mapa',
      'address': '$lat, $lon',
      'city': '',
    };
  }

  Future<List<LocalEvent>> localEvents({
    required double latitude,
    required double longitude,
  }) async {
    final Map<String, LocalEvent> eventMap = {};
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('events')
          .select()
          .order('starts_at', ascending: true);
      
      final events = (response as List)
          .map((item) => LocalEvent.fromJson(item as Map<String, dynamic>))
          .toList();

      for (final e in events) {
        if (e.id.isNotEmpty) eventMap[e.id] = e;
      }
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getStringList('local_admin_events') ?? [];
      for (final jsonStr in localJson) {
        final map = jsonDecode(jsonStr) as Map<String, dynamic>;
        final e = LocalEvent.fromJson(map);
        if (e.id.isNotEmpty) eventMap[e.id] = e;
      }
    } catch (_) {}

    final list = eventMap.values.toList();
    list.sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return list;
  }

  // PRIVATE HELPERS FOR BYPASSING BACKEND

  String _weatherLabel(int code, bool isDay) {
    if (code == 0) return isDay ? 'Soleado' : 'Despejado';
    if (const [1, 2, 3].contains(code)) return isDay ? 'Soleado con nubes' : 'Parcialmente nublado';
    if (const [45, 48].contains(code)) return 'Niebla';
    if (const [51, 53, 55, 56, 57].contains(code)) return isDay ? 'Soleado / Llovizna' : 'Llovizna';
    if (const [61, 63, 65, 66, 67, 80, 81, 82].contains(code)) return 'Lluvia';
    if (const [71, 73, 75, 77, 85, 86].contains(code)) return 'Nieve';
    if (const [95, 96, 99].contains(code)) return 'Tormenta';
    return isDay ? 'Soleado' : 'Despejado';
  }

  NearbyPlace _nearbyPlaceFromPhotonFeature(Map<String, dynamic> feature, int index) {
    final properties = feature['properties'] is Map ? Map<String, dynamic>.from(feature['properties'] as Map) : const <String, dynamic>{};
    final geometry = feature['geometry'] is Map ? Map<String, dynamic>.from(feature['geometry'] as Map) : const <String, dynamic>{};
    final coordinates = geometry['coordinates'] is List ? geometry['coordinates'] as List : const [];
    final name = properties['name']?.toString() ?? properties['city']?.toString() ?? 'Lugar';
    final typeStr = properties['osm_value']?.toString() ?? properties['type']?.toString() ?? 'place';
    final lat = coordinates.length > 1 ? _double(coordinates[1]) : 0.0;
    final lng = coordinates.isNotEmpty ? _double(coordinates[0]) : 0.0;
    final category = _classifyAttraction(properties);
    final placeId = 'search-$index';
    final directImg = _directImageUrlFromTags(
      properties,
      placeName: name,
      category: category,
    ) ?? '';

    return NearbyPlace(
      id: placeId,
      name: name,
      type: _typeLabel(typeStr),
      distanceMeters: 0,
      location: GeoPoint(latitude: lat, longitude: lng),
      category: category,
      sourceTags: properties,
      imageUrl: directImg,
      thumbnailUrl: directImg,
      statusLabel: 'Disponible',
      isOpenNow: true,
    );
  }
  Future<List<NearbyPlace>> _nearbyOverpassPlaces(double latitude, double longitude) async {
    const radius = 8000;
    final query = '''
      [out:json][timeout:25];
      (
        node(around:$radius,$latitude,$longitude)["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"]["wikidata"];
        node(around:$radius,$latitude,$longitude)["historic"~"monument|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage|plaza|square"]["wikidata"];
        node(around:$radius,$latitude,$longitude)["leisure"~"park|garden|nature_reserve|water_park"]["wikidata"];
        node(around:$radius,$latitude,$longitude)["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"]["wikipedia"];
        node(around:$radius,$latitude,$longitude)["historic"~"monument|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage|plaza|square"]["wikipedia"];
        node(around:$radius,$latitude,$longitude)["leisure"~"park|garden|nature_reserve|water_park"]["wikipedia"];
        node(around:$radius,$latitude,$longitude)["tourism"~"attraction|museum|viewpoint|theme_park|zoo"];
        node(around:$radius,$latitude,$longitude)["historic"~"castle|fort|ruins|cathedral"];
        node(around:$radius,$latitude,$longitude)["amenity"="place_of_worship"]["name"];
        node(around:$radius,$latitude,$longitude)["natural"~"water|wetland|beach|bay"]["name"];
        way(around:$radius,$latitude,$longitude)["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"]["wikidata"];
        way(around:$radius,$latitude,$longitude)["historic"~"monument|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage|plaza|square"]["wikidata"];
        way(around:$radius,$latitude,$longitude)["leisure"~"park|garden|nature_reserve|water_park"]["wikidata"];
        way(around:$radius,$latitude,$longitude)["tourism"~"museum|gallery|viewpoint|attraction|theme_park|zoo|aquarium"]["wikipedia"];
        way(around:$radius,$latitude,$longitude)["historic"~"monument|ruins|castle|archaeological_site|church|cathedral|city_gate|fort|heritage|plaza|square"]["wikipedia"];
        way(around:$radius,$latitude,$longitude)["leisure"~"park|garden|nature_reserve|water_park"]["wikipedia"];
        way(around:$radius,$latitude,$longitude)["tourism"~"attraction|museum|viewpoint|theme_park|zoo"];
        way(around:$radius,$latitude,$longitude)["historic"~"castle|fort|ruins|cathedral"];
        way(around:$radius,$latitude,$longitude)["amenity"="place_of_worship"]["name"];
        way(around:$radius,$latitude,$longitude)["natural"~"water|wetland|beach|bay"]["name"];
        relation(around:$radius,$latitude,$longitude)["boundary"="national_park"];
        relation(around:$radius,$latitude,$longitude)["leisure"="nature_reserve"];
        relation(around:$radius,$latitude,$longitude)["amenity"="place_of_worship"]["name"];
        relation(around:$radius,$latitude,$longitude)["natural"~"water|wetland|beach|bay"]["name"];
        relation(around:$radius,$latitude,$longitude)["historic"~"heritage|monument|memorial|church"]["wikidata"];
      );
      out center tags 40;
    ''';
    try {
      final overpassMirrors = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      ];
      http.Response? response;
      for (final mirror in overpassMirrors) {
        try {
          final res = await http.post(
            Uri.parse(mirror),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'VIBETOURS/1.0 contact=ops@vibetours.app',
            },
            body: {'data': query},
          ).timeout(const Duration(seconds: 5));
          if (res.statusCode == 200) {
            response = res;
            break;
          }
        } catch (_) {
          continue;
        }
      }
      if (response != null && response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final elements = json['elements'] as List<dynamic>? ?? const [];
        final List<NearbyPlace> places = [];
        final Set<String> seenNames = {};
        int idx = 0;
        for (final element in elements) {
          if (element is Map) {
            final tags = element['tags'] is Map ? Map<String, dynamic>.from(element['tags'] as Map) : const <String, dynamic>{};
            final rawName = tags['official_name']?.toString() ??
                tags['name:es']?.toString() ??
                tags['name']?.toString() ??
                tags['alt_name']?.toString();
            if (rawName == null || rawName.trim().isEmpty) continue;
            var name = rawName.trim();

            if (name.toLowerCase() == 'parque' || name.toLowerCase() == 'plaza') {
              final alt = tags['alt_name']?.toString() ??
                  tags['official_name']?.toString() ??
                  tags['brand']?.toString() ??
                  tags['operator']?.toString();
              if (alt != null && alt.trim().isNotEmpty && alt.toLowerCase() != name.toLowerCase()) {
                name = alt.trim().toLowerCase().startsWith(name.toLowerCase()) ? alt.trim() : '$name ${alt.trim()}';
              }
            }

            final normalizedKey = name.toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
            if (seenNames.contains(normalizedKey)) continue;

            final lat = _double(element['lat'] ?? (element['center'] as Map?)?['lat']);
            final lon = _double(element['lon'] ?? (element['center'] as Map?)?['lon']);
            final typeStr = tags['tourism']?.toString() ?? tags['historic']?.toString() ?? tags['amenity']?.toString() ?? tags['leisure']?.toString() ?? tags['sport']?.toString() ?? tags['natural']?.toString() ?? 'place';
            if (lat == 0.0 || lon == 0.0) continue;
            if (_isAccommodation(typeStr)) continue;
            if (_isBlacklisted(name, typeStr)) continue;

            final distance = _distanceMeters(latitude, longitude, lat, lon);
            if (distance > 8000) continue;
            
            seenNames.add(normalizedKey);
            final category = _classifyAttraction(tags);
            final placeId = 'overpass-${element['id'] ?? idx++}';
            final directImg = _directImageUrlFromTags(
              tags,
              placeName: name,
              category: category,
            ) ?? '';

            places.add(NearbyPlace(
              id: placeId,
              name: name,
              type: _typeLabel(typeStr),
              distanceMeters: distance.round(),
              location: GeoPoint(latitude: lat, longitude: lon),
              category: category,
              sourceTags: tags,
              imageUrl: directImg,
              thumbnailUrl: directImg,
              statusLabel: 'Abierto',
              isOpenNow: true,
            ));
          }
        }
        places.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));
        return places.take(20).toList();
      }
    } catch (_) {
      // Fall through
    }
    return const [];
  }

  double distanceMeters(double lat1, double lon1, double lat2, double lon2) =>
      _distanceMeters(lat1, lon1, lat2, lon2);

  double _distanceMeters(double lat1, double lon1, double lat2, double lon2) {
    const radius = 6371000.0;
    double toRad(double value) => value * 3.141592653589793 / 180.0;
    final dLat = toRad(lat2 - lat1);
    final dLon = toRad(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(toRad(lat1)) * cos(toRad(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    return 2 * radius * atan2(sqrt(a), sqrt(1 - a));
  }

  String _classifyAttraction(Map<String, dynamic> tags) {
    final osmKey = tags['osm_key']?.toString().toLowerCase() ?? '';
    final osmValue = tags['osm_value']?.toString().toLowerCase() ?? '';
    final tourism = tags['tourism']?.toString().toLowerCase() ??
        (osmKey == 'tourism' ? osmValue : '');
    final historic = tags['historic']?.toString().toLowerCase() ?? '';
    final amenity = tags['amenity']?.toString().toLowerCase() ??
        (osmKey == 'amenity' ? osmValue : '');
    final leisure = tags['leisure']?.toString().toLowerCase() ?? '';
    final natural = tags['natural']?.toString().toLowerCase() ??
        (osmKey == 'natural' ? osmValue : '');
    final sport = tags['sport']?.toString().toLowerCase() ?? '';

    if (const ['museum', 'gallery', 'arts_centre'].contains(amenity) || tourism == 'museum') return 'museum';
    if (const ['monument', 'memorial', 'ruins', 'castle', 'archaeological_site'].contains(historic)) return 'historic';
    if (const ['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'].contains(tourism)) return tourism;
    if (amenity == 'marketplace') return 'market';
    if (const ['sports_centre', 'stadium', 'pitch', 'track', 'fitness_centre'].contains(leisure) || sport.isNotEmpty) return 'sports';
    if (const ['park', 'garden', 'nature_reserve', 'forest'].contains(leisure) ||
        const ['tree', 'wood', 'grassland', 'beach', 'wetland', 'water', 'bay'].contains(natural)) {
      return 'nature';
    }
    if (const ['restaurant', 'cafe', 'food_court', 'pub', 'bar', 'nightclub'].contains(amenity)) return amenity;
    if (amenity == 'place_of_worship' || const ['cathedral', 'church', 'temple', 'mosque'].contains(historic)) return 'religious';
    return tourism.isNotEmpty ? tourism : (historic.isNotEmpty ? historic : (amenity.isNotEmpty ? amenity : (leisure.isNotEmpty ? leisure : (natural.isNotEmpty ? natural : 'place'))));
  }

  bool _isAccommodation(String type) {
    return const [
      'hotel',
      'hostel',
      'guest_house',
      'apartment',
      'motel',
      'camp_site',
      'caravan_site',
      'chalet'
    ].contains(type.toLowerCase());
  }

  List<NearbyPlace> _fallbackPlaces({
    required double latitude,
    required double longitude,
  }) {
    return [
      NearbyPlace(
        id: 'fallback-current',
        name: 'Tu zona actual',
        type: 'Ubicacion',
        distanceMeters: 0,
        location: GeoPoint(latitude: latitude, longitude: longitude),
        category: 'Ubicacion',
        statusLabel: 'Disponible ahora',
        isOpenNow: true,
      ),
      NearbyPlace(
        id: 'fallback-attraction',
        name: 'Punto de interes cercano',
        type: 'Atraccion',
        distanceMeters: 450,
        location: GeoPoint(
          latitude: latitude + 0.002,
          longitude: longitude + 0.002,
        ),
        category: 'Atraccion',
      ),
      NearbyPlace(
        id: 'fallback-market',
        name: 'Zona gastronomica',
        type: 'Mercado',
        distanceMeters: 900,
        location: GeoPoint(
          latitude: latitude - 0.003,
          longitude: longitude + 0.0015,
        ),
        category: 'Mercado',
      ),
      NearbyPlace(
        id: 'fallback-viewpoint',
        name: 'Mirador local',
        type: 'Mirador',
        distanceMeters: 1350,
        location: GeoPoint(
          latitude: latitude + 0.004,
          longitude: longitude - 0.002,
        ),
        category: 'Mirador',
      ),
    ];
  }

  String _typeLabel(String type) {
    final lower = type.trim().toLowerCase().replaceAll('_', ' ');
    return switch (lower) {
      'important tourist attraction' ||
      'tourist attraction' ||
      'attraction' ||
      'atraccion' ||
      'atracción' => 'Atracción',
      'park recreation area' ||
      'recreation area' ||
      'park' ||
      'parque' ||
      'national park' ||
      'city park' => 'Parque',
      'stadium' || 'estadio' => 'Estadio',
      'sports centre' ||
      'sports center' ||
      'sports' ||
      'sport' ||
      'sports field' ||
      'coliseo' ||
      'cancha' => 'Deportivo',
      'river scenic area' ||
      'scenic/panoramic view' ||
      'scenic area' ||
      'scenic panoramic view' ||
      'viewpoint' ||
      'mirador' => 'Mirador',
      'museum' || 'museo' => 'Museo',
      'theatre' || 'theater' || 'teatro' => 'Teatro',
      'gallery' || 'galeria' || 'galería' => 'Galería',
      'arts centre' || 'arts center' || 'arts_centre' => 'Arte',
      'marketplace' || 'market' || 'mercado' => 'Mercado',
      'nature' ||
      'nature reserve' ||
      'naturaleza' ||
      'forest' ||
      'wetland' ||
      'water' => 'Naturaleza',
      'beach' || 'playa' => 'Playa',
      'zoo' || 'zoologico' || 'zoológico' => 'Zoológico',
      'aquarium' || 'acuario' => 'Acuario',
      'theme park' || 'theme_park' => 'Parque de atracciones',
      'restaurant' || 'restaurante' => 'Restaurante',
      'cafe' || 'café' => 'Café',
      'bar' => 'Bar',
      'place of worship' ||
      'place_of_worship' ||
      'church' ||
      'cathedral' ||
      'temple' ||
      'mosque' ||
      'synagogue' ||
      'religious' ||
      'religioso' => 'Religioso',
      'historic' ||
      'historico' ||
      'histórico' ||
      'historic site' ||
      'historical monument' ||
      'monument' ||
      'monumento' ||
      'statue' ||
      'estatua' ||
      'memorial' ||
      'memoria' ||
      'ruins' ||
      'castle' ||
      'archaeological site' => 'Monumento',
      'tower' || 'torre' => 'Torre',
      'cemetery' || 'cementerio' => 'Cementerio',
      'marina' || 'water sports' => 'Deportes acuáticos',
      'bridge' || 'puente' => 'Puente',
      _ => _capitalizeWords(lower),
    };
  }

  static String _capitalizeWords(String text) {
    if (text.isEmpty) return text;
    return text
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .map((w) => '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }

  int _int(Object? value) {
    if (value is num) return value.round();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  double _double(Object? value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  Future<List<NearbyPlace>> _searchWikipediaPlaces(
    String query, {
    double? userLat,
    double? userLon,
  }) async {
    try {
      final searchUri = Uri.https(
        'es.wikipedia.org',
        '/w/api.php',
        {
          'action': 'query',
          'list': 'search',
          'srsearch': query,
          'srlimit': '10',
          'format': 'json',
        },
      );
      final searchResponse = await http
          .get(searchUri, headers: const {'User-Agent': 'VIBETOURS/1.0 (contact@vibetours.app)'})
          .timeout(const Duration(seconds: 6));
      if (searchResponse.statusCode < 200 || searchResponse.statusCode >= 300) {
        return const [];
      }

      final searchJson = jsonDecode(searchResponse.body) as Map<String, dynamic>;
      final queryObj = searchJson['query'] as Map<String, dynamic>? ?? {};
      final searchResults = queryObj['search'] as List<dynamic>? ?? const [];
      if (searchResults.isEmpty) return const [];

      final List<int> pageIds = [];
      for (final item in searchResults) {
        if (item is Map) {
          final pid = _int(item['pageid']);
          if (pid > 0) pageIds.add(pid);
        }
      }
      if (pageIds.isEmpty) return const [];

      final batchUri = Uri.https(
        'es.wikipedia.org',
        '/w/api.php',
        {
          'action': 'query',
          'pageids': pageIds.join('|'),
          'prop': 'coordinates|pageimages|extracts',
          'pithumbsize': '800',
          'exintro': '1',
          'explaintext': '1',
          'format': 'json',
        },
      );
      final batchResponse = await http
          .get(batchUri, headers: const {'User-Agent': 'VIBETOURS/1.0 (contact@vibetours.app)'})
          .timeout(const Duration(seconds: 6));
      if (batchResponse.statusCode < 200 || batchResponse.statusCode >= 300) {
        return const [];
      }

      final batchJson = jsonDecode(batchResponse.body) as Map<String, dynamic>;
      final pagesMap = (batchJson['query'] as Map<String, dynamic>?)?['pages'] as Map<String, dynamic>? ?? {};

      final List<NearbyPlace> places = [];
      for (final pageId in pageIds) {
        final pageData = pagesMap[pageId.toString()] as Map<String, dynamic>?;
        if (pageData == null) continue;

        final coordsList = pageData['coordinates'] as List<dynamic>?;
        if (coordsList == null || coordsList.isEmpty) continue;

        final firstCoord = coordsList.first as Map<String, dynamic>;
        final lat = _double(firstCoord['lat']);
        final lon = _double(firstCoord['lon']);
        if (lat == 0.0 || lon == 0.0) continue;

        final rawTitle = pageData['title']?.toString() ?? '';
        final cleanName = rawTitle.replaceAll(RegExp(r'\s*\([^)]*\)'), '').trim();
        final rawExtract = pageData['extract']?.toString() ?? '';
        final extract = _normalizeWikipediaText(rawExtract);

        if (_isExtinctPlace(cleanName, extract)) continue;
        if (_isCityAdministrativeArticle(cleanName, extract)) continue;
        if (_isNonTourismInstitution(cleanName, extract)) continue;

        final isNeigh = _isNeighborhood(cleanName, extract, rawTitle: rawTitle);
        final category = _classifyWikipediaPlace(
          cleanName,
          extract,
          isEmblematicNeighborhood: isNeigh,
        );

        final pageThumb = (pageData['thumbnail'] as Map?)?['source']?.toString();
        final img = (pageThumb != null &&
                pageThumb.isNotEmpty &&
                _isUsableImageUrl(pageThumb, placeName: cleanName, category: category))
            ? pageThumb
            : '';

        final distance = (userLat != null && userLon != null)
            ? _distanceMeters(userLat, userLon, lat, lon).round()
            : 0;

        places.add(NearbyPlace(
          id: 'wiki-$pageId',
          name: cleanName,
          type: isNeigh ? 'Barrio Emblemático' : _typeLabel(category),
          distanceMeters: distance,
          location: GeoPoint(latitude: lat, longitude: lon),
          category: category,
          sourceTags: {
            'wikipedia': rawTitle,
            'pageid': pageId,
            'extract': extract,
            'is_neighborhood': isNeigh,
          },
          imageUrl: img,
          thumbnailUrl: img,
          statusLabel: 'Abierto',
          isOpenNow: true,
        ));
      }

      if (userLat != null && userLon != null) {
        places.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));
      }
      return places;
    } catch (_) {
      return const [];
    }
  }

  static int _hashString(String input) {
    int h = 0;
    for (int i = 0; i < input.codeUnits.length; i++) {
      h = (31 * h + input.codeUnitAt(i)) & 0x7FFFFFFF;
    }
    return h;
  }

  static String _getSafeFallbackImageUrl(String category, String name, {String placeId = ''}) {
    final searchStr = '${category.toLowerCase()} ${name.toLowerCase()}';
    final seedStr = '${placeId}_${name}_$category';
    final hash = _hashString(seedStr);

    List<String> pool;

    // 1. Iglesias, templos y catedrales
    if (searchStr.contains('iglesia') ||
        searchStr.contains('catedral') ||
        searchStr.contains('templo') ||
        searchStr.contains('church') ||
        searchStr.contains('cathedral') ||
        searchStr.contains('temple') ||
        searchStr.contains('basilica') ||
        searchStr.contains('basílica') ||
        searchStr.contains('capilla') ||
        searchStr.contains('chapel') ||
        searchStr.contains('santuario')) {
      pool = const [
        'https://images.unsplash.com/photo-1548625361-155de6c7f54d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 2. Playas, islas y bahías
    else if (searchStr.contains('playa') ||
        searchStr.contains('beach') ||
        searchStr.contains('bahia') ||
        searchStr.contains('bahía') ||
        searchStr.contains('bay') ||
        searchStr.contains('mar') ||
        searchStr.contains('ocean') ||
        searchStr.contains('oceano') ||
        searchStr.contains('costa') ||
        searchStr.contains('coast') ||
        searchStr.contains('isla') ||
        searchStr.contains('island') ||
        searchStr.contains('puerto') ||
        searchStr.contains('port')) {
      pool = const [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 3. Atracciones, parques de diversiones y entretenimiento familiar
    else if (searchStr.contains('divercity') ||
        searchStr.contains('atraccion') ||
        searchStr.contains('attraction') ||
        searchStr.contains('theme_park') ||
        searchStr.contains('amusement') ||
        searchStr.contains('diversion')) {
      pool = const [
        'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1561489413-985b06da5bee?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 4. Parques verdes, jardines y naturaleza urbana
    else if (searchStr.contains('parque') ||
        searchStr.contains('park') ||
        searchStr.contains('jardin') ||
        searchStr.contains('jardín') ||
        searchStr.contains('garden') ||
        searchStr.contains('bosque') ||
        searchStr.contains('forest') ||
        searchStr.contains('lago') ||
        searchStr.contains('lake') ||
        searchStr.contains('rio') ||
        searchStr.contains('río') ||
        searchStr.contains('river') ||
        searchStr.contains('laguna')) {
      pool = const [
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 5. Museos, monumentos históricos y arte
    else if (searchStr.contains('museo') ||
        searchStr.contains('museum') ||
        searchStr.contains('monumento') ||
        searchStr.contains('monument') ||
        searchStr.contains('memorial') ||
        searchStr.contains('escultura') ||
        searchStr.contains('estatua') ||
        searchStr.contains('galeria') ||
        searchStr.contains('galería') ||
        searchStr.contains('gallery') ||
        searchStr.contains('art') ||
        searchStr.contains('arte')) {
      pool = const [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 6. Plazas, calles urbanas y paseos
    else if (searchStr.contains('plaza') ||
        searchStr.contains('square') ||
        searchStr.contains('calle') ||
        searchStr.contains('street') ||
        searchStr.contains('avenida') ||
        searchStr.contains('paseo') ||
        searchStr.contains('malecon') ||
        searchStr.contains('malecón')) {
      pool = const [
        'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
      ];
    }
    // 7. Fallback general urbano / turístico arquitectónico
    else {
      pool = const [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      ];
    }

    return pool[hash % pool.length];
  }
}

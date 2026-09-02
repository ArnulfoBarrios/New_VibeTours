import '../../domain/models.dart';

/// Formatter utility that converts raw POI stop names and descriptions
/// into warm, natural, human tour guide audio narrations with phonetic cleanup.
class TourGuideFormatter {
  const TourGuideFormatter._();

  /// Converts Roman numerals commonly used in historic texts (e.g., 'siglo XVII')
  /// to spoken words so speech synthesizers pronounce them naturally.
  static String normalizePhonetics(String text) {
    if (text.isEmpty) return text;

    String clean = text;

    // Century replacements (Siglo I - Siglo XXI)
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XXI\b', caseSensitive: false), 'siglo veintiuno');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XX\b', caseSensitive: false), 'siglo veinte');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XIX\b', caseSensitive: false), 'siglo diecinueve');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XVIII\b', caseSensitive: false), 'siglo dieciocho');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XVII\b', caseSensitive: false), 'siglo diecisiete');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XVI\b', caseSensitive: false), 'siglo dieciséis');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XV\b', caseSensitive: false), 'siglo quince');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XIV\b', caseSensitive: false), 'siglo catorce');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XIII\b', caseSensitive: false), 'siglo trece');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XII\b', caseSensitive: false), 'siglo doce');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+XI\b', caseSensitive: false), 'siglo once');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+X\b', caseSensitive: false), 'siglo diez');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+IX\b', caseSensitive: false), 'siglo nueve');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+VIII\b', caseSensitive: false), 'siglo ocho');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+VII\b', caseSensitive: false), 'siglo siete');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+VI\b', caseSensitive: false), 'siglo seis');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+V\b', caseSensitive: false), 'siglo cinco');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+IV\b', caseSensitive: false), 'siglo cuatro');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+III\b', caseSensitive: false), 'siglo tres');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+II\b', caseSensitive: false), 'siglo dos');
    clean = clean.replaceAll(RegExp(r'\bsiglo\s+I\b', caseSensitive: false), 'siglo primero');

    // Common abbreviations
    clean = clean.replaceAll(RegExp(r'\bkm/h\b', caseSensitive: false), 'kilómetros por hora');
    clean = clean.replaceAll(RegExp(r'\bkm\b', caseSensitive: false), 'kilómetros');
    clean = clean.replaceAllMapped(RegExp(r'\b(\d+)\s*m\b', caseSensitive: false), (m) => '${m[1]} metros');
    clean = clean.replaceAll(RegExp(r'\bav\.\s*', caseSensitive: false), 'avenida ');
    clean = clean.replaceAll(RegExp(r'\bcra\.\s*', caseSensitive: false), 'carrera ');
    clean = clean.replaceAll(RegExp(r'\bcll\.\s*', caseSensitive: false), 'calle ');
    clean = clean.replaceAll(RegExp(r'\bsta\.\s*', caseSensitive: false), 'Santa ');
    clean = clean.replaceAll(RegExp(r'\bsto\.\s*', caseSensitive: false), 'Santo ');
    clean = clean.replaceAll(RegExp(r'\bdr\.\s*', caseSensitive: false), 'Doctor ');
    clean = clean.replaceAll(RegExp(r'\bdra\.\s*', caseSensitive: false), 'Doctora ');
    clean = clean.replaceAll(RegExp(r'\bd\.c\.\b', caseSensitive: false), 'Distrito Capital');

    // Clean markdown remnants
    clean = clean.replaceAll(RegExp(r'[*_#•\[\]\(\)]'), ' ');
    clean = clean.replaceAll(RegExp(r'\s+'), ' ').trim();

    return clean;
  }

  /// Cleans raw stop names by stripping redundant category prefixes.
  static String cleanStopName(String rawName) {
    if (rawName.isEmpty) return 'Punto de interés';
    String cleaned = rawName.replaceAll(
      RegExp(
        r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto|Parada)\s*:\s*',
        caseSensitive: false,
      ),
      '',
    ).trim();

    if (cleaned.isEmpty || cleaned.toLowerCase() == 'parada') {
      return 'Punto de interés destacado';
    }
    return cleaned;
  }

  /// Formats an engaging tour guide narration for a specific stop.
  static String formatStopNarration(
    TourStop stop, {
    int stopIndex = 0,
    int totalStops = 1,
    String lang = 'es',
  }) {
    final cleanName = cleanStopName(stop.name);
    String cleanDesc = stop.description.replaceAll(
      RegExp(
        r'^(Atracci[oó]n(\s*/\s*Restaurante)?|Restaurante|Atracci[oó]n|Lugar|Destino|Punto)\s*:\s*',
        caseSensitive: false,
      ),
      '',
    ).trim();

    // Generate natural contextual description if empty or too short
    if (cleanDesc.isEmpty || cleanDesc.length < 20 || cleanDesc.toLowerCase() == cleanName.toLowerCase()) {
      if (RegExp(r'restaurante|comida|caf[ée]|bar|gastronom|asador|bistro', caseSensitive: false).hasMatch(cleanName)) {
        cleanDesc = 'Es un lugar gastronómico muy recomendado para probar exquisitos sabores locales y disfrutar de una buena comida.';
      } else if (RegExp(r'playa|beach|bah[íi]a|cabo|piscina|isla|arrecife', caseSensitive: false).hasMatch(cleanName)) {
        cleanDesc = 'Es un hermoso espacio costero ideal para relajarse, disfrutar de la brisa marina y contemplar el paisaje.';
      } else if (RegExp(r'museo|castillo|muralla|catedral|iglesia|templo|monumento|hist[oó]r', caseSensitive: false).hasMatch(cleanName)) {
        cleanDesc = 'Es un sitio histórico lleno de patrimonio y cultura. Observa su arquitectura y los detalles que lo hacen único.';
      } else if (RegExp(r'parque|jard[íi]n|mirador|sendero|bosque|reserva|cascada', caseSensitive: false).hasMatch(cleanName)) {
        cleanDesc = 'Es un maravilloso entorno natural perfecto para caminar, respirar aire fresco y tomar excelentes fotografías.';
      } else {
        cleanDesc = 'Es uno de los atractivos más emblemáticos de esta ruta. Tómate un momento para apreciar su historia y su ambiente.';
      }
    }

    // Build warm, human tour guide introduction
    final StringBuffer script = StringBuffer();
    if (stopIndex == 0) {
      script.write('¡Hola y bienvenidos a $cleanName! Comenzamos nuestro recorrido aquí. ');
    } else if (stopIndex == totalStops - 1 && totalStops > 1) {
      script.write('Hemos llegado a nuestra última parada: $cleanName. ');
    } else {
      script.write('Nos encontramos ahora en $cleanName. ');
    }

    script.write(cleanDesc);

    // Tips or activities if available
    if (stop.tips.isNotEmpty && stop.tips.first.length > 10) {
      script.write(' Un consejo para tu visita: ${stop.tips.first}.');
    }

    return normalizePhonetics(script.toString());
  }

  /// Formats a welcoming teaser narration for a tour preview.
  static String formatTourTeaser(Tour tour) {
    final firstStop = tour.stops.isNotEmpty ? cleanStopName(tour.stops.first.name) : tour.city;
    final cleanTourDesc = tour.description.replaceAll(RegExp(r'[*_#]'), '').trim();

    final buffer = StringBuffer();
    buffer.write('¡Hola! Te doy la bienvenida a ${tour.title} en ${tour.city}. ');
    buffer.write('En este recorrido conoceremos sitios fascinantes como $firstStop. ');
    if (cleanTourDesc.isNotEmpty && cleanTourDesc.length > 25) {
      buffer.write('$cleanTourDesc. ');
    }
    buffer.write('¡Acompáñame a vivir esta gran experiencia!');

    return normalizePhonetics(buffer.toString());
  }
}

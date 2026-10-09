String _coastalRouteKey(String value) => value
    .toLowerCase()
    .replaceAll('á', 'a')
    .replaceAll('é', 'e')
    .replaceAll('í', 'i')
    .replaceAll('ó', 'o')
    .replaceAll('ú', 'u')
    .replaceAll('ñ', 'n')
    .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
    .trim();

bool isCoastalIslandStopName(String name) {
  final normalized = _coastalRouteKey(name);
  if (normalized == 'islas de san bernardo' ||
      normalized == 'archipielago de san bernardo' ||
      normalized == 'san bernardo archipielago') {
    return false;
  }
  return RegExp(r'\b(isla|islas|islote|islotes|island|islands|islet|cayo|cayos)\b')
      .hasMatch(normalized);
}

/// Recovers the coastal route mode when older tours lost their subtype field.
/// The fallback is limited to the Morrosquillo coast and tours with an
/// individual island/islet stop, so other tour types remain unchanged.
bool isCoastalIslandTourRoute({
  required String itineraryType,
  required String city,
  required Iterable<String> stopNames,
}) {
  if (_coastalRouteKey(itineraryType.replaceAll('_', ' ')) == 'coastal islands') {
    return true;
  }

  final destination = _coastalRouteKey(city);
  final isMorrosquilloDestination = RegExp(
    r'\b(covenas|tolu|san antero|golfo de morrosquillo)\b',
  ).hasMatch(destination);
  if (!isMorrosquilloDestination) return false;
  return stopNames.any(isCoastalIslandStopName);
}

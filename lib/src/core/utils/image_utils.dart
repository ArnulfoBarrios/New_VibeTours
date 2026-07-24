String optimizeImageUrl(String url, {int width = 600, int quality = 75}) {
  if (url.trim().isEmpty) return url;
  if (url.contains('images.unsplash.com')) {
    try {
      final uri = Uri.parse(url);
      final params = Map<String, String>.from(uri.queryParameters);
      params['w'] = width.toString();
      params['q'] = quality.toString();
      params['auto'] = 'format';
      params['fit'] = 'crop';
      return uri.replace(queryParameters: params).toString();
    } catch (_) {
      return url;
    }
  }
  return url;
}

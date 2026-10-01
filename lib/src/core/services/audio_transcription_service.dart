import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class AudioTranscriptionService {
  const AudioTranscriptionService._();

  /// Transcribes a recorded audio file using OpenAI Whisper (direct or via backend proxy).
  static Future<String> transcribeAudioFile(File audioFile, {String? prompt}) async {
    if (!audioFile.existsSync()) {
      throw Exception('El archivo de grabación no existe.');
    }

    final bytes = await audioFile.readAsBytes();
    if (bytes.isEmpty) {
      throw Exception('El archivo de grabación está vacío.');
    }

    final defaultPrompt = prompt ??
        'VibeTours Colombia: Barranquilla, Gran Malecón, Bogotá, Medellín, Cartagena, Santa Marta, Cali, Bucaramanga, San Andrés, lugares emblemáticos, sitios turísticos, transporte, vehículo, carro, presupuesto, itinerario, tour.';

    // 1. Prioridad: Transcripción directa con Groq Whisper Large v3 (100% Gratuito y ultra-rápido)
    if (AppConfig.hasGroq) {
      try {
        debugPrint('[Whisper] Intentando transcripción directa con Groq Cloud...');
        final uri = Uri.parse('https://api.groq.com/openai/v1/audio/transcriptions');
        final request = http.MultipartRequest('POST', uri)
          ..headers['Authorization'] = 'Bearer ${AppConfig.groqApiKey}'
          ..fields['model'] = 'whisper-large-v3-turbo'
          ..fields['language'] = 'es'
          ..fields['temperature'] = '0.0'
          ..fields['prompt'] = defaultPrompt
          ..files.add(
            http.MultipartFile.fromBytes(
              'file',
              bytes,
              filename: 'recording.m4a',
            ),
          );

        final streamed = await request.send().timeout(const Duration(seconds: 25));
        final response = await http.Response.fromStream(streamed);

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          final text = (data['text'] as String?)?.trim() ?? '';
          if (text.isNotEmpty) {
            debugPrint('[Whisper] Transcripción con Groq exitosa: $text');
            return text;
          }
        } else {
          debugPrint('[Whisper] Groq direct error ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        debugPrint('[Whisper] Groq direct exception: $e');
      }
    }

    // 2. Transcripción directa con OpenAI Whisper si tiene clave
    if (AppConfig.hasOpenAi) {
      try {
        debugPrint('[Whisper] Intentando transcripción directa con OpenAI...');
        final uri = Uri.parse('https://api.openai.com/v1/audio/transcriptions');
        final request = http.MultipartRequest('POST', uri)
          ..headers['Authorization'] = 'Bearer ${AppConfig.openAiApiKey}'
          ..fields['model'] = 'whisper-1'
          ..fields['language'] = 'es'
          ..fields['prompt'] = defaultPrompt
          ..files.add(
            http.MultipartFile.fromBytes(
              'file',
              bytes,
              filename: 'recording.m4a',
            ),
          );

        final streamed = await request.send().timeout(const Duration(seconds: 35));
        final response = await http.Response.fromStream(streamed);

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          final text = (data['text'] as String?)?.trim() ?? '';
          if (text.isNotEmpty) {
            debugPrint('[Whisper] Transcripción directa OpenAI exitosa: $text');
            return text;
          }
        } else {
          debugPrint('[Whisper] Direct error ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        debugPrint('[Whisper] Direct exception: $e');
      }
    }

    // 2. Fall back to Backend endpoint: POST /api/ai/audio/transcribe
    final baseUrls = AppConfig.apiBaseUrls;
    final base64Audio = base64Encode(bytes);
    final payload = jsonEncode({
      'audioBase64': base64Audio,
      'format': 'm4a',
      'language': 'es',
      'prompt': prompt ??
          'VibeTours Colombia: Barranquilla, Gran Malecón, Bogotá, Medellín, Cartagena, Santa Marta, Cali, Bucaramanga, San Andrés, lugares emblemáticos, sitios turísticos, transporte, vehículo, carro, presupuesto, itinerario, tour.',
    });

    Object? lastErr;
    for (final baseUrl in baseUrls) {
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
        if (baseUrl.contains('localhost') || baseUrl.contains('127.0.0.1')) {
          continue; // Avoid connection refused on physical mobile device
        }
      }
      try {
        debugPrint('[Whisper] Intentando transcripción vía backend en $baseUrl...');
        final uri = Uri.parse('$baseUrl/ai/audio/transcribe');
        final res = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: payload,
            )
            .timeout(const Duration(seconds: 40));

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body) as Map<String, dynamic>;
          final text = (data['text'] as String?)?.trim() ?? '';
          if (text.isNotEmpty) {
            debugPrint('[Whisper] Transcripción backend exitosa: $text');
            return text;
          }
        } else {
          debugPrint('[Whisper] Backend status ${res.statusCode}: ${res.body}');
        }
      } catch (e) {
        lastErr = e;
        debugPrint('[Whisper] Fallo conectando a $baseUrl: $e');
      }
    }

    throw Exception(
      lastErr != null
          ? 'Error al transcribir el audio: $lastErr'
          : 'No se pudo transcribir el audio. Por favor verifica tu conexión.',
    );
  }
}

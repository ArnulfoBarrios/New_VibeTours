import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  static const String proximityChannelId = 'proximity_channel';
  static const String proximityChannelName = 'Alertas de Proximidad';
  static const String proximityChannelDesc = 'Avisos cuando estás cerca de una parada o lugar de interés';

  static const String toursChannelId = 'tours_channel';
  static const String toursChannelName = 'Tours y Creación con IA';
  static const String toursChannelDesc = 'Avisos cuando se completa la generación de tours con IA';

  static const String remindersChannelId = 'reminders_channel';
  static const String remindersChannelName = 'Recordatorios de Tours';
  static const String remindersChannelDesc = 'Alertas programadas 24 horas antes del inicio de tus tours';

  /// Inicializa los canales y configuraciones locales
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      tz.initializeTimeZones();
    } catch (e) {
      debugPrint('[NotificationService] Error inicializando zonas horarias: $e');
    }

    const androidSettings = AndroidInitializationSettings('ic_stat_vibetours');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        debugPrint('[NotificationService] Notificación seleccionada: payload=${response.payload}');
      },
    );

    // Crear canales en Android
    if (!kIsWeb && Platform.isAndroid) {
      final androidPlugin = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            proximityChannelId,
            proximityChannelName,
            description: proximityChannelDesc,
            importance: Importance.high,
            playSound: true,
            enableVibration: true,
          ),
        );

        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            toursChannelId,
            toursChannelName,
            description: toursChannelDesc,
            importance: Importance.high,
            playSound: true,
          ),
        );

        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            remindersChannelId,
            remindersChannelName,
            description: remindersChannelDesc,
            importance: Importance.high,
            playSound: true,
            enableVibration: true,
          ),
        );

        // Solicitar permisos de notificación en Android 13+
        await androidPlugin.requestNotificationsPermission();
      }
    }

    _isInitialized = true;
    debugPrint('[NotificationService] Sistema de notificaciones inicializado correctamente.');
  }

  /// Verifica si el usuario tiene las notificaciones habilitadas en Ajustes
  Future<bool> _areNotificationsEnabled() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('vibetours_notifications_enabled') ?? true;
    } catch (_) {
      return true;
    }
  }

  /// 1. Muestra una notificación de proximidad inmediata (Tour en vivo o Lugares cercanos)
  Future<void> showProximityNotification({
    required String title,
    required String body,
    int id = 1001,
    String? payload,
  }) async {
    if (!await _areNotificationsEnabled()) return;

    final androidDetails = AndroidNotificationDetails(
      proximityChannelId,
      proximityChannelName,
      channelDescription: proximityChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      ticker: 'Llegada a destino',
      icon: 'ic_stat_vibetours',
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    try {
      await _plugin.show(id, title, body, details, payload: payload);
      debugPrint('[NotificationService] Notificación de proximidad emitida: $title');
    } catch (e) {
      debugPrint('[NotificationService] Error emitiendo notificación de proximidad: $e');
    }
  }

  /// 2. Notificación al crearse un tour con IA (Formato Mensajería con Avatar de IA en el círculo izquierdo)
  Future<void> showAiTourCreatedNotification({
    required String tourTitle,
    String? tourId,
  }) async {
    if (!await _areNotificationsEnabled()) return;

    final aiPerson = Person(
      name: 'Tour Planner AI',
      icon: const DrawableResourceAndroidIcon('ic_tour_planner_ai'),
      bot: true,
      key: 'tour_planner_ai',
    );

    final userPerson = const Person(
      name: 'Tú',
      key: 'user',
    );

    final messagingStyle = MessagingStyleInformation(
      userPerson,
      conversationTitle: 'Tour Planner AI',
      groupConversation: false,
      messages: [
        Message(
          '✨ ¡Tu tour está listo!\nEl tour "$tourTitle" ha sido creado exitosamente con IA. ¡Toca para explorarlo!',
          DateTime.now(),
          aiPerson,
        ),
      ],
    );

    final androidDetails = AndroidNotificationDetails(
      toursChannelId,
      toursChannelName,
      channelDescription: toursChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: messagingStyle,
      icon: 'ic_stat_vibetours',
      category: AndroidNotificationCategory.message,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    try {
      await _plugin.show(
        2001,
        'Tour Planner AI',
        '✨ ¡Tu tour está listo!\nEl tour "$tourTitle" ha sido creado exitosamente con IA. ¡Toca para explorarlo!',
        details,
        payload: tourId != null ? 'tour:$tourId' : null,
      );
      debugPrint('[NotificationService] Notificación de tour IA emitida: $tourTitle');
    } catch (e) {
      debugPrint('[NotificationService] Error emitiendo notificación de tour IA: $e');
    }
  }

  /// 3. Programa un recordatorio 24 horas antes del inicio del tour
  Future<void> scheduleTourReminder({
    required int id,
    required String tourTitle,
    required DateTime startTime,
    required String tourId,
    String? meetingPoint,
  }) async {
    if (!await _areNotificationsEnabled()) return;

    final now = DateTime.now();
    if (startTime.isBefore(now)) return;

    // Calcular la fecha y hora de la alerta (24 horas antes de la salida)
    DateTime scheduledDate = startTime.subtract(const Duration(hours: 24));
    String reminderText = 'Tu tour "$tourTitle" empieza mañana.';

    // Si el tour se creó para iniciar en menos de 24 horas
    if (scheduledDate.isBefore(now)) {
      final hoursUntil = startTime.difference(now).inHours;
      if (hoursUntil >= 2) {
        // Recordar 1 hora antes
        scheduledDate = startTime.subtract(const Duration(hours: 1));
        reminderText = 'Tu tour "$tourTitle" comienza en 1 hora.';
      } else {
        // Si falta menos de 2 horas, programar para dentro de 1 minuto o emitir aviso
        scheduledDate = now.add(const Duration(minutes: 1));
        reminderText = 'Tu tour "$tourTitle" está a punto de comenzar.';
      }
    }

    if (meetingPoint != null && meetingPoint.trim().isNotEmpty) {
      reminderText += ' Punto de encuentro: $meetingPoint.';
    }

    final androidDetails = AndroidNotificationDetails(
      remindersChannelId,
      remindersChannelName,
      channelDescription: remindersChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      icon: 'ic_stat_vibetours',
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    try {
      final tzScheduled = tz.TZDateTime.from(scheduledDate, tz.local);
      await _plugin.zonedSchedule(
        id,
        '⏰ Recordatorio de Tour',
        reminderText,
        tzScheduled,
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        payload: 'tour:$tourId',
      );
      debugPrint('[NotificationService] Recordatorio agendado para $tzScheduled (Tour: $tourTitle)');
    } catch (e) {
      debugPrint('[NotificationService] Error agendando recordatorio: $e');
    }
  }

  /// Cancela una notificación programada por ID
  Future<void> cancelNotification(int id) async {
    try {
      await _plugin.cancel(id);
    } catch (e) {
      debugPrint('[NotificationService] Error cancelando notificación $id: $e');
    }
  }

  /// Cancela todas las notificaciones pendientes
  Future<void> cancelAll() async {
    try {
      await _plugin.cancelAll();
      debugPrint('[NotificationService] Todas las notificaciones pendientes han sido canceladas.');
    } catch (e) {
      debugPrint('[NotificationService] Error cancelando todas las notificaciones: $e');
    }
  }
}

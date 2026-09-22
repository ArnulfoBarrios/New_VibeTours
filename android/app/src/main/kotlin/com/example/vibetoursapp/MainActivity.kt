package com.vibetours.app

import android.content.Intent
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val FOREGROUND_CHANNEL = "com.vibetours.app/foreground_service"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, FOREGROUND_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "startService" -> {
                    val title = call.argument<String>("title") ?: "✨ Creando tu tour personalizado"
                    val message = call.argument<String>("message") ?: "Tour Planner AI está diseñando tu itinerario."

                    val serviceIntent = Intent(this, TourGenerationService::class.java).apply {
                        action = TourGenerationService.ACTION_START
                        putExtra(TourGenerationService.EXTRA_TITLE, title)
                        putExtra(TourGenerationService.EXTRA_MESSAGE, message)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(serviceIntent)
                    } else {
                        startService(serviceIntent)
                    }
                    result.success(true)
                }
                "stopService" -> {
                    val serviceIntent = Intent(this, TourGenerationService::class.java).apply {
                        action = TourGenerationService.ACTION_STOP
                    }
                    startService(serviceIntent)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }
}

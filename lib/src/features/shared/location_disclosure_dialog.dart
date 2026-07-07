import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/app_state.dart';

Future<bool> checkAndRequestLocationPermission(BuildContext context, WidgetRef ref) async {
  final service = ref.read(locationServiceProvider);
  
  if (service.hasAcceptedDisclosure) {
    return service.requestPermissionExplicitly();
  }

  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      return AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.location_on_rounded, color: Colors.blueAccent),
            SizedBox(width: 8),
            Text('Uso de la Ubicación'),
          ],
        ),
        content: const Text(
          'VibeTours recopila datos de ubicación para permitir la navegación guiada '
          'en tiempo real por los puntos de interés del tour, proporcionar indicaciones en el mapa '
          'y activar alertas de audio automáticas, incluso cuando la aplicación está cerrada o no '
          'se está utilizando (segundo plano).\n\n'
          '¿Aceptas otorgar permisos de ubicación para utilizar estas funciones?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Rechazar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Aceptar'),
          ),
        ],
      );
    },
  );

  if (result == true) {
    await service.acceptDisclosure();
    return service.requestPermissionExplicitly();
  }
  
  return false;
}

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class GlobalMapBackground extends StatefulWidget {
  const GlobalMapBackground({super.key});

  @override
  State<GlobalMapBackground> createState() => _GlobalMapBackgroundState();
}

class _GlobalMapBackgroundState extends State<GlobalMapBackground> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Usar estilos base gratuitos de carto para maplibre (sin requerir clave por ahora en dev)
    final styleString = isDark
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: MapLibreMap(
        styleString: styleString,
        initialCameraPosition: const CameraPosition(
          target: LatLng(10.3910, -75.4794), // Default Cartagena
          zoom: 12.0,
        ),
        myLocationEnabled: true,
        myLocationRenderMode: MyLocationRenderMode.normal,
        logoViewMargins: const Point(24, 100), // Mover logo arriba de la navbar flotante
        compassViewMargins: const Point(24, 100),
        attributionButtonMargins: const Point(24, 120),
      ),
    );
  }
}

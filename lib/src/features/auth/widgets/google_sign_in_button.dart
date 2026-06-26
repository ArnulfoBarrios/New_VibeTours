import 'dart:math' as math;
import 'package:flutter/material.dart';

class GoogleSignInLogo extends StatelessWidget {
  const GoogleSignInLogo({super.key, this.size = 24});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      padding: EdgeInsets.all(size * 0.15),
      child: CustomPaint(
        painter: _GoogleLogoPainter(),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final center = Offset(w / 2, h / 2);
    final radius = w / 2;

    // Colores oficiales Google
    final blue = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.fill;
    final red = Paint()..color = const Color(0xFFEA4335)..style = PaintingStyle.fill;
    final yellow = Paint()..color = const Color(0xFFFBBC05)..style = PaintingStyle.fill;
    final green = Paint()..color = const Color(0xFF34A853)..style = PaintingStyle.fill;

    // Dibujar el logo G basico con rectangulos y arcos (simplificado)
    final rect = Rect.fromCircle(center: center, radius: radius);

    // Red (Arriba)
    canvas.drawArc(rect, math.pi + math.pi / 4, math.pi / 2, true, red);
    
    // Yellow (Izquierda)
    canvas.drawArc(rect, math.pi - math.pi / 4, math.pi / 2, true, yellow);
    
    // Green (Abajo)
    canvas.drawArc(rect, math.pi / 4, math.pi / 2, true, green);
    
    // Blue (Derecha y centro)
    canvas.drawArc(rect, -math.pi / 4, math.pi / 2, true, blue);
    canvas.drawRect(Rect.fromLTRB(center.dx, center.dy - w*0.1, w, center.dy + w*0.1), blue);

    // Corte blanco en el medio para hacer la forma de 'G'
    canvas.drawCircle(center, radius * 0.5, Paint()..color = Colors.white..style = PaintingStyle.fill);
    
    // Linea separadora derecha de la G (borra un poco el azul arriba del rectangulo azul)
    canvas.drawRect(Rect.fromLTRB(center.dx, 0, w, center.dy - w*0.1), Paint()..color = Colors.white..style = PaintingStyle.fill);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

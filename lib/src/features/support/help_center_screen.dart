import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final ScrollController _scrollController = ScrollController();
  
  // Create GlobalKeys for each section
  final _key1 = GlobalKey();
  final _key2 = GlobalKey();
  final _key3 = GlobalKey();
  final _key4 = GlobalKey();
  final _key5 = GlobalKey();
  final _key6 = GlobalKey();
  final _key7 = GlobalKey();
  final _key8 = GlobalKey();
  final _key9 = GlobalKey();

  void _scrollTo(GlobalKey key) {
    if (key.currentContext != null) {
      Scrollable.ensureVisible(
        key.currentContext!,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        alignment: 0.0,
      );
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PremiumScaffold(
      safeBottom: true,
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _SupportGlowPainter(context))),
          Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(26, 28, 26, 16),
                child: Row(
                  children: [
                    IconButton.filledTonal(
                      onPressed: () => context.canPop() ? context.pop() : context.go('/settings'),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      'Guías de la App',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 16),
                  child: Column(
                    children: [
                      const _HeaderCard(),
                      const SizedBox(height: 24),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _SectionChip('1. Cuenta', onTap: () => _scrollTo(_key1)),
                            _SectionChip('2. Descubrir', onTap: () => _scrollTo(_key2)),
                            _SectionChip('3. Tours', onTap: () => _scrollTo(_key3)),
                            _SectionChip('4. Mapa', onTap: () => _scrollTo(_key4)),
                            _SectionChip('5. Crear', onTap: () => _scrollTo(_key5)),
                            _SectionChip('6. AI', onTap: () => _scrollTo(_key6)),
                            _SectionChip('7. Editar', onTap: () => _scrollTo(_key7)),
                            _SectionChip('8. Perfil', onTap: () => _scrollTo(_key8)),
                            _SectionChip('9. PQRS', onTap: () => _scrollTo(_key9)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Sections
                      _InfoCard(
                        key: _key1,
                        title: '1. Cuenta, invitado e inicio de sesion',
                        icon: Icons.login_rounded,
                        items: const [
                          'Puedes abrir VibeTours como invitado para explorar tours aprobados, lugares cercanos, el mapa basico y detalles publicos.',
                          'Para crear tours, guardar favoritos en la nube, comentar, calificar, enviar PQRS o pedir disponibilidad necesitas iniciar sesion.',
                          'Si intentas una accion privada, VibeTours mostrara el aviso "Inicia sesion para continuar" sin perder lo que estabas viendo.',
                          'El login por correo se mantiene disponible. Si Google esta configurado, tambien puedes entrar con tu cuenta de Google.',
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key2,
                        title: '2. Descubrir lugares cerca de ti',
                        icon: Icons.explore_rounded,
                        items: const [
                          'La seccion Descubrir muestra lugares destacados usando tu ubicacion y recomendaciones cercanas.',
                          'Si el buscador esta vacio, veras recomendaciones populares o cercanas para que la pantalla nunca quede sin contenido.',
                          'Puedes buscar palabras como museo, restaurante, parque, playa o mirador para encontrar lugares reales.',
                          'Usa filtros de categoria, precio, distancia y apto para menores para ajustar los resultados.',
                          'El boton "Como llegar" abre la ruta hacia el lugar seleccionado desde el mapa.',
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key3,
                        title: '3. Pantalla Tours',
                        icon: Icons.tour_rounded,
                        items: const [
                          'Explora tours creados por la comunidad o generados por nuestra IA.',
                          'Los tours se pueden filtrar por tipo (aventura, gastronomia, etc.), dificultad o calificacion.',
                          'Accede al detalle de cada tour para ver su ruta completa, paradas e informacion adicional antes de iniciarlo.',
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key4,
                        title: '4. Mapa y navegacion',
                        icon: Icons.map_rounded,
                        items: const [
                          'Visualiza lugares turisticos, eventos y puntos de interes directamente en el mapa.',
                          'Usa la brujula y la ubicacion en tiempo real para guiarte durante tu recorrido.',
                          'El mapa soporta diferentes estilos visuales, ajustables desde la pantalla de configuracion.',
                          'Cuando inicias un tour, el mapa te mostrara el progreso y la distancia restante a cada parada.',
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key5,
                        title: '5. Creacion manual de Tours',
                        icon: Icons.add_location_alt_rounded,
                        items: const [
                          'Crea tus propios tours agregando un nombre, descripcion e imagen de portada.',
                          'Agrega paradas especificas buscando lugares o marcandolas en el mapa.',
                          'Asigna una categoria, etiquetas y nivel de dificultad para que otros usuarios puedan encontrar tu tour facilmente.',
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      _InfoCard(
                        key: _key6,
                        title: '6. IA VibeTour (Planificador)',
                        icon: Icons.auto_awesome_rounded,
                        items: const [
                          'Genera un tour completo simplemente describiendo lo que quieres ver y hacer con la IA.',
                          'VibeTour IA organizara la ruta, sugerira lugares relevantes y preparara toda la experiencia para ti.',
                          'La IA toma en cuenta tus preferencias y la ubicacion seleccionada para ofrecer un recorrido unico.',
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key7,
                        title: '7. Edicion y guardado',
                        icon: Icons.edit_document,
                        items: const [
                          'Puedes editar tus tours creados en la seccion de "Mis Tours".',
                          'Modifica el orden de las paradas, actualiza las imagenes o cambia la descripcion en cualquier momento.',
                          'Guarda tours de otros usuarios en tus favoritos para acceder a ellos rapidamente.',
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key8,
                        title: '8. Perfil y personalizacion',
                        icon: Icons.person_outline_rounded,
                        items: const [
                          'Completa tu perfil turistico eligiendo tus intereses y categorias favoritas.',
                          'Sube una foto de perfil y actualiza tus datos basicos.',
                          'Tus preferencias se utilizan para personalizar las recomendaciones en la seccion Descubrir y en la generacion de IA.',
                        ],
                      ),
                      const SizedBox(height: 20),

                      _InfoCard(
                        key: _key9,
                        title: '9. PQRS y Soporte',
                        icon: Icons.support_agent_rounded,
                        items: const [
                          'Envia Peticiones, Quejas, Reclamos y Sugerencias directamente desde la app.',
                          'El equipo de VibeTours revisara tu solicitud y te dara respuesta en menos de 24 horas habiles.',
                          'Puedes consultar el estado de tus solicitudes en el historial de PQRS.',
                        ],
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard();

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 28,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.menu_book_rounded, color: Colors.white, size: 32),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Guía detallada',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Para explorar, crear, editar, guardar y disfrutar tours.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionChip extends StatelessWidget {
  const _SectionChip(this.label, {required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Material(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Text(
              label,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onPrimaryContainer,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({super.key, required this.title, required this.icon, required this.items});
  
  final String title;
  final IconData icon;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 28,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.primary, size: 28),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.check_circle_rounded, color: AppTheme.primary, size: 20),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    item,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

class _SupportGlowPainter extends CustomPainter {
  _SupportGlowPainter(this.context);
  final BuildContext context;

  @override
  void paint(Canvas canvas, Size size) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isDark ? AppTheme.primary.withValues(alpha: 0.15) : AppTheme.primary.withValues(alpha: 0.05);
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, Colors.transparent],
      ).createShader(
        Rect.fromCircle(
          center: Offset(size.width * 0.5, size.height * 0.2),
          radius: size.width * 0.9,
        ),
      );
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

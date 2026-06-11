import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/premium_components.dart';

class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.kind});

  final String kind;

  bool get _isPrivacy => kind == 'privacy';

  @override
  Widget build(BuildContext context) {
    final sections = _isPrivacy ? _privacySections : _termsSections;
    return PremiumScaffold(
      safeBottom: true,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Row(
                children: [
                  IconButton.filledTonal(
                    onPressed: () => context.canPop()
                        ? context.pop()
                        : context.go('/settings'),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _isPrivacy
                          ? 'Politica de privacidad'
                          : 'Terminos y condiciones',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: GlassPanel(
              margin: const EdgeInsets.fromLTRB(20, 24, 20, 18),
              radius: 28,
              child: Row(
                children: [
                  const Icon(
                    Icons.verified_user_rounded,
                    color: AppTheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _isPrivacy
                          ? 'Tu ubicacion y preferencias se usan para personalizar tours, clima, lugares cercanos y eventos.'
                          : 'Usa VIBETOURS como guia de apoyo. Confirma condiciones reales antes de desplazarte.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
            sliver: SliverList.separated(
              itemCount: sections.length,
              separatorBuilder: (context, index) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final section = sections[index];
                return GlassPanel(
                  radius: 24,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section.title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        section.body,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LegalSection {
  const _LegalSection(this.title, this.body);

  final String title;
  final String body;
}

const _privacySections = [
  _LegalSection(
    'Datos que recopilamos',
    'Podemos procesar email, identificador de usuario, nombre visible, foto de perfil, preferencias turisticas, favoritos, tours creados, tours realizados, ubicacion aproximada y datos tecnicos necesarios para operar la app.',
  ),
  _LegalSection(
    'Uso de ubicacion',
    'La ubicacion se utiliza para calcular clima local, lugares cercanos, eventos de la zona, progreso durante un tour, distancia restante y recomendaciones. Puedes revocar el permiso desde los ajustes del sistema.',
  ),
  _LegalSection(
    'IA y recomendaciones',
    'Las solicitudes al planificador IA pueden incluir destino, ciudad, pais, duracion, tipo de tour, idioma y prompt libre. Usamos estos datos para generar rutas logicas, descripciones, paradas e imagenes relacionadas.',
  ),
  _LegalSection(
    'Almacenamiento y seguridad',
    'Los datos de cuenta se almacenan en Supabase con RLS. La app movil solo usa claves publicas. Las claves privadas de servidor, service role y secretos de proveedores no se incluyen en el cliente.',
  ),
  _LegalSection(
    'Contenido compartido',
    'Si publicas tours, comentarios o PQRS, ese contenido puede asociarse a tu cuenta. Los tours privados y borradores no deben mostrarse publicamente salvo que el usuario decida publicarlos.',
  ),
  _LegalSection(
    'Retencion y eliminacion',
    'Conservamos datos mientras sean necesarios para prestar el servicio, seguridad, soporte y obligaciones legales. Puedes solicitar eliminacion o correccion mediante PQRS o soporte.',
  ),
];

const _termsSections = [
  _LegalSection(
    'Uso de la aplicacion',
    'VIBETOURS ofrece descubrimiento, creacion y recorrido de tours turisticos. El usuario debe usar la app de forma responsable, respetar normas locales y evitar zonas restringidas o peligrosas.',
  ),
  _LegalSection(
    'Mapas y rutas',
    'Los mapas, tiempos, distancias y rutas son estimaciones. Pueden existir cierres, cambios de horario, obras, clima adverso o riesgos locales. Verifica siempre la informacion antes de desplazarte.',
  ),
  _LegalSection(
    'Contenido generado por IA',
    'Los tours generados por IA son recomendaciones automatizadas. Aunque se intenta usar lugares reales y rutas coherentes, el usuario debe validar horarios, accesibilidad, precios y disponibilidad.',
  ),
  _LegalSection(
    'Responsabilidad del usuario',
    'El usuario es responsable de su seguridad, sus pertenencias, su comportamiento durante recorridos y el cumplimiento de leyes locales. VIBETOURS no reemplaza guias oficiales, autoridades o servicios de emergencia.',
  ),
  _LegalSection(
    'Publicacion de tours',
    'No publiques contenido falso, ofensivo, discriminatorio, peligroso, con datos privados de terceros o que infrinja derechos de autor. Podemos ocultar o eliminar contenido que viole estas reglas.',
  ),
  _LegalSection(
    'Soporte y PQRS',
    'Las peticiones, quejas, reclamos y sugerencias se atienden mediante el modulo PQRS. El tiempo objetivo de respuesta es menor a 24 horas habiles, sujeto a disponibilidad y complejidad del caso.',
  ),
];

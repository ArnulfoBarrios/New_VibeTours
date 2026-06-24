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
    'Podemos procesar email, identificador de usuario, nombre visible, foto de perfil, biografía, preferencias turísticas, favoritos, tours creados, tours realizados, calificación de tours, historial de PQRS, ubicación aproximada y datos técnicos del dispositivo necesarios para operar y optimizar la app.',
  ),
  _LegalSection(
    'Uso de ubicación y permisos',
    'La ubicación precisa o aproximada se utiliza para calcular clima local, lugares cercanos, eventos de la zona, progreso durante un tour, distancia restante y recomendaciones en tiempo real. Puedes revocar el permiso desde los ajustes del sistema, aunque algunas funciones dependerán de la ubicación manual.',
  ),
  _LegalSection(
    'Inteligencia Artificial y Recomendaciones',
    'Las solicitudes al planificador IA pueden incluir destino, ciudad, país, duración, tipo de tour, idioma y texto libre. Usamos estos datos anónimamente para generar rutas lógicas, descripciones, paradas e imágenes. No compartimos tus datos personales con los proveedores de IA, solo los parámetros de búsqueda.',
  ),
  _LegalSection(
    'Almacenamiento, Seguridad y Sincronización',
    'Tus datos de cuenta y preferencias (moneda, idioma, logros) se almacenan de manera segura en Supabase con políticas de seguridad de nivel de fila (RLS). La app móvil solo utiliza claves públicas para el acceso, asegurando que tus datos están protegidos contra accesos no autorizados.',
  ),
  _LegalSection(
    'Contenido compartido y Público',
    'Si decides publicar tours, dejar comentarios, valoraciones o enviar PQRS, este contenido estará asociado a tu cuenta. Los tours marcados como privados y los borradores no serán visibles para la comunidad.',
  ),
  _LegalSection(
    'Terceros y Analíticas',
    'Podemos compartir datos anonimizados con servicios de analítica para entender cómo se utiliza la aplicación y mejorar nuestros algoritmos de recomendación. Nunca venderemos tus datos a terceros para fines publicitarios.',
  ),
  _LegalSection(
    'Retención y eliminación de datos',
    'Conservamos tus datos mientras tu cuenta esté activa o sea necesario para prestar el servicio, seguridad, soporte y obligaciones legales. Puedes solicitar una copia de tus datos o su eliminación definitiva a través del módulo de PQRS o contactando a soporte técnico.',
  ),
];

const _termsSections = [
  _LegalSection(
    'Aceptación y Uso de la aplicación',
    'Al usar VIBETOURS, aceptas estos términos en su totalidad. La app ofrece descubrimiento, creación y recorrido de tours turísticos. El usuario se compromete a usar la app de forma responsable, respetando normativas locales, el medio ambiente y evitando zonas restringidas, propiedades privadas o peligrosas.',
  ),
  _LegalSection(
    'Exactitud de Mapas, Rutas y Precios',
    'Los mapas, tiempos, distancias, rutas y precios (incluso convertidos a diferentes monedas) son estimaciones referenciales. Pueden existir cierres, cambios de horario, variaciones cambiarias, clima adverso o riesgos. Verifica siempre la información con fuentes oficiales antes de desplazarte o realizar compras.',
  ),
  _LegalSection(
    'Contenido generado por IA (VibeTour IA)',
    'Los tours generados por nuestra Inteligencia Artificial son recomendaciones automatizadas basadas en bases de datos turísticas. Aunque nos esforzamos por ofrecer lugares reales y rutas coherentes, VIBETOURS no garantiza su precisión absoluta. El usuario debe validar horarios, accesibilidad y existencia real del lugar.',
  ),
  _LegalSection(
    'Propiedad Intelectual y Derechos de Autor',
    'Todo el contenido original de la app pertenece a VIBETOURS. Al crear y hacer público un tour en nuestra plataforma, nos concedes una licencia no exclusiva para mostrarlo, promocionarlo y adaptarlo dentro del servicio.',
  ),
  _LegalSection(
    'Responsabilidad del usuario y Riesgos',
    'El turismo al aire libre implica riesgos inherentes. El usuario es el único responsable de su seguridad, su salud, sus pertenencias y su comportamiento. VIBETOURS no actúa como agencia de viajes ni reemplaza a guías oficiales, autoridades o servicios de emergencia.',
  ),
  _LegalSection(
    'Directrices de Publicación de Tours y Reseñas',
    'Queda estrictamente prohibido publicar contenido falso, difamatorio, ofensivo, discriminatorio, peligroso, spam o que infrinja derechos de autor o privacidad. VIBETOURS se reserva el derecho de moderar, ocultar o eliminar contenido y suspender cuentas que violen estas reglas.',
  ),
  _LegalSection(
    'Soporte, Reclamos y PQRS',
    'Todas las peticiones, quejas, reclamos y sugerencias deben canalizarse a través del módulo PQRS integrado en la app. El tiempo objetivo de respuesta es menor a 24 horas hábiles, sujeto a disponibilidad técnica y complejidad del requerimiento.',
  ),
];

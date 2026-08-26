import type { MessageKey } from "./en.ts";

export const ES: Record<MessageKey, string> = {
  "chrome.rooms": "Salas",
  "chrome.services": "Servicios",
  "chrome.signIn": "Iniciar sesión",
  "chrome.signOut": "Cerrar sesión",
  "chrome.signedOut": "sin sesión",
  "chrome.switchOrg": "Cambiar empresa",
  "chrome.menu": "Menú",
  "chrome.language": "Idioma",
  "chrome.orgs": "Empresas",
  "chrome.skipToContent": "Saltar al contenido",
  "chrome.roomsMobile": "Salas, móvil",

  "runtime.production": "producción",
  "runtime.preview": "vista previa",
  "runtime.local": "local",

  "home.hello": "Hola",
  "home.helloNamed": "Hola, {name}",
  "home.roleAdmin": "Administrador del sistema",
  "home.roleOpen": "Superficie abierta",
  "home.programs": "Programas · {count} instalados",
  "home.openKansli": "Abrir Kansli",
  "home.documentation": "Documentación",
  "home.metaDescription": "Una sala por trabajo. La misma sesión.",

  "service.platform": "Plataforma",
  "service.ops": "Operación",
  "service.events": "Eventos",
  "service.procurement": "Contratación",
  "service.intake": "Nuevo cliente",
  "service.docs": "Documentación",

  "category.kansli": "Inicio",
  "category.ekonomi": "Libro",
  "category.tora": "Contratación",
  "category.rita": "Impuesto",
  "category.britt": "Seguimiento",
  "category.irma": "Acuerdos",
  "category.tyra": "Hotel de neumáticos",
  "category.alva": "Diagnóstico",
  "category.creditae": "Crédito",

  "idp.title": "Iniciar sesión · Pixdrift",
  "idp.heading": "Inicio de sesión",
  "idp.email": "Correo",
  "idp.password": "Contraseña",
  "idp.submit": "Iniciar sesión",
  "idp.noAccount": "¿Sin cuenta?",
  "idp.requestAccess": "Solicitar acceso por la contratación de grupo",
  "idp.wrongCredentials": "Correo o contraseña incorrectos.",
  "idp.tooManyAttempts": "Demasiados intentos. Pruebe de nuevo en un momento.",
  "idp.errorTitle": "Error",
  "idp.errorHeading": "La solicitud no se puede procesar",
  "idp.loginUnavailable": "El inicio de sesión no está disponible ahora",
  "idp.loginUnavailableBody":
    "No pudimos alcanzar el inicio de sesión. Pruebe de nuevo en un momento o vuelva a la {home}.",
  "idp.home": "página de inicio",
  "idp.pkceRequired": "Se requiere PKCE (S256)",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "falta",
  "common.all": "Todos",
  "common.loading": "Cargando…",
  "common.saving": "Guardando…",
  "common.configured": "configurado · {auth}",
  "common.missingKey": "falta la clave",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription":
    "La avería del cliente, notas y mediciones. El diagnóstico llega después.",
  "alva.lead":
    "ALVA recibe lo que dijo el cliente, lo que anotaron y lo que se midió. El diagnóstico se conecta después. El sistema no diagnostica por su cuenta.",
  "alva.notice":
    "El diagnóstico aún no está conectado. Pueden llenar un protocolo vacío con sus propios hechos. El sistema nunca inventa nada.",
  "alva.signInTitle": "Inicie sesión para registrar casos",
  "alva.signInBody": "El caso se guarda en ALVA. Inicie sesión para registrar.",
  "alva.newCase": "Nuevo caso",
  "alva.complaint": "Descripción del cliente",
  "alva.vehicleRef": "Referencia del vehículo (opcional)",
  "alva.area": "Área (opcional, p. ej. frenos)",
  "alva.mileage": "Kilometraje km (opcional)",
  "alva.desiredOutcome": "Resultado deseado (opcional)",
  "alva.register": "Registrar caso",
  "alva.cases": "Casos",
  "alva.empty": "Aún no hay casos.",
  "alva.status.open": "Abierto",
  "alva.status.in_progress": "En curso",
  "alva.status.closed": "Cerrado",
  "alva.detailMetaTitle": "Caso — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Inicie sesión para ver el caso",
  "alva.detailSignInBody": "El caso pertenece a la organización.",
  "alva.detailNotice": "Los hechos los rellenan ustedes. El sistema no saca conclusiones propias.",
  "alva.vehicleRefShort": "Referencia del vehículo",
  "alva.areaShort": "Área",
  "alva.mileageShort": "Kilometraje",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Evaluación crediticia de una contraparte. Su conclusión, sin nota inventada.",
  "creditae.lead":
    "CREDITAE recibe a quién van a evaluar y a qué llegaron ustedes. El sistema no pone nota de crédito.",
  "creditae.noticeOn":
    "Crédito activo. El informe de la agencia se obtiene al registrar la consulta. Su conclusión sigue siendo suya.",
  "creditae.noticeOff":
    "Crédito inactivo. No hay agencia de crédito conectada. La evaluación es suya. El sistema nunca inventa una nota.",
  "creditae.signInTitle": "Inicie sesión para evaluar una contraparte",
  "creditae.signInBody": "La consulta se guarda en CREDITAE. Inicie sesión para registrar.",
  "creditae.newInquiry": "Nueva consulta",
  "creditae.orgNumber": "Número de organización",
  "creditae.companyName": "Nombre de la empresa (opcional)",
  "creditae.reason": "Por qué evalúan (opcional)",
  "creditae.register": "Registrar consulta",
  "creditae.inquiries": "Consultas",
  "creditae.empty": "Aún no hay consultas.",
  "creditae.status.open": "Abierta",
  "creditae.status.assessed": "Evaluada",
  "creditae.assess.go": "Siga",
  "creditae.assess.watch": "Vigile",
  "creditae.assess.stop": "Pare",
  "creditae.vendor.blocked": "Crédito inactivo",
  "creditae.vendor.failed": "Sin informe",
  "creditae.vendor.fetched": "Informe dentro",
  "creditae.detailMetaTitle": "Consulta — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Inicie sesión para ver la consulta",
  "creditae.detailSignInBody": "La consulta pertenece a la organización.",
  "creditae.detailNoticeOn":
    "La conclusión la rellenan ustedes. Los campos de la agencia no son su evaluación.",
  "creditae.detailNoticeOff":
    "La conclusión la rellenan ustedes. El sistema no pone nota de crédito.",
  "creditae.why": "Por qué",
  "creditae.bureau": "Agencia de crédito",
  "creditae.vendorName": "Nombre en la agencia",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "La página de inicio. Tareas y la entrada.",
  "kansli.lead":
    "Aquí empieza todo. La misma sesión en cada sistema y un tablero de tareas para el trabajo interno.",
  "kansli.signInTitle": "Inicie sesión con Pixdrift",
  "kansli.signInBody": "La misma sesión cubre TORA, RITA, BRITT, IRMA y ALVA.",
  "kansli.firstCustomer": "Primer cliente — una lista, no una fecha",
  "kansli.groupProcurement": "Contratación de grupo",
  "kansli.family": "La familia",
  "kansli.map": "El mapa",
  "kansli.mapLead": "Qué hace cada sistema y cómo se conectan.",
  "kansli.recentEvents": "Eventos recientes",
  "kansli.notice":
    "Cuando se crea una tarea, BRITT recibe algo que seguir. Kansli sigue siendo dueño de la tarea.",

  "tasks.summary": "Tablero de tareas — {open} abiertas, {done} hechas.",
  "tasks.titlePlaceholder": "Nueva tarea…",
  "tasks.titleAria": "Título de la tarea",
  "tasks.ownerPlaceholder": "Responsable",
  "tasks.ownerAria": "Responsable",
  "tasks.add": "Añadir",
  "tasks.empty": "Aún no hay tareas. Añada la primera arriba.",
  "tasks.remove": "Quitar",
  "tasks.markDone": 'Marcar "{title}" como hecha',
  "tasks.removeNamed": 'Quitar "{title}"',
  "tasks.fetchError": "No se pudieron cargar las tareas.",
  "tasks.saveError": "No se pudo guardar la tarea.",
  "tasks.updateError": "No se pudo actualizar la tarea.",
  "tasks.deleteError": "No se pudo quitar la tarea.",
  "tasks.genericError": "Algo salió mal.",
  "tasks.emptyTitle": "El título no puede estar vacío.",

  "platform.metaTitle": "Plataforma — Pixdrift",
  "platform.metaDescription": "Qué hace cada sistema y cómo se conectan.",
  "platform.heading": "Qué hace cada sistema",
  "platform.notice":
    "Cada sistema hace un trabajo. TORA toma contrataciones. RITA toma impuesto. No se mezclan.",
  "platform.systems": "Los sistemas",
  "platform.howTheyConnect": "Cómo se conectan",
  "platform.moreSystems": "Más sistemas",
  "platform.waiting": "Esperando a conectarse",
  "platform.tech": "Técnica — para quien lleva la operación",
  "platform.gateway": "Pasarela de modelos",
  "platform.gatewayLead":
    "Una clave da acceso a más de 100 modelos. Recuerde: las respuestas del sistema son conjeturas, no hechos.",
  "platform.gatewayHint": "Ponga {key} en Secrets o {oidc} en Vercel.",

  "family.status.operational": "En marcha",
  "family.status.pilot": "En camino",
  "family.status.deferred": "Aún no listo",
  "family.principle":
    "La misma sesión en cada sistema. Cada sistema hace lo suyo. TORA toma contrataciones. RITA toma impuesto. No se mezclan.",
  "family.incoming":
    "Hay más sistemas en camino. Reciben la misma sesión y sus propios registros. Los nombres llegan cuando estén listos — no antes.",
  "family.party.products": "todos los productos",
  "family.party.events": "la lista de eventos",
  "family.identity.mission": "Una sesión para cada sistema.",
  "family.kansli.mission": "La página de inicio. Tareas y la entrada.",
  "family.ekonomi.mission": "Facturas, IVA y cómo entró el dinero.",
  "family.tora.mission": "Qué contrataciones puede tomar su empresa.",
  "family.rita.mission": "Busca ahorros fiscales en sus libros.",
  "family.britt.mission": "Lo que ocurrió y necesita seguimiento.",
  "family.irma.mission": "Enviar un acuerdo, ver si está leído y confirmado.",
  "family.tyra.mission": "Cliente, coche, ruedas y qué sigue.",
  "family.alva.mission": "La avería del cliente, notas y mediciones. El diagnóstico llega después.",
  "family.creditae.mission":
    "Evaluación crediticia de una contraparte. Su conclusión, sin nota inventada.",
  "family.identity.question": "¿Quién es usted y a qué empresa aplica?",
  "family.identity.does": "Inicia sesión una vez. Luego está en Kansli, TORA, RITA y los demás.",
  "family.identity.doesNot": "Aquí no se envían facturas y aún no hay código extra en el móvil.",
  "family.kansli.question": "¿Por dónde empiezo y qué debemos hacer internamente?",
  "family.kansli.does":
    "Inicio de sesión, un tablero interno de tareas y el formulario de clientes nuevos.",
  "family.kansli.doesNot":
    "Kansli no calcula contratación, impuesto ni neumáticos. Eso lo hacen los otros sistemas.",
  "family.ekonomi.question": "¿Qué está asentado, qué está vencido y cómo entró el dinero?",
  "family.ekonomi.does":
    "Escribe una factura a 10 días, asienta en öre, conecta Stripe y Revolut, concilia cobros cuando el banco está conectado.",
  "family.ekonomi.doesNot":
    "No es Visma. No es Fortnox. Ningún cobro inventado. Las tarjetas necesitan Stripe. Swish necesita que Swish esté cableado.",
  "family.tora.question": "¿Podemos ofertar aquí — y qué debemos hacer ahora?",
  "family.tora.does":
    "Compara la empresa con las contrataciones: requisitos, huecos, importes, fechas y el siguiente paso.",
  "family.tora.doesNot": "No mira los libros. Eso lo hace RITA.",
  "family.rita.question": "¿Qué deducciones, IVA y otros huecos hay en las cuentas anuales?",
  "family.rita.does":
    "Lee las cuentas anuales frente a las normas fiscales suecas y deja propuestas para revisar. No es asesoría fiscal.",
  "family.rita.doesNot":
    "No inventa resultados. No dice si pueden ofertar. Aún no hay archivo de cliente para subir.",
  "family.britt.question": "¿Qué hay que hacer ahora, a partir de lo que ya ocurrió?",
  "family.britt.does": "Reúne cosas que deben seguirse. Una cosa cada vez, con el siguiente paso.",
  "family.britt.doesNot": "BRITT no es un sistema de casos y no es un chat.",
  "family.irma.question": "¿Ha leído y confirmado el acuerdo la contraparte?",
  "family.irma.does": "Envía el acuerdo. Muestra si está abierto, firmado o rechazado.",
  "family.irma.doesNot": "IRMA no es correo y no es un archivo de todos los documentos.",
  "family.tyra.question": "¿Qué cliente, qué coche, qué ruedas — y cuál es el siguiente paso?",
  "family.tyra.does":
    "Mantiene juntos cliente, vehículo y neumáticos. Muestra cuándo toca cambiar o recoger.",
  "family.tyra.doesNot": "TYRA no es un registro general de clientes para otros oficios.",
  "family.alva.question": "¿Qué dijo el cliente, qué se midió — y cuál es el siguiente paso?",
  "family.alva.does": "Toma lo dicho y medido. Muestra la nota. No diagnostica por su cuenta.",
  "family.alva.doesNot": "ALVA no diagnostica y no da consejo.",
  "family.creditae.question": "¿A quién debemos evaluar — y a qué llegaron?",
  "family.creditae.does":
    "Toma un número de organización y su evaluación. Trae el informe de la oficina por el canal de crédito de la plataforma cuando está cableado. Seguir, vigilar o parar.",
  "family.creditae.doesNot": "CREDITAE no pone nota de crédito. El producto no llama a Creditsafe.",
  "family.stack.language": "Idioma",
  "family.stack.language.runs":
    "TypeScript 5 en todo el sistema. SQL en la base. El análisis de RITA corre como programa propio. ekonomi-ledger comprueba comprobantes, no asienta en producción.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Un proceso: sitio, /idp, productos y API.",
  "family.stack.identity": "Identidad",
  "family.stack.identity.runs":
    "Inicio de sesión propio, sobre un estándar abierto. Una cookie le mantiene en sesión. La misma sesión en cada sistema.",
  "family.stack.data": "Datos",
  "family.stack.data.runs":
    "PostgreSQL 16. Cada sistema tiene sus datos. Ningún sistema escribe en los datos de otro.",
  "family.stack.analysis": "Análisis",
  "family.stack.analysis.runs":
    "TORA calcula en el mismo proceso. RITA llama a su propio análisis. Ningún resultado inventado en producción.",
  "family.stack.automation": "Automatización",
  "family.stack.automation.runs":
    "Los modelos van por la pasarela de Vercel. La respuesta es una conjetura, no un hecho.",
  "family.stack.ops": "Operación y prueba",
  "family.stack.ops.runs":
    "Corre en Vercel. Pruebas contra Postgres 16. Sin AWS SDK en este sistema.",
  "family.link.identity.products":
    "Una sesión. Los productos no leen las listas de usuarios de los demás.",
  "family.link.identity.events":
    "Un inicio de sesión correcto se escribe en el registro. Es un recibo, no una tarea a seguir.",
  "family.link.tora.britt": "Solo cuando alguien publica. Leer el mercado no crea un evento.",
  "family.link.rita.britt":
    "BRITT recibe el nombre de la empresa, cuántos aciertos hubo y si hubo automatización. No las propuestas mismas — esas se quedan en RITA.",
  "family.link.irma.britt": "Acuerdo creado, abierto, confirmado o retirado.",
  "family.link.tyra.britt":
    "Un caso, un enlace de cliente o un recordatorio en cola. Una cola bloqueada no significa enviado.",
  "family.link.alva.britt":
    "Un caso está registrado. No sigue un diagnóstico hasta que esté cableado.",
  "family.link.creditae.britt":
    "Una contraparte está registrada, han escrito su conclusión, o el informe de la oficina llegó o se detuvo. No sigue una nota inventada.",
  "family.link.ekonomi.britt":
    "Una factura emitida, un cobro asentado o una captura de Revolut que no pasó.",
  "family.link.ekonomi.revolut":
    "El ciclo de vida de la conexión bancaria. Una renovación ordinaria se registra como operación, no como algo a seguir.",
  "family.link.ekonomi.invoice":
    "Un borrador aparece en el registro. Sin contabilidad hasta emitir.",
  "family.link.kansli.task":
    "Una tarea interna aparece en BRITT. Kansli sigue siendo dueño de la tarea.",
  "family.link.kansli.intake":
    "Ha llegado una solicitud, o se creó una cuenta de taller para la demo.",
  "family.link.britt.finding":
    "Los aciertos más importantes del análisis de ejemplo se vuelven cosas a seguir. El resto se queda en BRITT.",
  "family.link.britt.events": "Cada cosa a seguir también se escribe en la lista de eventos.",
  "family.blocked.rita":
    "El análisis de RITA debe estar cableado (en Vercel por URL, en local por el archivo del programa) antes de que puedan correr análisis.",
  "family.blocked.alva":
    "El diagnóstico guiado se cablea cuando esté listo. El caso ya se puede registrar.",
  "family.blocked.irma":
    "IRMA se queda con nosotros: una confirmación digital simple y su propio enlace. Aún no hay firma electrónica jurídica.",
  "family.blocked.britt":
    "Fortnox, Revolut y los perfiles de BRITT si el análisis de ejemplo ha de ser todo el producto.",
  "family.blocked.ekonomi":
    "Stripe, Revolut y Swish cuando quieran cobrar por esa vía. Una factura a 10 días funciona sin ellos.",
  "family.blocked.creditae":
    "CREDITAE va por el canal de crédito de la plataforma. Los productos no llaman a Creditsafe. Sin clave no se trae informe. La evaluación sigue siendo suya.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Cliente, coche, ruedas y qué sigue.",
  "tyra.heading": "¿Qué vehículo entra?",
  "tyra.lead":
    "TYRA mantiene juntos cliente, coche y ruedas. Los neumáticos se venden aquí — un clic asienta la factura en Ekonomi. Los importes son sus propias cifras. Aún no hay precios en vivo.",
  "tyra.customers": "Fichas de cliente",
  "tyra.integrations": "Integraciones",
  "tyra.signInTitle": "Inicie sesión para abrir casos",
  "tyra.signInBody": "La misma sesión que el resto de Pixdrift. Sin cuenta extra para el taller.",
  "tyra.notice":
    "Los recordatorios van a la cola pero aún no se envían — falta una conexión de SMS y correo. Sin precios de neumáticos en vivo.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Facturas, IVA y cómo entró el dinero.",
  "ekonomi.heading": "¿Qué está asentado?",
  "ekonomi.lead":
    "Asienten ventas en coronas. Un clic emite la factura. Las ofertas de TYRA que no están asentadas quedan en la cola. El cliente puede pagar con Swish, Stripe o una factura a 10 días. Conecten Revolut una vez y se traen extractos y se concilian cobros. Visma es la siguiente conexión — aún no está aquí.",
  "ekonomi.signInTitle": "Inicie sesión para ver el libro",
  "ekonomi.signInBody": "Los libros pertenecen a su empresa. Inicie sesión para verlos.",
  "ekonomi.notice":
    "Escriben coronas. El libro guarda öre. Cada comprobante cuadra. Los pagos solo corren de verdad cuando las conexiones están listas — nada se simula si no han dicho que sí.",
  "ekonomi.statements": "Extractos",
  "ekonomi.invoices": "Facturas",
  "ekonomi.vouchers": "Comprobantes",
  "ekonomi.reports": "Informes / IVA",
  "ekonomi.connections": "Conexiones",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Qué contrataciones puede tomar su empresa.",
  "tora.lead":
    "TORA muestra qué contrataciones puede ofertar {name} — y por qué ustedes. Aquí está toda la evaluación: requisitos, huecos y el siguiente paso.",
  "tora.noticeDemo":
    "Las contrataciones son ejemplos, no anuncios reales. La vista es una cuenta de pago, así que ven nombres, importes y requisitos. Los datos de empresa son la empresa de ejemplo hasta que guarden su propio perfil.",
  "tora.noticeSaved":
    "Las contrataciones son ejemplos, no anuncios reales. La vista es una cuenta de pago, así que ven nombres, importes y requisitos. Los datos de empresa son su perfil guardado ({name}).",
  "tora.calendar": "Calendario",
  "tora.current": "Actual",
  "tora.upcoming": "Próximo",
  "tora.watch": "Vigilancia",
  "tora.publishedValue": "Valor publicado",
  "tora.yourCompany": "Su empresa",
  "tora.profileLead":
    "Sin perfil guardado calculamos sobre la empresa de ejemplo en vez de sobre ustedes.",
  "tora.frameworks": "Acuerdos en los que ya están",
  "tora.references": "Referencias con las que TORA cuenta",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA busca ahorros fiscales en sus libros.",
  "rita.lead":
    "RITA busca ahorros fiscales en sus libros: deducciones, IVA, K10, pensión e I+D. Lo que RITA encuentra son propuestas para revisar más — no asesoría fiscal.",
  "rita.noticeReady":
    "El análisis está en marcha. Parte de la respuesta viene de un modelo y puede necesitar una segunda mirada.",
  "rita.noticeRules":
    "El análisis está en marcha, pero sin modelo ahora. Solo se usan las reglas fijas.",
  "rita.noticeBlocked":
    "El análisis aún no está cableado, así que los análisis nuevos se quedan bloqueados. Nunca mostramos resultados inventados.",
  "rita.noticeExample":
    "Las cuentas de ejemplo son un ejemplo integrado — no algo que subió un cliente.",
  "rita.signInTitle": "Inicie sesión para pedir un análisis",
  "rita.signInBody":
    "El análisis se guarda en RITA. BRITT recibe algo a seguir cuando un análisis termina o se detiene.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Lo que ocurrió y necesita seguimiento.",
  "britt.lead":
    "BRITT reúne cosas que necesitan seguimiento. Las cifras aquí son ejemplos — aún sin conexiones Fortnox o Revolut.",
  "britt.noticeDemo":
    "Las cifras aquí son ejemplos para la casa, no Fortnox y no una caja en vivo.",
  "britt.noticeOwn":
    "Aquí siguen sus propias observaciones. Las cifras de ejemplo solo corren en la casa.",
  "britt.signInTitle": "Inicie sesión para ver observaciones",
  "britt.signInBody":
    "Las observaciones pertenecen a su empresa. Lo que ocurre en TORA, RITA e IRMA aparece aquí.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Enviar un acuerdo, ver si está leído y confirmado.",
  "irma.heading": "¿Qué acuerdo debe salir?",
  "irma.lead":
    "Con IRMA envían acuerdos en digital: crear, enviar un enlace, ver cuándo la contraparte ha abierto y confirmado. La contraparte no necesita cuenta. Es una confirmación digital simple, no una firma electrónica jurídica. Aún no hay archivo de documentos.",
  "irma.signInTitle": "Inicie sesión para crear acuerdos",
  "irma.signInBody":
    "El enlace se muestra una vez — cópienlo al momento. No lo guardamos en forma legible.",
  "creditae.vendorScore": "Valor de la oficina",
  "creditae.vendorLimit": "Límite de la oficina",
  "creditae.vendorNotConclusion": "Esos son campos de la oficina, no su conclusión.",
  "creditae.vendorWhyMissing": "Por qué falta el informe",
  "creditae.notes": "Nota",
  "creditae.yourAssessment": "Su evaluación",
  "creditae.conclusion": "Conclusión",
};

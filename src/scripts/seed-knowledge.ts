/**
 * Script para poblar la base de conocimiento médico en pgvector.
 * Ejecutar una sola vez (o cuando se quieran actualizar los protocolos):
 *
 *   npx tsx src/scripts/seed-knowledge.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { openAIService } from "../services/openai.service";
import { vectorService } from "../services/vector.service";
import { KnowledgeChunk } from "../models/types";

const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    category: "emergencias",
    source: "Cruz Roja / OMS",
    content: `SEÑALES DE ALARMA QUE REQUIEREN LLAMAR A EMERGENCIAS DE INMEDIATO:
• Dolor de pecho opresivo, especialmente si irradia al brazo izquierdo, mandíbula o espalda
• Dificultad para respirar severa o de inicio súbito
• Pérdida de conciencia o desmayo prolongado (más de 1-2 minutos)
• Convulsiones sin antecedente conocido o que duran más de 5 minutos
• Sangrado que no cede con 10 minutos de presión directa
• Signos de ACV (FAST): asimetría facial, brazo que cae, habla confusa, tiempo = urgencia
• Reacción alérgica severa: hinchazón de garganta, dificultad para respirar, urticaria generalizada
• Intoxicación con medicamentos, sustancias o venenos
• Trauma en cabeza con pérdida de conciencia o desorientación
• Quemaduras en cara, manos, genitales o más del 10% del cuerpo
• Herida penetrante en tórax o abdomen
• Temperatura corporal >40°C que no cede o <35°C (hipotermia)
Número de emergencias: 123 (Colombia), 112 (Europa), 911 (USA/México)`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / American Heart Association",
    content: `RCP (REANIMACIÓN CARDIOPULMONAR) — ADULTOS:
Indicación: persona inconsciente que no respira o respira de forma anormal (jadeos).

Pasos:
1. Verificar que la escena sea segura antes de acercarse
2. Golpear suavemente los hombros y preguntar: "¿Estás bien?"
3. Si no responde: pedir a alguien que llame a emergencias Y traiga un DEA si hay uno cerca
4. Posicionar a la persona boca arriba sobre superficie firme
5. Manos entrelazadas en el centro del pecho (sobre el esternón)
6. Dar 30 compresiones firmes: 5-6 cm de profundidad, ritmo de 100-120 por minuto
   (equivale al ritmo de la canción "Stayin' Alive")
7. Si está entrenado: 2 respiraciones de rescate después de cada 30 compresiones
8. Si no está entrenado: solo compresiones continuas sin pausas
9. Continuar hasta que llegue ayuda, el paciente responda o un DEA esté listo

RCP EN NIÑOS (1-8 años): misma secuencia, pero usando solo una mano o dos dedos en bebés,
compresiones de 4 cm de profundidad, frecuencia 100-120/min.

DEA (Desfibrilador): encenderlo, seguir las instrucciones de voz, aplicar parches como indique.`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja",
    content: `ATRAGANTAMIENTO — MANIOBRA DE HEIMLICH:

ADULTOS Y NIÑOS MAYORES DE 1 AÑO:
• Si puede toser, hablar o respirar: animar a toser fuerte, NO intervenir
• Si NO puede toser, hablar ni respirar (obstrucción total):
  1. Ponerse detrás de la persona
  2. Dar 5 golpes firmes entre los omóplatos con el talón de la mano
  3. Luego 5 compresiones abdominales: puño cerrado sobre el ombligo, tirando hacia arriba y adentro
  4. Alternar 5 golpes y 5 compresiones hasta que el objeto salga
  5. Si pierde la conciencia: iniciar RCP de inmediato

BEBÉS MENORES DE 1 AÑO:
• 5 golpes en la espalda (boca abajo sobre el antebrazo)
• 5 compresiones en el pecho (boca arriba, dos dedos sobre el esternón)
• NUNCA compresiones abdominales en bebés

PERSONA SOLA QUE SE ATRAGANTA:
• Llamar a emergencias primero si puede
• Autoaplicar compresiones abdominales o lanzarse sobre el respaldo de una silla`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / OMS",
    content: `CONTROL DE HEMORRAGIAS:

HEMORRAGIA EXTERNA LEVE-MODERADA:
1. Lavarse las manos o usar guantes si es posible
2. Aplicar presión directa con un paño limpio o apósito estéril
3. Mantener presión constante durante MÍNIMO 10 minutos sin soltar ni revisar
4. Elevar la extremidad por encima del nivel del corazón si es posible
5. Si el apósito se empapa, agregar otro encima sin retirar el primero
6. Si cede el sangrado: cubrir con apósito y asegurar con venda

HEMORRAGIA GRAVE (no cede en 10 min o arteria comprometida):
• Llamar a emergencias de inmediato
• Continuar presión directa constante
• Torniquete solo si hay riesgo de vida y hemorragia incontrolable en extremidad:
  — Colocar 5-7 cm por encima de la herida
  — Apretar hasta que cese el sangrado
  — Anotar la hora de colocación
  — NO retirar: solo personal médico lo hace

OBJETO INCRUSTADO: NO retirarlo, inmovilizarlo y cubrir con apósito alrededor

HEMORRAGIA INTERNA (sin herida visible): síntomas = dolor abdominal, piel pálida y fría,
pulso débil y rápido → emergencias inmediato, acostar al paciente con piernas elevadas`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / OMS",
    content: `QUEMADURAS — CLASIFICACIÓN Y MANEJO:

PRIMER GRADO (piel roja, sin ampollas, sin piel abierta):
• Enfriar con agua fresca corriente durante 10-20 minutos
• NO usar hielo, mantequilla, cremas ni pasta dental
• Cubrir con apósito limpio no adherente
• Paracetamol o ibuprofeno para el dolor si no hay contraindicaciones

SEGUNDO GRADO (ampollas, piel muy roja y dolorosa):
• Enfriar con agua fresca 10-20 minutos
• NO reventar las ampollas (protegen de infección)
• NO aplicar ninguna crema casera
• Cubrir con apósito húmedo y limpio
• Ir a urgencias si el área supera el tamaño de la palma de la mano

TERCER GRADO (piel carbonizada o blanquecina, sin dolor por daño de nervios):
• Llamar a emergencias de inmediato
• NO enfriar extensamente (riesgo de hipotermia)
• Cubrir con sábana limpia, no adherente
• NO retirar ropa pegada a la piel

IR A URGENCIAS SIEMPRE SI:
• Quemadura en cara, manos, pies, genitales o articulaciones
• Quemadura por electricidad o químicos
• Área mayor al 10% del cuerpo (palma de la mano = ~1%)
• Niños, adultos mayores o personas con enfermedades crónicas`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja",
    content: `FRACTURAS Y ESGUINCES:

SEÑALES DE FRACTURA: dolor intenso, deformidad visible, inflamación, incapacidad de mover,
crepitación (sonido de huesos al moverse), hematoma.

MANEJO GENERAL:
1. NO intentar alinear o mover el hueso fracturado
2. Inmovilizar la extremidad en la posición en que se encuentre
3. Entablillar usando materiales rígidos (periódico, cartón, tabla) forrados con ropa
4. Asegurar la entablilla arriba y abajo del punto de fractura
5. Aplicar frío (no directo sobre la piel) para reducir inflamación
6. Elevar la extremidad si es posible y no causa dolor adicional

FRACTURA DE COLUMNA (caída de altura, accidente de tráfico, trauma en cuello o espalda):
• NO mover al paciente bajo ninguna circunstancia hasta que llegue emergencias
• Si debe respirar artificialmente, mover solo la cabeza con precaución extrema
• Hablarle para mantenerlo tranquilo

FRACTURA ABIERTA (hueso visible o herida cerca de la fractura):
• Cubrir la herida con gasa húmeda estéril
• No intentar reinsertar el hueso
• Ir a urgencias de inmediato — riesgo de infección grave

ESGUINCE (ligamento): PRICE — Protección, Reposo, Hielo, Compresión, Elevación.
Si el dolor es severo o no puede apoyar: radiografía para descartar fractura.`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / OMS",
    content: `PÉRDIDA DE CONCIENCIA Y DESMAYO:

DESMAYO SIMPLE (síncope vasovagal — causa más común):
• Señales antes: palidez, sudoración, mareo, visión borrosa, náuseas
• Acción INMEDIATA: acostarlo y elevar las piernas (aumenta flujo sanguíneo al cerebro)
• Si está consciente: no dar nada de comer ni beber hasta que esté completamente recuperado
• Aflojar ropa ajustada (corbata, cinturón, cuello)
• La mayoría recupera en 1-2 minutos

PERSONA INCONSCIENTE QUE RESPIRA:
• Posición de recuperación lateral: acostado de lado, brazo inferior extendido,
  pierna superior doblada — evita que se ahogue con vómito
• No dar nada por la boca
• Monitorear respiración constantemente
• Llamar a emergencias si no recupera en 2 minutos

PERSONA INCONSCIENTE QUE NO RESPIRA:
• Iniciar RCP inmediatamente
• Llamar a emergencias

LLAMAR A EMERGENCIAS SIEMPRE SI:
• No recupera la conciencia en 2 minutos
• Tiene convulsiones antes o después del desmayo
• Hay dolor de pecho, palpitaciones o dificultad respiratoria antes del episodio
• Persona mayor de 50 años o con enfermedades cardíacas
• Se golpeó la cabeza al caer`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / OMS",
    content: `CONVULSIONES:

QUÉ HACER DURANTE LA CONVULSIÓN:
1. Mantener la calma — la mayoría dura menos de 3 minutos
2. Proteger la cabeza: poner algo blando debajo (ropa doblada, mochila)
3. Alejar objetos peligrosos del entorno
4. NO sujetar al paciente ni intentar detener los movimientos
5. NO meter nada en la boca (lengua NO se traga, pero sí puede morder dedos)
6. NO dar agua ni medicamentos durante la convulsión

DESPUÉS DE LA CONVULSIÓN:
• Posición lateral de recuperación (de lado)
• El paciente estará confuso y cansado: es normal, se llama "período postictal"
• Hablarle con calma mientras recupera la consciencia
• Revisar si hay heridas por la caída

LLAMAR A EMERGENCIAS SI:
• La convulsión dura más de 5 minutos (status epilepticus — emergencia)
• Hay 2 o más convulsiones seguidas sin recuperar conciencia entre ellas
• No tiene antecedente epiléptico conocido
• La persona no recupera la conciencia después de la convulsión
• Hay dificultad respiratoria después
• Es mujer embarazada (posible eclampsia)
• Ocurrió en el agua (riesgo de ahogamiento)

EPILEPSIA CONOCIDA: si el paciente tiene su medicación de rescate (diazepam rectal
o midazolam intranasal) y convulsiona más de 5 min, aplicar según indicación médica previa.`,
  },

  {
    category: "alergias_anafilaxia",
    source: "Cruz Roja / EAACI",
    content: `ANAFILAXIA — EMERGENCIA GRAVE:
CRITICO: los antihistaminicos solos NO tratan la anafilaxia — son demasiado lentos y no revierten el cierre de via aerea. La unica medicacion efectiva es la epinefrina (adrenalina).

SEÑALES: hinchazón de cara, labios, lengua o garganta, dificultad para respirar, sibilancias, urticaria generalizada combinada con sintomas respiratorios o cardiovasculares, caida de presion arterial, perdida de conciencia.

ACCION INMEDIATA:
1. Llamar al 123 de inmediato — poner en altavoz si esta solo
2. Si tiene autoinyector de epinefrina (EpiPen): inyectar en musculo externo del muslo (puede ser sobre la ropa), mantener 10 segundos. Este es el paso mas importante.
3. Acostar con piernas elevadas — NO sentado ni de pie (riesgo de muerte subita por caida de presion)
4. Segunda dosis de epinefrina a los 5-15 minutos si no mejora
5. Si pierde la conciencia y no respira: RCP

REACCION ALERGICA LEVE (picazon localizada, urticaria pequeña, sin sintomas sistemicos):
• Retirar el alergeno
• Antihistaminico oral si no hay contraindicaciones
• Observar 1-2 horas — si aparece hinchazón en cara o garganta: escalar a CRITICO

REACCION MODERADA (urticaria extensa, nauseas, sin compromiso respiratorio):
• Antihistaminico + corticoide oral si fue prescrito
• Ir a urgencias si no mejora en 30 minutos`,
  },

  {
    category: "emergencias_cardiovasculares",
    source: "AHA / ESC",
    content: `DOLOR DE PECHO — EVALUACIÓN Y MANEJO:

SEÑALES DE ALARMA (posible infarto o angina inestable):
• Dolor opresivo, aplastante o de "elefante en el pecho"
• Dolor que irradia al brazo izquierdo, mandíbula, cuello o espalda
• Sudoración fría, náuseas, palidez
• Sensación de muerte inminente
• Dificultad para respirar asociada

SI SOSPECHA INFARTO:
1. Llamar a emergencias INMEDIATAMENTE — no esperar a ver si pasa
2. Sentar al paciente en posición cómoda (semisentado)
3. Aflojar ropa ajustada
4. Si el paciente NO es alérgico a aspirina y no tiene contraindicación conocida:
   aspirina 300mg masticada (NO tragada entera) — solo si hay alta sospecha de infarto
5. Si tiene nitroglicerina prescrita por su médico: seguir el protocolo indicado por el médico
6. Si pierde la conciencia y no respira: RCP

NO HACER:
• No darle nada de comer ni beber
• No dejarlo caminar solo
• No esperar más de 15 minutos para llamar a emergencias si el dolor persiste

DOLOR ATÍPICO (puntada al respirar, al palpar, mejora con antiácidos):
Puede ser musculoesquelético o gástrico — aun así consultar médico si es la primera vez.`,
  },

  {
    category: "emergencias_neurologicas",
    source: "AHA / ESO",
    content: `ACV (ACCIDENTE CEREBROVASCULAR / DERRAME CEREBRAL):

EVALUACIÓN RÁPIDA — PROTOCOLO FAST:
• F (Face/Cara): pedir que sonría. ¿Un lado cae o está asimétrico?
• A (Arms/Brazos): pedir que levante ambos brazos. ¿Uno cae?
• S (Speech/Habla): pedir que repita una frase simple. ¿Está confuso o no puede hablar?
• T (Time/Tiempo): si cualquiera de lo anterior → LLAMAR EMERGENCIAS YA

Otros síntomas: visión borrosa en uno o ambos ojos, confusión súbita,
dolor de cabeza repentino e intenso "el peor de mi vida", mareo severo.

ACCIÓN INMEDIATA:
1. Llamar a emergencias de inmediato — cada minuto sin tratamiento = ~2 millones de neuronas
2. Anotar la hora exacta en que comenzaron los síntomas (crítico para el tratamiento)
3. Acostar al paciente cómodamente, cabeza ligeramente elevada
4. NO dar nada por la boca
5. NO administrar aspirina sin indicación médica (algunos ACV son hemorrágicos)
6. Si pierde la conciencia: posición lateral de recuperación
7. Si no respira: RCP

EL TIEMPO ES CEREBRO: la ventana de tratamiento con trombolíticos es de 4.5 horas.
No esperar a que "pase solo".`,
  },

  {
    category: "endocrinologia_emergencias",
    source: "ADA / Federación Internacional de Diabetes",
    content: `HIPOGLUCEMIA (AZÚCAR BAJA EN SANGRE):

DEFINICIÓN: glucosa <70 mg/dL. Más frecuente en personas con diabetes que usan insulina
o sulfonilureas. También puede ocurrir por ayuno prolongado, ejercicio excesivo o alcohol.

SÍNTOMAS LEVES-MODERADOS:
• Temblor, sudoración fría, palpitaciones, mareo
• Hambre súbita, irritabilidad, dificultad para concentrarse
• Palidez, hormigueo en labios

SÍNTOMAS GRAVES:
• Confusión, habla incoherente, comportamiento extraño
• Pérdida de conciencia, convulsiones

MANEJO — PACIENTE CONSCIENTE Y PUEDE TRAGAR:
Regla 15-15:
1. Dar 15g de carbohidratos de acción rápida:
   • 3-4 sobres de azúcar en agua
   • 150ml de jugo de frutas o gaseosa regular (no diet)
   • 4 caramelos de glucosa
2. Esperar 15 minutos
3. Medir glucosa: si sigue <70mg/dL, repetir
4. Cuando la glucosa normalice: dar un snack con carbohidrato complejo

MANEJO — PACIENTE INCONSCIENTE O NO PUEDE TRAGAR:
• NO dar nada por la boca (riesgo de aspiración)
• Llamar a emergencias inmediatamente
• Si hay glucagón disponible: inyectar según indicación
• Posición lateral de recuperación

IMPORTANTE PARA DIABÉTICOS: nunca suspender la insulina durante una hipoglucemia,
el problema es la falta de azúcar, no el exceso de insulina. Ajustar con el médico después.`,
  },

  {
    category: "respiratorio_emergencias",
    source: "GINA / OMS",
    content: `CRISIS ASMÁTICA:

SÍNTOMAS: falta de aire, sibilancias (silbidos al respirar), tos seca,
sensación de opresión en el pecho, dificultad para hablar oraciones completas.

LEVE-MODERADA (puede hablar frases completas, SpO2 >94%):
1. Sentar al paciente erguido o ligeramente inclinado hacia adelante
2. Aflojar ropa ajustada
3. Aplicar broncodilatador de rescate: salbutamol (Ventolin) 2-4 puffs
   — usando cámara espaciadora si está disponible
   — esperar 20 minutos y repetir si es necesario
4. Si no mejora con 2 dosis: ir a urgencias

GRAVE (no puede hablar más que palabras, respiración muy rápida, uso de músculos
del cuello y entre costillas, labios azulados):
1. Llamar a emergencias de inmediato
2. Continuar con broncodilatador cada 20 minutos mientras llega la ayuda
3. Si tiene corticoide oral prescrito como plan de acción: tomarlo
4. No acostar al paciente — posición sentada es crucial

LLAMAR EMERGENCIAS INMEDIATAMENTE SI:
• No mejora con 2-3 dosis de broncodilatador
• Hay cianosis (labios o dedos azules)
• Paciente no puede hablar
• Primera crisis asmática sin diagnóstico previo`,
  },

  {
    category: "cardiovascular_cronica",
    source: "ESH / ESC",
    content: `CRISIS HIPERTENSIVA:

PRESIÓN ARTERIAL ALTA AISLADA (sin síntomas):
• PA entre 180/110 y 180/120 sin síntomas adicionales
• Acción: reposo, no actividad física, tomar medicación habitual si el médico lo indicó
• Consultar al médico en las próximas horas
• No tomar medicamentos ajenos para bajar la presión

URGENCIA HIPERTENSIVA (síntomas leves):
• PA >180/120 + dolor de cabeza, zumbidos, visión borrosa
• Acción: consultar urgencias — puede requerir medicación oral
• No bajar la presión demasiado rápido (riesgo de ACV paradójico)

EMERGENCIA HIPERTENSIVA — LLAMAR A EMERGENCIAS:
Señales que indican daño a órgano blanco:
• Dolor de pecho + PA muy alta → posible síndrome coronario
• Déficit neurológico + PA alta → posible ACV
• Dificultad respiratoria severa + PA alta → posible edema pulmonar
• Pérdida de visión + PA alta → posible emergencia oftálmica
• Embarazada con PA alta + cefalea + edema → preeclampsia/eclampsia

NUNCA: no administrar medicamentos de otros pacientes hipertensos, no suspender
bruscamente medicación antihipertensiva sin indicación médica.`,
  },

  {
    category: "toxicologia",
    source: "OMS / Centros Antiveneno",
    content: `INTOXICACIÓN Y SOBREDOSIS:

PRINCIPIOS GENERALES:
• NO inducir vómito salvo indicación explícita del centro antiveneno o médico
  (algunos tóxicos causan más daño al regresar por el esófago)
• Llamar al centro antiveneno o emergencias médicas
• Guardar el envase, la sustancia o una muestra del vómito para mostrarlo al médico

SOBREDOSIS DE MEDICAMENTOS:
1. Llamar a emergencias o centro antiveneno
2. Anotar qué tomó, cuánto y hace cuánto tiempo
3. Si está inconsciente: posición lateral de recuperación
4. Si no respira: RCP

INTOXICACIÓN POR QUÍMICOS O GASES:
• Alejar a la persona del ambiente tóxico (protegerse también)
• Aire fresco / ventilación
• Si hay contacto con la piel: retirar ropa contaminada y lavar con agua abundante 15 min
• Si hay contacto con los ojos: lavar con agua limpia 15 minutos

INGESTA DE CÁUSTICOS (ácidos o bases fuertes — lejía, soda cáustica):
• NO inducir vómito
• NO dar leche, neutralizantes caseros
• Ir a urgencias inmediatamente

SEÑALES DE SOBREDOSIS GRAVE:
• Conciencia alterada, pupilas puntiformes (opiáceos) o dilatadas (estimulantes)
• Convulsiones, temperatura corporal extrema
• Ritmo cardíaco irregular, presión arterial muy baja`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja",
    content: `QUEMADURAS ELÉCTRICAS Y ELECTROCUCIÓN:

PELIGRO: el rescatador puede electrocutarse. NUNCA tocar a la víctima si sigue en contacto
con la fuente eléctrica.

PASOS:
1. Cortar la corriente eléctrica (disyuntor, interruptor) — NO tocar cables con las manos
2. Si no se puede cortar la corriente: alejar a la víctima usando material no conductor
   (madera seca, plástico, tela gruesa seca) — NUNCA metal ni material húmedo
3. Llamar a emergencias de inmediato
4. Si la persona no responde y no respira: iniciar RCP
5. Las quemaduras eléctricas tienen punto de entrada y salida — el daño interno puede ser
   mucho mayor de lo que se ve externamente

SIEMPRE IR A URGENCIAS aunque parezca leve:
• Puede haber daño cardíaco, muscular o renal no visible
• Riesgo de arritmia cardíaca tardía`,
  },

  {
    category: "emergencias_ambientales",
    source: "Cruz Roja / CDC",
    content: `GOLPE DE CALOR E INSOLACIÓN:

AGOTAMIENTO POR CALOR (forma leve):
Síntomas: sudoración excesiva, piel fría y húmeda, debilidad, mareo, náuseas, cefalea.
Manejo:
• Llevar a lugar fresco o sombreado
• Aflojar ropa
• Dar agua fresca en sorbos pequeños (si está consciente)
• Compresas frías en cuello, axilas y muñecas
• Reposo mínimo 1 hora

GOLPE DE CALOR (emergencia grave):
Síntomas: temperatura corporal >40°C, piel caliente, SECA y roja (sudoración ausente),
confusión, agitación, pérdida de conciencia.

1. Llamar a emergencias de inmediato
2. Enfriar activamente al paciente: ropa mojada con agua fría, ventiladores, hielo en
   axilas, ingles y cuello
3. NO dar nada por la boca si está confuso o inconsciente
4. Monitorear temperatura — objetivo: bajar a 38°C

HIPOTERMIA (temperatura <35°C):
Síntomas: escalofríos intensos, confusión, habla pastosa, piel azulada.
• Mover a lugar cálido, retirar ropa mojada
• Cubrir con mantas (incluida la cabeza)
• Bebidas calientes NO alcohólicas si está consciente
• Emergencias si temperatura <32°C o pérdida de conciencia`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / OPS",
    content: `PICADURAS Y MORDEDURAS:

PICADURA DE ABEJA / AVISPA:
• Retirar el aguijón raspando (no pellizcar — libera más veneno)
• Lavar con agua y jabón
• Frío local para reducir inflamación
• Antihistamínico oral para el prurito
• URGENCIAS si aparecen síntomas de anafilaxia (ver protocolo de reacción alérgica)

MORDEDURA DE SERPIENTE:
• Alejar a la persona de la serpiente, no intentar capturarla
• Inmovilizar la extremidad afectada por debajo del nivel del corazón
• Retirar anillos, relojes y ropa ajustada cerca de la mordedura
• Trasladar a urgencias lo más rápido posible
• NO hacer torniquetes, NO succionar el veneno, NO hacer incisiones

MORDEDURA DE PERRO U OTRO ANIMAL:
• Lavar abundantemente con agua y jabón por 5-10 minutos
• Aplicar antiséptico
• Ir al médico para evaluar vacuna antirrábica y antitetánica
• Si el animal es desconocido: tratamiento antirrábico siempre

PICADURA DE ARAÑA VIUDA NEGRA O LOXOSCELES (araña violinista):
• Lavar la herida, frío local
• Ir a urgencias — puede requerir suero antiofídico`,
  },

  {
    category: "ginecologia_obstetricia",
    source: "OMS / FIGO",
    content: `PARTO DE EMERGENCIA (cuando no hay tiempo de llegar al hospital):

1. Llamar a emergencias de inmediato — mantener la línea activa
2. Preparar el ambiente: superficie limpia, toallas limpias, agua tibia
3. Lavarse las manos con agua y jabón

DURANTE EL PARTO:
• NO jalar al bebé — dejar que salga solo siguiendo las contracciones
• Guiar suavemente la cabeza cuando aparezca, SIN tirar
• Si el cordón está alrededor del cuello: deslizarlo suavemente por encima de la cabeza
• Para los hombros: inclinar suavemente hacia abajo para sacar el hombro superior, luego hacia arriba

DESPUÉS DEL NACIMIENTO:
• Secar al bebé inmediatamente con tela limpia y cubrirlo (evitar hipotermia)
• Si no llora: frotar suavemente la espalda
• NO cortar el cordón umbilical a menos que haya indicación médica y material estéril
• Colocar al bebé en contacto piel con piel con la madre
• La placenta saldrá sola en 5-30 minutos — no jalarla

HEMORRAGIA POSTPARTO: masajear el abdomen de la madre y amamantar al bebé si es posible
(estimula contracción uterina). Emergencias si el sangrado es abundante.`,
  },

  {
    category: "endocrinologia_emergencias",
    source: "ADA / IDF",
    content: `MANEJO DE CRISIS DIABÉTICAS:

HIPOGLUCEMIA (glucosa <70 mg/dL) — ya detallada en protocolo hipoglucemia.

HIPERGLUCEMIA MODERADA (glucosa 200-350 mg/dL, paciente consciente):
• Hidratación con agua (no jugos ni bebidas azucaradas)
• Tomar medicación habitual si el médico lo indicó
• Monitorear glucosa cada 1-2 horas
• Consultar médico si no baja o si hay síntomas (náuseas, vómito)

CETOACIDOSIS DIABÉTICA (CAD) — Emergencia:
Señales: glucosa muy alta (>300), náuseas, vómito, dolor abdominal, respiración rápida
y profunda (respiración de Kussmaul), aliento con olor a frutas, confusión o somnolencia.
• Llamar a emergencias
• Hidratación oral si puede tragar y está consciente
• NO suspender insulina — puede requerir ajuste

ESTADO HIPEROSMOLAR HIPERGLUCÉMICO (EHH):
Más frecuente en diabetes tipo 2: glucosa muy alta (>600), deshidratación extrema, confusión.
• Emergencias inmediato
• Hidratación oral si consciente mientras llega la ayuda

GENERAL PARA CUALQUIER ENFERMEDAD AGUDA EN DIABÉTICO:
• Monitorear glucosa con mayor frecuencia
• NO suspender insulina aunque no coma
• Mantenerse hidratado`,
  },

  {
    category: "salud_mental_emergencias",
    source: "OPS / OMS",
    content: `CRISIS DE SALUD MENTAL — PRIMEROS AUXILIOS PSICOLÓGICOS:

ATAQUE DE PÁNICO (muy frecuente, no es una emergencia médica grave pero se siente así):
Síntomas: corazón acelerado, dificultad para respirar, mareo, sensación de muerte inminente.
Duran 5-20 minutos y se resuelven solos.
• Hablar con calma: "Esto va a pasar, estás a salvo"
• Técnica de respiración: inhalar 4 segundos, sostener 4, exhalar 6
• Técnica 5-4-3-2-1: nombrar 5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que saboreas
• No dejar sola a la persona hasta que esté estabilizada

CRISIS SUICIDA:
• No dejar a la persona sola
• Preguntar directamente: "¿Estás pensando en hacerte daño o en quitarte la vida?"
  (preguntar NO aumenta el riesgo, al contrario)
• Escuchar sin juzgar
• Retirar del entorno inmediato objetos peligrosos
• Llamar a línea de crisis o emergencias si hay plan concreto o acceso a medios
• Línea de crisis Colombia: 106

AGITACIÓN PSICOMOTORA SEVERA:
• Mantener distancia segura
• Hablar con calma, voz baja, sin movimientos bruscos
• Llamar a emergencias si hay riesgo para el paciente o terceros`,
  },

  {
    category: "farmacologia_contraindicaciones",
    source: "INVIMA / FDA / EMA",
    content: `CONTRAINDICACIONES Y ALERTAS DE MEDICAMENTOS DE USO COMÚN:

IBUPROFENO Y AINEs (naproxeno, diclofenaco):
CONTRAINDICADO en: hipertensión arterial no controlada, insuficiencia renal (cualquier grado),
úlcera péptica activa, tercer trimestre de embarazo, personas que toman anticoagulantes (warfarina,
heparina), antecedente de sangrado gastrointestinal, insuficiencia cardíaca.
PRECAUCIÓN en: asma (puede desencadenar broncoespasmo en sensibles), adultos mayores,
pacientes con uso crónico de corticosteroides.

ASPIRINA:
CONTRAINDICADA en: menores de 16 años (síndrome de Reye), personas con anticoagulantes,
úlcera péptica activa, alergia conocida a AINEs.
Uso en infarto: 300mg masticada una sola vez en sospecha de síndrome coronario agudo.

PARACETAMOL (acetaminofén):
Relativamente seguro. PELIGROSO si: dosis >4g/día en adultos, uso combinado con alcohol
frecuente, hepatopatía crónica, desnutrición severa.
Dosis en niños: 10-15mg por kg de peso, máximo cada 6 horas.

ANTIHISTAMÍNICOS (loratadina, cetirizina, difenhidramina):
Producen somnolencia especialmente difenhidramina — no conducir.
No usar difenhidramina en adultos mayores (confusión, retención urinaria).

WARFARINA / ACENOCUMAROL (anticoagulantes orales):
Interacciona con: aspirina, ibuprofeno, antibióticos, alimentos ricos en vitamina K (espinaca),
alcohol. Cualquier cambio en dieta o medicación puede alterar el INR. Nunca automedicar.

METFORMINA: suspender 48h antes de procedimientos con contraste yodado (riesgo renal).`,
  },

  {
    category: "poblaciones_especiales",
    source: "OMS / Protocolos Pediátricos / Geriatría",
    content: `CONSIDERACIONES ESPECIALES POR GRUPO DE POBLACIÓN:

EMBARAZADAS:
• Evitar: ibuprofeno y AINEs (especialmente tercer trimestre), aspirina en dosis altas,
  muchos antibióticos (tetraciclinas, fluoroquinolonas, aminoglucósidos)
• Paracetamol: generalmente seguro en dosis estándar
• Cualquier sangrado vaginal, dolor abdominal intenso o dolor de cabeza severo = urgencias
• Fiebre >38°C = consultar médico (no esperar)
• Hipertensión en embarazo + cefalea + edema = sospecha de preeclampsia → urgencias inmediato

NIÑOS:
• Dosis siempre por peso corporal, nunca por la edad solamente
• NUNCA aspirina en menores de 16 años (síndrome de Reye)
• Fiebre >38°C en menores de 3 meses = urgencias siempre
• Fiebre en niños no es peligrosa por sí sola, pero hay que evaluar la causa
• Deshidratación en niños: señales = llanto sin lágrimas, boca seca, sin orina en 6 horas
• Cuerpo extraño en nariz u oído: NO intentar extraerlo, ir al médico

ADULTOS MAYORES (+65 años):
• Mayor sensibilidad a medicamentos: efectos secundarios más pronunciados
• Riesgo aumentado de caídas: primer causa de traumatismo en este grupo
• Deshidratación silenciosa: no sienten tanta sed
• Fiebre puede estar ausente aun con infección grave
• Mayor riesgo de confusión súbita (delirium) como señal de enfermedad aguda

PERSONAS CON INSUFICIENCIA RENAL:
• Evitar: ibuprofeno, naproxeno, metamizol en dosis altas, algunos antibióticos
• Contraste yodado puede empeorar la función renal
• Hidratación cuidadosa: ni exceso ni déficit`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja",
    content: `HERIDAS — CLASIFICACIÓN Y CUIDADO:

HERIDA SUPERFICIAL (abrasión, rasguño):
1. Lavar con agua corriente y jabón por 5 minutos
2. Retirar suciedad visible con gasa limpia (no algodón)
3. Aplicar antiséptico (povidona yodada, clorhexidina)
4. Cubrir con apósito si es necesario
5. Cambiar apósito diariamente y observar signos de infección

HERIDA PROFUNDA / CORTANTE:
1. Control de hemorragia: presión directa 10 minutos
2. NO explorar la herida ni retirar objetos incrustados
3. Cubrir con gasa estéril
4. Ir a urgencias: puede requerir sutura
5. Actualizar vacuna antitetánica (si hace más de 5 años)

SIGNOS DE INFECCIÓN (consultar médico):
• Enrojecimiento que se extiende, calor local
• Pus o secreción amarilla/verde
• Fiebre >38°C
• Líneas rojas desde la herida (señal de linfangitis → urgencias)
• Herida que no mejora en 48-72 horas

MORDEDURA HUMANA: considerar siempre potencialmente infectada, lavar abundantemente,
ir al médico — puede requerir antibióticos profilácticos.`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / Academia Americana de Oftalmología",
    content: `LESIONES OCULARES:

CUERPO EXTRAÑO EN EL OJO (polvo, arena, pestaña):
• NO frotar el ojo — puede causar más daño
• Parpadear repetidamente para intentar que las lágrimas lo arrastren
• Lavar con agua limpia o solución salina: verter suavemente desde el lagrimal hacia afuera
• Si no sale en 5 minutos: cubrir el ojo con apósito limpio e ir al oftalmólogo
• NUNCA intentar retirar con objetos (mondadientes, esquinas de tela, uñas)

OBJETO INCRUSTADO EN EL OJO:
• NO intentar retirarlo
• Cubrir ambos ojos (el ojo sano también, para evitar movimientos oculares sincronizados)
• Ir a urgencias de inmediato

QUEMADURA QUÍMICA EN EL OJO:
• Lavar con abundante agua corriente durante MÍNIMO 15-20 minutos
• Mantener el párpado abierto durante el lavado (puede requerir ayuda)
• No perder tiempo buscando antídoto — el agua inmediata es lo más importante
• Ir a urgencias inmediatamente después del lavado
• Ácidos: lavado abundante. Bases (lejía, cal): lavado muy prolongado (el daño continúa)

GOLPE EN EL OJO (trauma contuso):
• Frío local sin presión directa sobre el globo ocular
• Ir al médico si hay: visión borrosa, doble o pérdida de visión, ojo rojo intenso, pupila irregular
• NUNCA presionar el ojo traumatizado`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / Academia Americana de Odontología de Emergencia",
    content: `EMERGENCIAS DENTALES:

DIENTE PERMANENTE AVULSIONADO (diente adulto que se cae por trauma):
TIEMPO CRÍTICO: reimplante exitoso si se hace en menos de 30-60 minutos.
1. Sostener el diente por la corona (parte blanca), NO por la raíz
2. Si está sucio: enjuagar SUAVEMENTE con leche o agua — no frotar ni limpiar la raíz
3. Intentar recolocar el diente en el alvéolo (hueco) y pedir al paciente que muerda suavemente
   una gasa o paño limpio para mantenerlo en posición
4. Si no es posible recolocarlo: transportarlo en leche entera, saliva del paciente o suero fisiológico
   — NUNCA en agua sola (destruye las células del ligamento)
5. Ir al dentista/urgencias DE INMEDIATO
NOTA: dientes de leche (infantiles) NO se reimplantan

DOLOR DENTAL AGUDO:
• Paracetamol o ibuprofeno (según tolerancia y contraindicaciones)
• Clavo de olor (eugenol) aplicado con algodón puede aliviar temporalmente
• No aplicar aspirina directamente sobre la encía (quema el tejido)
• Consultar dentista pronto — el dolor dental no desaparece solo y puede indicar absceso

ABSCESO DENTAL (hinchazón, fiebre, dolor intenso pulsátil):
• Puede ser una infección grave con riesgo de diseminación
• Urgencias si: fiebre alta, dificultad para abrir la boca, dificultad para tragar o respirar
• Antibióticos solo con prescripción médica/dental`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja",
    content: `EPISTAXIS (SANGRADO DE NARIZ):

MANEJO CORRECTO:
1. Sentar a la persona inclinada HACIA ADELANTE (no hacia atrás — evita tragar sangre)
2. Comprimir las aletas nasales (parte blanda de la nariz) con los dedos durante 10-15 minutos
   sin soltar para verificar
3. Respirar por la boca durante la compresión
4. Aplicar frío en el puente de la nariz si está disponible
5. Después de 15 minutos: soltar suavemente y verificar si cedió

NO HACER:
• No inclinar la cabeza hacia atrás (la sangre va al estómago y puede provocar vómito)
• No meter algodón apretado ni telas que se adhieran
• No sonarse la nariz inmediatamente después

IR A URGENCIAS SI:
• El sangrado no cede después de 20-30 minutos de presión
• La sangre sale también por la boca en cantidad
• El paciente toma anticoagulantes (warfarina, clopidogrel, rivaroxabán)
• Hay sangrado abundante por trauma (fractura nasal, golpe fuerte)
• Paciente es hipertenso y tiene la presión elevada

RECURRENTE: puede indicar hipertensión, trastornos de coagulación o fragilidad capilar.
Consultar médico si es frecuente.`,
  },

  {
    category: "primeros_auxilios",
    source: "Cruz Roja / ILCOR",
    content: `AHOGAMIENTO Y CASI AHOGAMIENTO:

RESCATE:
• NO entrar al agua si no está capacitado — lanzar un objeto flotante o cuerda
• En piscina: usar el gancho o tabla de salvamento
• Siempre llamar a emergencias

FUERA DEL AGUA:
1. Si no responde y no respira: iniciar RCP de inmediato (5 respiraciones iniciales antes
   de empezar compresiones — diferencia del RCP estándar en ahogamiento)
2. NO perder tiempo intentando sacar agua de los pulmones
3. Todo paciente rescatado de ahogamiento debe ir a urgencias aunque parezca recuperado
   (síndrome de ahogamiento secundario: puede desarrollarse horas después)

HIPOTERMIA ASOCIADA: el ahogamiento en agua fría puede ralentizar el metabolismo y permitir
supervivencia incluso con parada cardíaca prolongada — continuar la RCP hasta que llegue ayuda.

SEÑALES DE ALERTA HORAS DESPUÉS DEL RESCATE:
• Tos persistente, dificultad para respirar
• Pecho apretado, fatiga inusual
• Confusión, cambios de comportamiento
→ IR A URGENCIAS INMEDIATAMENTE`,
  },

  {
    category: "emergencias_neurologicas",
    source: "AHA / ESO",
    content: `ACV — QUE HACER MIENTRAS LLEGA LA AMBULANCIA:
El tiempo es cerebro: cada minuto sin tratamiento se pierden ~2 millones de neuronas.

LO QUE DEBES HACER:
1. Llamar al 123 de inmediato y NO colgar — sigue sus instrucciones
2. Anotar la hora exacta en que comenzaron los sintomas (el medico lo necesita para decidir el tratamiento)
3. Mantener a la persona tranquila y en posicion comoda — cabeza y hombros ligeramente elevados
4. Aflojar ropa ajustada en cuello y cintura
5. No dar nada por la boca — puede haber dificultad para tragar y puede ahogarse
6. No administrar aspirina — algunos ACV son hemorragicos y la aspirina empeora el sangrado
7. Si pierde la conciencia pero respira: posicion lateral de recuperacion
8. Si no respira: RCP

NO HACER:
- No dejar sola a la persona en ningun momento
- No darle agua, medicamentos ni alimentos
- No esperar a ver si mejora — cada minuto cuenta

PROTOCOLO FAST de confirmacion rapida:
F — Face (Cara): pedir que sonria. Un lado cae? Asimetria?
A — Arms (Brazos): levantar ambos brazos. Uno cae o no puede?
S — Speech (Habla): repetir una frase. Confuso, arrastra palabras?
T — Time: si cualquiera de los anteriores, llama al 123 YA`,
  },

  {
    category: "condiciones_cronicas",
    source: "ACR / EULAR / Arthritis Foundation",
    content: `ARTRITIS REUMATOIDE — VIVIR CON LA CONDICION:
La artritis reumatoide (AR) es una enfermedad autoinmune: el sistema inmune ataca por error las articulaciones. No es causada por desgaste ni por edad — puede aparecer a cualquier edad, incluso en jovenes.

CON TRATAMIENTO ADECUADO:
La mayoria de personas con AR llevan vidas activas y plenas. Los tratamientos modernos (DMARDs biologicos y sinteticos) pueden lograr remision o baja actividad de la enfermedad en muchos pacientes.

MANEJO DEL BROTE (dolor e inflamacion aguda):
• Reposo relativo de la articulacion afectada — no inmovilizacion total
• Calor seco (para rigidez matutina) o frio (para inflamacion aguda)
• Ejercicio en agua o fisioterapia — mantiene la movilidad sin dañar las articulaciones
• EVITAR en AR: ibuprofeno, naproxeno y AINEs si hay alergia o contraindicacion — consultar al reumatólogo las alternativas seguras
• El paracetamol es generalmente seguro para el dolor pero no controla la inflamacion

SEÑALES DE QUE DEBES CONSULTAR AL REUMATÓLOGO PRONTO:
• Brote con mas de 6 articulaciones inflamadas
• Fiebre asociada al brote
• Dolor que no cede con el tratamiento habitual
• Rigidez matutina que dura mas de 1 hora`,
  },

  // ── Nuevos chunks: salud cotidiana en el embarazo ─────────────────────────

  {
    category: "embarazo_alimentacion",
    source: "OMS / ACOG / Ministerio de Salud",
    content: `ALIMENTACIÓN SEGURA DURANTE EL EMBARAZO — QUÉ COMER Y QUÉ EVITAR:

ALIMENTOS A EVITAR O LIMITAR:
• Pescados con alto mercurio: tiburón, pez espada, atún rojo, blanquillo — el mercurio daña el sistema nervioso del bebé. Atún enlatado: máximo 2 latas por semana.
• Mariscos y pescado crudo (sushi, ceviche, ostras crudas): riesgo de listeria y salmonela.
• Carnes crudas o poco cocinadas (carpaccio, hamburguesas a término medio): riesgo de toxoplasmosis.
• Embutidos y fiambres sin calentar (jamón, salami, hot dog): riesgo de listeria — calentar hasta humear antes de comer.
• Quesos blandos no pasteurizados: brie, camembert, queso azul, queso fresco artesanal — riesgo de listeria. Quesos duros y pasteurizados son seguros.
• Huevos crudos o poco cocinados: mayonesa casera, mousse de chocolate, tiramisú — riesgo de salmonela.
• Hígado y paté en exceso: muy alto en vitamina A (retinol) — el exceso puede causar malformaciones. Pequeñas cantidades ocasionales son aceptables.
• Alcohol: NINGUNA cantidad es segura durante el embarazo. Causa síndrome alcohólico fetal.
• Cafeína en exceso: máximo 200 mg/día (aprox. 1-2 tazas de café). Más puede aumentar riesgo de aborto y bajo peso al nacer.

ALIMENTOS SEGUROS Y RECOMENDADOS:
• Frutas y verduras lavadas muy bien (toxoplasmosis en tierra).
• Legumbres, granos enteros, carnes bien cocidas, lácteos pasteurizados.
• Salmón cocinado, sardinas: excelente fuente de DHA (omega-3) — seguro en embarazo.`,
  },

  {
    category: "embarazo_alimentacion",
    source: "OMS / ACOG / Fitoterapia Clínica",
    content: `ESPECIAS, HIERBAS Y PLANTAS DURANTE EL EMBARAZO — QUÉ ES SEGURO:

CANELA (Cinnamomum):
• En cantidades culinarias (condimento en comidas, té ocasional): GENERALMENTE SEGURA — no hay evidencia de daño en dosis normales de cocina.
• En dosis altas como suplemento o aceite esencial concentrado: puede estimular contracciones uterinas y no se recomienda en grandes cantidades, especialmente en el primer trimestre.
• Conclusión: una canela en leche, un postre con canela o té de canela ocasional no representa riesgo. Los suplementos de canela medicinal sí deben evitarse.

JENGIBRE: seguro en pequeñas cantidades (té, condimento). Útil para náuseas del primer trimestre. Dosis medicinales altas (>1 g/día como suplemento): consultar médico.

MENTA: condimento y té ocasional seguros. Aceite esencial en altas dosis: evitar.

HIERBAS A EVITAR O LIMITAR EN EMBARAZO:
• Salvia en grandes cantidades: puede estimular contracciones.
• Romero en grandes cantidades (condimento normal es seguro, suplementos no).
• Aloe vera oral: puede ser laxante y estimular útero.
• Perejil en grandes cantidades (condimento es seguro, jugo concentrado no).
• Regaliz en exceso: puede elevar presión arterial y causar parto prematuro.
• Equinácea, ginkgo, hierba de San Juan: datos insuficientes, evitar.
• Manzanilla en grandes cantidades: puede provocar contracciones.

REGLA GENERAL: condimento en comidas = generalmente seguro. Suplementos, tés medicinales concentrados, aceites esenciales = consultar médico antes de usar.`,
  },

  {
    category: "embarazo_nutricion",
    source: "OMS / Sociedad Española de Ginecología",
    content: `NUTRICIÓN Y SUPLEMENTOS ESENCIALES EN EL EMBARAZO:

ÁCIDO FÓLICO (folato):
• El más crítico: reduce hasta 70% el riesgo de defectos del tubo neural (espina bífida, anencefalia).
• Dosis: 400-800 mcg/día desde al menos 1 mes antes de la concepción hasta el final del primer trimestre. Con riesgo elevado (diabetes, epilepsia, embarazo anterior con defecto): 4-5 mg/día bajo prescripción médica.
• Fuentes alimentarias: espinaca, brócoli, legumbres, naranja, aguacate — pero la suplementación es necesaria porque la dieta sola rara vez alcanza.

HIERRO:
• Las necesidades se duplican durante el embarazo (27 mg/día vs 18 mg/día fuera del embarazo).
• Suplemento estándar: 30-60 mg/día de hierro elemental. Muchas vitaminas prenatales lo incluyen.
• Tomarlo con vitamina C (jugo de naranja) para mejor absorción. Evitar con té, café, calcio.
• Anemia por déficit de hierro en embarazo: síntomas de cansancio extremo, mareo, palidez.

CALCIO Y VITAMINA D:
• Calcio: 1000-1300 mg/día (lácteos pasteurizados, brócoli, almendras, tofu).
• Vitamina D: 600-2000 UI/día según exposición solar. Muchas mujeres tienen déficit.

OMEGA-3 / DHA:
• 200-300 mg de DHA/día beneficia el desarrollo cerebral del bebé.
• Fuentes: salmón cocido, sardinas, aceite de pescado pasteurizado. Evitar suplementos de aceite de hígado de bacalao (exceso de vitamina A).

NÁUSEAS Y VÓMITOS DEL PRIMER TRIMESTRE:
• Muy frecuentes semanas 6-12. Comer pequeñas cantidades frecuentes.
• Galletitas saladas, jengibre, vitamina B6 (10-25 mg) pueden ayudar.
• Si no puedes retener líquidos por más de 24h → urgencias (hiperémesis gravídica).`,
  },

  {
    category: "embarazo_salud_cotidiana",
    source: "OMS / ACOG / Guías de Atención Prenatal",
    content: `PREGUNTAS FRECUENTES DE SALUD EN EL EMBARAZO:

MEDICAMENTOS SEGUROS EN EMBARAZO (uso ocasional, siempre consultar médico):
• Paracetamol/acetaminofén: analgésico más seguro en embarazo para fiebre y dolor leve-moderado.
• Antiácidos con carbonato de calcio o hidróxido de magnesio: seguros para acidez (evitar bicarbonato de sodio en exceso).
• Loratadina o cetirizina: antihistamínicos generalmente aceptados para alergias.
• EVITAR absolutamente: ibuprofeno/AINEs (especialmente 3er trimestre — cierra el ductus arterioso), aspirina en dosis altas, tetraciclinas, fluoroquinolonas, metronidazol oral primer trimestre.

EJERCICIO DURANTE EL EMBARAZO:
• Recomendado: 150 min/semana de actividad moderada (caminar, nadar, yoga prenatal).
• Evitar: deportes de contacto, deportes con riesgo de caída (esquí, equitación), ejercicios boca arriba después de semana 20 (comprime vena cava), buceo.

SEÑALES DE ALARMA QUE REQUIEREN IR A URGENCIAS:
• Sangrado vaginal (cualquier cantidad en primer trimestre; moderado a grave después).
• Dolor abdominal intenso o calambres fuertes.
• Ausencia de movimientos fetales después de semana 24 (contar: menos de 10 movimientos en 2 horas).
• Fiebre >38°C — puede ser peligrosa para el bebé.
• Hinchazón repentina de cara, manos o pies + dolor de cabeza fuerte + visión borrosa → preeclampsia.
• Contracciones regulares antes de semana 37 → parto prematuro.

SALUD BUCAL EN EMBARAZO:
• Las hormonas aumentan riesgo de gingivitis. Cepillado e hilo dental esenciales.
• Ir al dentista durante el embarazo es seguro — informar que estás embarazada.
• Radiografías dentales: preferir evitar, pero con protección son aceptables si es necesario.`,
  },

  {
    category: "embarazo_salud_cotidiana",
    source: "OMS / Centros de Control de Enfermedades (CDC)",
    content: `INFECCIONES Y EXPOSICIONES A EVITAR DURANTE EL EMBARAZO:

TOXOPLASMOSIS (parásito en carne cruda, tierra y heces de gatos):
• Lavar bien frutas y verduras. Cocinar carnes completamente.
• Si tienes gato: que otra persona limpie la bandeja o usar guantes y mascarilla. El gato en sí no es peligroso si es de interior.
• Usar guantes al jardinear.

LISTERIA (bacteria en alimentos no pasteurizados o mal refrigerados):
• Embarazadas tienen 10x más riesgo de infección grave. Puede causar aborto, muerte fetal o meningitis neonatal.
• Síntomas: fiebre, dolores musculares, a veces diarrea — frecuentemente confundidos con gripe.
• Evitar: quesos blandos no pasteurizados, embutidos sin calentar, brotes frescos crudos, melón cortado que ha estado mucho tiempo en nevera.

RUBÉOLA Y VARICELA:
• Si no estás vacunada, evitar contacto con personas infectadas.
• NO vacunarse durante el embarazo (vacunas de virus vivos). Vacunarse en el posparto.

ZIKA (si viajas a zonas endémicas):
• Puede causar microcefalia fetal. Evitar viajes a zonas de riesgo. Usar repelente con DEET (seguro en embarazo), ropa de manga larga.

RAYOS X Y RADIACIÓN:
• Radiografía dental y de extremidades con delantal de plomo: aceptable si es médicamente necesario.
• TC abdominal o pélvico: solo si absolutamente necesario.
• Resonancia magnética sin contraste: generalmente segura.

COVID-19 Y GRIPE:
• Embarazadas tienen mayor riesgo de complicaciones graves. Vacunas de gripe y COVID-19 (ARNm) son seguras y recomendadas en cualquier trimestre.`,
  },

  {
    category: "hematologia",
    source: "OMS / Guias de Anemia",
    content: `ANEMIA FERROPENICA — ENTENDER Y MANEJAR:
La anemia ferropenica ocurre cuando el cuerpo no tiene suficiente hierro para producir hemoglobina — la proteina que transporta oxigeno en los globulos rojos. Es como tener muy pocos camiones de reparto de oxigeno en el cuerpo.

SINTOMAS TIPICOS:
• Cansancio y fatiga constante aunque duermas bien
• Mareos al levantarte rapido (hipotension ortostatica — la sangre tarda en llegar al cerebro)
• Pallidez, piel y mucosas poco rosadas
• Palpitaciones o falta de aire al esfuerzo
• Dificultad para concentrarse

MANEJO DEL MAREO AL LEVANTARSE:
• Levantate en dos tiempos: primero siéntate al borde de la cama, espera 30 segundos, luego parate
• Mantente hidratado — la deshidratacion empeora la hipotension ortostatica

ALIMENTOS RICOS EN HIERRO:
• Hierro heminico (mejor absorbido): carnes rojas, higado, pollo, pescado
• Hierro no heminico: legumbres, espinaca, brocoli, quinoa
• Vitamina C potencia la absorcion: tomar con jugo de naranja o tomate
• EVITAR con el hierro: cafe, te, lacteos — reducen la absorcion

CUANDO CONSULTAR:
• Si los sintomas son nuevos o empeoran a pesar del tratamiento
• Si hay sangrado anormal (menstrual, digestivo)
• Si hay palpitaciones frecuentes o falta de aire en reposo`,
  },
];

async function seedKnowledge(): Promise<void> {
  process.stdout.write("Seeding medical knowledge base...\n");

  await vectorService.ensureSchema();

  const existing = await vectorService.countChunks();
  if (existing > 0) {
    process.stdout.write(`Already has ${existing} chunks. To re-seed, call clearChunks() first.\n`);
    process.exit(0);
  }

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
    const chunk = KNOWLEDGE_BASE[i];
    process.stdout.write(`[${i + 1}/${KNOWLEDGE_BASE.length}] ${chunk.category}... `);

    try {
      const embedding = await openAIService.generateEmbedding(chunk.content);
      await vectorService.upsertChunk(chunk, embedding);
      process.stdout.write("ok\n");
      successful++;

      await new Promise((res) => setTimeout(res, 200));
    } catch (err) {
      process.stdout.write("failed\n");
      process.stderr.write(`  Error: ${err}\n`);
      failed++;
    }
  }

  const total = await vectorService.countChunks();
  process.stdout.write(`\nCompleted: ${successful}/${KNOWLEDGE_BASE.length} | Failed: ${failed} | Total in DB: ${total}\n`);

  await vectorService.disconnect();
  process.exit(0);
}

seedKnowledge().catch((err) => {
  process.stderr.write(`Seed failed: ${err}\n`);
  process.exit(1);
});

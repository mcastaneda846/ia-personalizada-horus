/**
 * Segunda ronda de chunks — cubre brechas identificadas en la base de conocimiento.
 * Temas: síntomas cotidianos, manejo de crónicas, salud mental, pediatría,
 * farmacología, nutrición preventiva, emergencias adicionales.
 *
 *   npx tsx src/scripts/seed-gaps.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { openAIService } from "../services/openai.service";
import { vectorService } from "../services/vector.service";
import { KnowledgeChunk } from "../models/types";

const GAP_CHUNKS: KnowledgeChunk[] = [

  // ── Síntomas cotidianos ───────────────────────────────────────────────────

  {
    category: "sintomas_frecuentes",
    source: "OMS / Ministerio de Salud Colombia",
    content: `FIEBRE EN ADULTOS — CUÁNDO PREOCUPARSE Y QUÉ HACER:

DEFINICIÓN: temperatura corporal ≥38°C (axilar) o ≥38.5°C (oral/rectal).
La fiebre no es una enfermedad — es una respuesta del sistema inmune. El termómetro de mercurio ya no se recomienda; usar digital.

MANEJO EN CASA (fiebre sin señales de alarma):
• Hidratación abundante: agua, caldos, jugos naturales. La fiebre deshidrata.
• Paracetamol 500-1000 mg cada 6-8 horas (máximo 4g/día) para el malestar.
• Ibuprofeno 400 mg cada 8 horas si no hay contraindicaciones (no en embarazo, problemas renales, úlcera).
• Ropa ligera, ambiente fresco.
• Compresas de agua tibia (no fría — el frío causa escalofrío y sube la temperatura).
• NO aspirina en adultos si hay sospecha de dengue (puede causar sangrado).

SEÑALES DE ALARMA — IR A URGENCIAS:
• Fiebre >40°C que no baja con medicación
• Fiebre en adulto mayor de 65 años que persiste más de 48h
• Fiebre + rigidez de nuca + fotofobia → posible meningitis
• Fiebre + dificultad para respirar, dolor de pecho
• Fiebre + sarpullido generalizado
• Fiebre + confusión o alteración del estado mental
• Fiebre que dura más de 3 días sin mejoría
• Fiebre en persona inmunosuprimida (VIH, trasplante, quimioterapia)

DENGUE EN COLOMBIA: sospecha si hay fiebre alta súbita + dolor detrás de los ojos + dolor muscular fuerte + náuseas. NO dar ibuprofeno ni aspirina — solo paracetamol y líquidos. Buscar atención médica.`,
  },

  {
    category: "sintomas_frecuentes",
    source: "IHS / OMS / Sociedad Latinoamericana de Cefalea",
    content: `DOLOR DE CABEZA — TIPOS, MANEJO Y SEÑALES DE ALARMA:

CEFALEA TENSIONAL (tipo más frecuente ~80%):
• Sensación de presión o banda apretada alrededor de la cabeza
• Bilateral, intensidad leve-moderada, no empeora con actividad física
• Desencadenantes: estrés, mala postura, deshidratación, privación de sueño, tensión muscular
• Manejo: paracetamol 1g o ibuprofeno 400mg, hidratación, descanso, calor local en cuello/hombros
• Masaje cervical y hombros puede aliviar

MIGRAÑA:
• Dolor pulsátil, frecuentemente unilateral, intensidad moderada-severa
• Empeora con actividad, luz y ruido
• Puede acompañarse de náuseas, vómito, aura (destellos de luz, visión borrosa antes del dolor)
• Manejo del episodio: ibuprofeno 400-600mg o naproxeno al inicio; oscuridad y silencio; triptanes (sumatriptán) si prescritos
• EVITAR: pantallas, luces brillantes, olores fuertes durante el episodio

SEÑALES DE ALARMA — ACUDIR A URGENCIAS INMEDIATAMENTE:
• "El peor dolor de cabeza de mi vida" de inicio súbito → posible hemorragia subaracnoidea
• Cefalea + fiebre + rigidez de nuca → meningitis
• Cefalea + déficit neurológico (visión doble, debilidad, habla confusa) → ACV
• Cefalea + confusión o pérdida de conciencia
• Cefalea que empeora al acostarse o al despertar (posible hipertensión intracraneal)
• Nueva cefalea intensa en persona mayor de 50 años sin historia de migraña
• Cefalea en embarazada con presión alta → preeclampsia`,
  },

  {
    category: "sintomas_frecuentes",
    source: "OMS / OPS / Ministerio de Salud Colombia",
    content: `DIARREA Y GASTROENTERITIS — MANEJO Y PREVENCIÓN DE DESHIDRATACIÓN:

GASTROENTERITIS VIRAL (causa más frecuente):
• Inicio súbito, náuseas, vómito, diarrea acuosa, cólicos, fiebre baja
• Dura 1-5 días y se resuelve sola
• El tratamiento principal es PREVENIR LA DESHIDRATACIÓN

SUERO DE REHIDRATACIÓN ORAL (SRO):
• Usar sobres comerciales (Electrolit, Pedialyte, Sales OMS) disueltos en agua hervida
• Si no hay SRO: 1 litro de agua hervida + 6 cucharaditas de azúcar + 1 cucharadita de sal
• Tomar en sorbos frecuentes, no en grandes cantidades de golpe
• Adultos: 200-400 ml después de cada deposición líquida
• Continuar la hidratación aunque haya náuseas

ALIMENTACIÓN DURANTE LA GASTROENTERITIS:
• No hay ayuno obligatorio — si tiene hambre, puede comer
• Alimentos seguros: arroz blanco, plátano cocido, pan blanco tostado, pollo sin grasa
• Evitar: lácteos completos, grasas, fibra excesiva, bebidas azucaradas
• NO dar gaseosas ni jugos sin diluir — el azúcar empeora la diarrea

SEÑALES DE ALARMA — IR A URGENCIAS:
• Sangre en las heces (disentería — puede ser bacteriana)
• Vómito que impide tomar líquidos por más de 6-8 horas
• Signos de deshidratación grave: boca muy seca, sin orina en 8h, piel que no vuelve al pinzarla, confusión
• Fiebre alta (>39°C) con diarrea
• Diarrea de más de 7 días sin mejoría
• Adultos mayores, embarazadas o inmunosuprimidos con diarrea moderada-grave`,
  },

  {
    category: "sintomas_frecuentes",
    source: "EAU / Asociación Colombiana de Urología",
    content: `INFECCIÓN URINARIA (ITU) — RECONOCIMIENTO Y MANEJO:

SÍNTOMAS TÍPICOS DE CISTITIS (infección baja, solo vejiga):
• Ardor o quemazón al orinar (disuria)
• Ganas frecuentes y urgentes de orinar, incluso habiendo orinado hace poco
• Poca cantidad de orina cada vez
• Orina turbia, con mal olor o ligeramente rosada (trazas de sangre)
• Dolor o presión en la parte baja del abdomen
• Sin fiebre alta en cistitis simple

ITU MÁS FRECUENTE EN MUJERES: la anatomía femenina (uretra corta) facilita el ascenso de bacterias.

PIELONEFRITIS (infección alta, riñón comprometido — más grave):
• Mismos síntomas de cistitis + fiebre alta (>38.5°C) + escalofríos + dolor en el flanco (espalda baja lateral)
• Náuseas y vómito frecuentes
• SIEMPRE requiere consulta médica urgente y antibióticos bajo prescripción

MANEJO EN CASA (cistitis sin fiebre, sin embarazo):
• Hidratación abundante (acelera eliminación de bacterias)
• Paracetamol o ibuprofeno para el dolor/ardor
• Evitar jabones íntimos, ropa interior sintética ajustada
• Consultar médico para antibiótico si los síntomas persisten más de 48h o empeoran
• NO automedicarse antibióticos — la resistencia bacteriana es un problema grave

CUÁNDO IR AL MÉDICO SIEMPRE:
• Cualquier síntoma urinario en embarazadas (mayor riesgo de pielonefritis)
• Fiebre + dolor en flanco (sospecha de pielonefritis)
• Hombres con síntomas urinarios (pueden indicar problema prostático)
• Niños con síntomas urinarios
• Más de 3 episodios en el año (ITU recurrente)`,
  },

  {
    category: "sintomas_frecuentes",
    source: "OMS / Sociedad Colombiana de Ortopedia",
    content: `DOLOR DE ESPALDA (LUMBALGIA) — MANEJO Y SEÑALES DE ALARMA:

LUMBALGIA MECÁNICA (causa más frecuente — >90% de los casos):
• Dolor en la zona lumbar (parte baja de la espalda), a veces con irradiación a glúteos
• Aparece por mala postura, movimiento brusco, levantamiento de peso
• Mejora con reposo y calor; empeora con posiciones mantenidas
• La GRAN MAYORÍA mejora sola en 2-6 semanas

MANEJO EN CASA:
• Continuar con actividad física normal en lo posible — el reposo prolongado en cama EMPEORA la lumbalgia
• Calor local: bolsa de agua caliente, parches térmicos
• Ibuprofeno 400mg cada 8 horas (con comida) o paracetamol para el dolor agudo
• Estiramiento suave del músculo piriforme y cadena posterior (puede aliviar)
• Posición al dormir: de costado con una almohada entre las rodillas

LUMBOCIÁTICA (dolor que baja por la pierna hasta la rodilla o el pie):
• Indica compresión del nervio ciático — más intenso, puede haber hormigueo o entumecimiento
• Consultar médico; puede requerir fisioterapia o imagen diagnóstica
• El reposo relativo es útil al inicio

SEÑALES DE ALARMA — CONSULTAR URGENCIAS:
• Pérdida de control de la vejiga o intestinos (retención o incontinencia urinaria/fecal) → síndrome de cauda equina — cirugía urgente
• Dolor de espalda + fiebre alta (posible infección espinal o absceso)
• Dolor muy intenso en persona con cáncer conocido (posible metástasis)
• Debilidad progresiva en piernas
• Dolor nocturno intenso que no mejora con ninguna posición
• Trauma previo importante (caída, accidente)`,
  },

  // ── Condiciones crónicas — manejo diario ─────────────────────────────────

  {
    category: "condiciones_cronicas",
    source: "OPS / OMS / Guías Colombianas de Hipertensión",
    content: `HIPERTENSIÓN ARTERIAL — MANEJO DIARIO Y CONTROL:

CIFRAS DE REFERENCIA:
• Normal: <120/80 mmHg
• Elevada: 120-129 / <80
• Hipertensión grado 1: 130-139 / 80-89
• Hipertensión grado 2: ≥140 / ≥90
• Crisis: ≥180 / ≥120 (ver protocolo crisis hipertensiva)

CÓMO TOMAR BIEN LA PRESIÓN:
• Reposo 5 minutos antes de la medición
• Sentado, espalda apoyada, brazo al nivel del corazón
• No fumar, tomar café ni hacer ejercicio 30 min antes
• Medir 2 veces con 1-2 min de diferencia, promediar

MODIFICACIONES DE ESTILO DE VIDA (pilar del tratamiento):
• Reducir sodio (sal): máximo 5g/día. Evitar embutidos, enlatados, snacks salados, sopas instantáneas.
• DIETA DASH: rica en frutas, verduras, granos enteros, lácteos bajos en grasa, legumbres. Baja en grasas saturadas.
• Ejercicio aeróbico: 30 min al día, 5 días/semana (caminar, nadar, bicicleta)
• Reducir alcohol: máximo 1 copa/día en mujeres, 2 en hombres
• Dejar de fumar: el tabaco eleva la presión y daña los vasos
• Perder peso si hay sobrepeso: 5-10 kg puede bajar 5-10 mmHg

ADHERENCIA AL MEDICAMENTO:
• NUNCA suspender el antihipertensivo solo porque la presión está bien — está bien PORQUE toma el medicamento
• Tomar siempre a la misma hora
• Si olvida una dosis: tomarla lo antes posible, nunca duplicar
• Los efectos secundarios frecuentes son manejables — consultar al médico antes de suspender`,
  },

  {
    category: "condiciones_cronicas",
    source: "ADA / FID / Guías Colombianas de Diabetes",
    content: `DIABETES TIPO 2 — MANEJO DIARIO Y MONITOREO:

METAS DE CONTROL:
• Glucosa en ayunas: 80-130 mg/dL
• Glucosa 2h después de comer: <180 mg/dL
• Hemoglobina glicosilada (HbA1c): <7% (revisión cada 3 meses con el médico)
• Presión arterial: <130/80 mmHg (hipertensión y diabetes coexisten frecuentemente)

MONITOREO EN CASA:
• Glucómetro: técnica correcta — limpiar el dedo, usar sangre del costado de la yema
• Registrar los resultados con fecha y hora para mostrar al médico
• Medir en ayunas y 2h después de comer según indicación médica

ALIMENTACIÓN PARA DIABÉTICO:
• Porciones controladas de carbohidratos (no eliminarlos — reducirlos)
• Índice glucémico bajo: arroz integral, legumbres, avena, pan integral, verduras
• Evitar azúcares simples: gaseosas, jugos industriales, dulces, harinas refinadas
• Proteína en cada comida ayuda a estabilizar la glucosa
• Distribución: 3 comidas principales + 1-2 meriendas — no saltar comidas

CUIDADO DE PIES (crítico en diabetes):
• Revisar los pies diariamente: heridas, ampollas, cambios de color, temperatura
• Lavar con agua tibia (nunca caliente), secar bien entre los dedos
• No caminar descalzo, usar calzado cómodo
• Consultar al médico por cualquier herida — la cicatrización puede ser lenta

SEÑALES QUE REQUIEREN CONSULTA URGENTE:
• Glucosa persistentemente >300 mg/dL con síntomas (ver cetoacidosis)
• Glucosa <70 mg/dL (hipoglucemia) frecuente
• Herida en pie que no mejora o se infecta
• Visión borrosa súbita`,
  },

  {
    category: "condiciones_cronicas",
    source: "OPS / AACE / Guías Colombianas de Dislipidemia",
    content: `COLESTEROL ALTO (DISLIPIDEMIA) — QUÉ SIGNIFICA Y CÓMO MANEJARLO:

VALORES DE REFERENCIA:
• Colesterol total: deseable <200 mg/dL
• LDL ("malo"): deseable <130 mg/dL; <100 si hay diabetes o enfermedad cardiovascular; <70 si hay muy alto riesgo
• HDL ("bueno"): deseable >40 mg/dL en hombres, >50 en mujeres (mayor = mejor)
• Triglicéridos: deseable <150 mg/dL

POR QUÉ IMPORTA: el colesterol alto no da síntomas, pero acumula placa en las arterias (aterosclerosis) durante años → aumenta el riesgo de infarto y ACV.

CAMBIOS DE DIETA:
• Reducir grasas saturadas: carnes grasas, piel de pollo, mantequilla, quesos enteros, coco
• Eliminar grasas trans: margarina dura, alimentos ultra-procesados, comida rápida
• Aumentar fibra soluble: avena, manzana, zanahoria, legumbres — atrapa el colesterol en el intestino
• Aumentar grasas saludables: aguacate, nueces, aceite de oliva, pescado azul (salmón, sardina, atún)
• Esteroles vegetales (margarinas enriquecidas): pueden bajar LDL 5-15%

EJERCICIO: 150 min/semana de actividad moderada sube el HDL (colesterol bueno) y baja los triglicéridos.

SOBRE LAS ESTATINAS (atorvastatina, rosuvastatina, simvastatina):
• No se toman "de por vida" arbitrariamente — se indican según el riesgo cardiovascular calculado
• NUNCA suspender sin consultar al médico — el colesterol vuelve a subir rápidamente
• Efecto secundario conocido: dolor muscular — si ocurre, consultar al médico antes de suspender
• Tomarlas por la noche (mayor síntesis de colesterol de madrugada)`,
  },

  // ── Salud mental — más allá de crisis ────────────────────────────────────

  {
    category: "salud_mental",
    source: "OPS / OMS / Asociación Psiquiátrica de América Latina",
    content: `ANSIEDAD Y DEPRESIÓN — RECONOCIMIENTO Y CUÁNDO BUSCAR AYUDA:

ANSIEDAD:
La ansiedad es normal ante situaciones de estrés. Se vuelve trastorno cuando es desproporcionada, persistente (>6 meses) o interfiere con la vida diaria.
Síntomas frecuentes: preocupación constante difícil de controlar, tensión muscular, dificultad para concentrarse, irritabilidad, problemas de sueño, palpitaciones, fatiga.

DEPRESIÓN:
No es simplemente tristeza o flojera — es una enfermedad con base biológica.
Síntomas: tristeza persistente casi todos los días por ≥2 semanas, pérdida de interés en actividades que antes gustaban, cambios de apetito y peso, insomnio o dormir en exceso, fatiga, sensación de inutilidad o culpa excesiva, dificultad para concentrarse, pensamientos de muerte o suicidio.
IMPORTANTE: NO mejora "con esfuerzo" ni "poniéndole ganas". Requiere tratamiento.

ESTRATEGIAS DE APOYO (complementarias, no reemplazan tratamiento profesional):
• Ejercicio regular: reduce síntomas de ansiedad y depresión comparablemente a algunos medicamentos
• Rutina de sueño consistente (mismo horario, sin pantallas 1h antes)
• Conexión social — aislarse empeora ambas condiciones
• Reducir alcohol — es un depresor del sistema nervioso
• Técnicas de respiración y mindfulness para ansiedad

CUÁNDO BUSCAR AYUDA PROFESIONAL (psicólogo/psiquiatra):
• Síntomas durante más de 2-4 semanas que afectan el trabajo, relaciones o funcionamiento diario
• Cualquier pensamiento de hacerse daño o suicida → buscar ayuda INMEDIATAMENTE (línea 106 en Colombia)
• Uso de alcohol o sustancias para "calmar" los síntomas
• Los antidepresivos/ansiolíticos son medicamentos eficaces y seguros cuando están indicados — no generan dependencia psicológica cuando son bien manejados`,
  },

  {
    category: "salud_mental",
    source: "OMS / Academia Americana de Medicina del Sueño",
    content: `INSOMNIO E HIGIENE DEL SUEÑO:

CUÁNTO DORMIR: adultos 7-9 horas. Adultos mayores 7-8 horas. Adolescentes 8-10 horas.

HIGIENE DEL SUEÑO (medidas con evidencia científica):
• Horario fijo: acostarse y levantarse siempre a la misma hora, incluso fines de semana
• Sin pantallas (móvil, TV, tablet) 60 minutos antes de dormir — la luz azul inhibe la melatonina
• Habitación oscura, fresca (18-20°C) y silenciosa
• No hacer ejercicio intenso en las 3 horas previas al sueño
• Sin cafeína después de las 14:00 (el café, té negro, mate, bebidas energizantes)
• No alcohol para dormir — fragmenta el sueño y reduce el sueño REM
• Levantarse de la cama si no puedes dormir en 20 min — asociar la cama solo al sueño
• Técnica de restricción de sueño: acostarse solo cuando se tenga sueño real

MANEJO DE PENSAMIENTOS NOCTURNOS:
• Escribir las preocupaciones en un cuaderno antes de acostarse ("vaciado mental")
• Técnica de respiración 4-7-8: inhalar 4s, sostener 7s, exhalar 8s

MEDICAMENTOS PARA DORMIR:
• Melatonina: útil para desfase horario o trabajo por turnos, no para insomnio crónico
• Antihistamínicos (difenhidramina): generan tolerancia rápida, no recomendados como rutina
• Benzodiacepinas (diazepam, alprazolam): solo bajo prescripción médica, corto plazo, alto riesgo de dependencia
• El insomnio crónico (>3 meses) requiere evaluación médica — puede indicar apnea del sueño, depresión, ansiedad u otras causas tratables`,
  },

  // ── Pediatría ─────────────────────────────────────────────────────────────

  {
    category: "pediatria",
    source: "OMS / OPS / Academia Americana de Pediatría / Ministerio de Salud Colombia",
    content: `FIEBRE EN NIÑOS — MANEJO DETALLADO Y SEÑALES DE ALARMA:

DEFINICIÓN: temperatura axilar ≥38°C. La fiebre en sí no es peligrosa hasta ~41°C — el riesgo es la causa subyacente, no la temperatura.

CUÁNDO IR A URGENCIAS SIEMPRE:
• Cualquier fiebre en bebé <3 meses (incluso 38°C) → urgencias inmediatamente
• Fiebre >39°C en bebés de 3-6 meses
• Fiebre que dura más de 5 días en cualquier niño
• Fiebre + sarpullido que no desaparece al presionar con un vaso → posible meningococcemia
• Fiebre + rigidez de nuca, fotofobia → meningitis
• Fiebre + dificultad para respirar, quejido, labios azules
• Fiebre + convulsión que dura >5 min o es la primera (ver protocolo convulsiones)
• Fiebre + niño muy decaído, no despierta bien, no toma líquidos

MEDICAMENTOS ANTITÉRMICOS EN NIÑOS:
• Paracetamol: 10-15 mg/kg/dosis cada 6-8 horas. Más seguro, primera línea.
• Ibuprofeno: 5-10 mg/kg/dosis cada 6-8 horas. No usar en <6 meses ni con varicela.
• NUNCA aspirina en menores de 16 años (síndrome de Reye).
• No combinar automáticamente paracetamol e ibuprofeno — consultar pediatra primero.

CONVULSIÓN FEBRIL (convulsión por fiebre, sin causa neurológica):
• Ocurre en 2-5% de los niños entre 6 meses y 5 años. Generalmente benigna.
• Dura <5 minutos, cede sola. Ver protocolo de convulsiones para el manejo.
• Siempre consultar al médico después de la primera convulsión febril.

HIDRATACIÓN EN NIÑOS CON FIEBRE:
• Ofrecer líquidos frecuentemente: agua, suero oral, leche materna
• No forzar comidas sólidas si no hay apetito — priorizar líquidos
• Señales de deshidratación: llanto sin lágrimas, boca muy seca, sin pañal mojado en 6-8h, ojos hundidos`,
  },

  {
    category: "pediatria",
    source: "OMS / OPS / ESPGHAN",
    content: `GASTROENTERITIS EN NIÑOS — DESHIDRATACIÓN Y SUERO ORAL:

DESHIDRATACIÓN — EVALUACIÓN:

LEVE (<5%): niño activo, boca ligeramente seca, algo más sediento de lo normal.
MODERADA (5-10%): boca seca, ojos algo hundidos, llanto con pocas lágrimas, fontanela hundida (lactantes), irritable o letárgico.
GRAVE (>10%): ojos muy hundidos, sin lágrimas, extremidades frías, piel que no vuelve al pellizcarla, muy decaído, sin orinar → URGENCIAS INMEDIATAMENTE.

SUERO DE REHIDRATACIÓN ORAL (SRO):
• Primera línea de tratamiento. Más efectivo que el suero intravenoso en deshidratación leve-moderada.
• Pedialyte, Electrolit, Sales OMS, o casero: 1 litro agua hervida + 6 cucharaditas azúcar + 1 cucharadita sal.
• Dar en sorbos pequeños y frecuentes. Si vomita, esperar 10-15 min y volver a ofrecer.

CUÁNTO DAR:
• Deshidratación leve: 50 ml/kg en 4 horas + continuar lactancia
• Por cada diarrea adicional: 10 ml/kg extra de SRO
• Por cada vómito: 5 ml/kg extra

ALIMENTACIÓN:
• NO suspender la alimentación — continuar lactancia materna a demanda
• Continuar alimentos habituales (dieta BRAT: plátano, arroz, manzana, tostadas) si hay apetito
• Evitar jugos de frutas concentrados y gaseosas (empeoran la diarrea)

MEDICAMENTOS:
• Probióticos (Lactobacillus reuteri o rhamnosus): pueden reducir duración 1 día — bajo riesgo, algún beneficio.
• Antidiarreicos como loperamida: NO en menores de 2 años, con precaución en mayores.
• Antibióticos: NO en gastroenteritis viral (>90% de los casos). Solo si hay sangre en heces, fiebre alta o cultivo positivo.

IR A URGENCIAS SI:
• No tolera el SRO (vomita todo), deshidratación moderada-grave, sangre en heces, fiebre alta.`,
  },

  // ── Farmacología — antibióticos ─────────────────────────────────────────

  {
    category: "farmacologia_antibioticos",
    source: "OMS / INVIMA / Ministerio de Salud Colombia",
    content: `ANTIBIÓTICOS — CUÁNDO SÍ, CUÁNDO NO Y USO CORRECTO:

LOS ANTIBIÓTICOS NO FUNCIONAN EN INFECCIONES VIRALES.
La mayoría de resfriados, gripes, faringitis, bronquitis y diarreas son VIRALES. Un antibiótico no las cura, no las acorta y sí genera resistencia bacteriana.

INFECCIONES QUE GENERALMENTE NO NECESITAN ANTIBIÓTICO:
• Resfriado común (virus)
• Gripe/influenza (virus)
• Faringitis viral (la más frecuente — 80% de los casos)
• Bronquitis aguda sin neumonía (virus en adultos sanos)
• Diarrea aguda sin sangre (generalmente viral o bacteriana autolimitada)
• Otitis media en niños mayores de 2 años sin síntomas graves (puede esperar 48-72h)

INFECCIONES QUE SÍ REQUIEREN ANTIBIÓTICO (solo con prescripción médica):
• Faringitis estreptocócica confirmada (strep test positivo o criterios clínicos fuertes)
• Neumonía bacteriana
• Infección urinaria (cistitis, pielonefritis)
• Otitis media en niños <2 años o con síntomas graves
• Sinusitis bacteriana (síntomas >10 días sin mejoría)
• Infecciones de piel bacterianas (celulitis, impétigo)

REGLAS DE ORO PARA TOMAR ANTIBIÓTICOS:
1. SIEMPRE con prescripción médica — nunca automedicar
2. Completar el tratamiento aunque te sientas mejor (suspender antes crea resistencia)
3. Tomar a las horas indicadas — espaciado correcto mantiene concentración activa
4. No guardar antibióticos "para la próxima vez" — cada infección puede ser diferente
5. No compartir los propios con otras personas

RESISTENCIA BACTERIANA: es una crisis global. Las bacterias resistentes a antibióticos matan >700.000 personas por año en el mundo. Colombia tiene altas tasas de resistencia. Usar antibióticos sin necesidad contribuye directamente a este problema.`,
  },

  // ── Emergencias adicionales ───────────────────────────────────────────────

  {
    category: "emergencias_neurologicas",
    source: "Cruz Roja / ATLS / Ministerio de Salud Colombia",
    content: `TRAUMA CRANEOENCEFÁLICO (TCE) — EVALUACIÓN Y MANEJO:

TIPOS:
• LEVE: golpe en la cabeza, posible pérdida breve de conciencia (<30 min), confusión pasajera, cefalea.
• MODERADO-GRAVE: pérdida de conciencia >30 min, amnesia, déficit neurológico.

SEÑALES DE ALARMA — LLAMAR A EMERGENCIAS / IR A URGENCIAS:
• Pérdida de conciencia aunque sea breve → siempre evaluar
• Confusión o desorientación que no mejora
• Convulsión después del golpe
• Vómito repetido (>2 veces) después del trauma
• Dolor de cabeza que empeora progresivamente
• Sangrado o líquido claro por nariz u oídos (puede ser LCR — fluido del cerebro)
• Pupila de tamaño diferente entre ojos (anisocoria)
• Dificultad para despertar o mantener alerta
• Debilidad o entumecimiento en brazos o piernas
• Habla confusa o dificultad para hablar

CONMOCIÓN CEREBRAL (concusión):
• Tipo de TCE leve — NO siempre causa pérdida de conciencia
• Síntomas: dolor de cabeza, mareo, sensación de niebla mental, náuseas, sensibilidad a la luz/ruido
• Protocolo: reposo cognitivo y físico (sin deportes, pantallas, esfuerzo mental) 24-48h
• SIEMPRE consultar médico ante sospecha de concusión, especialmente en niños y deportistas
• Retorno gradual a la actividad — el retorno prematuro puede causar síndrome de segundo impacto (grave)

PRIMEROS AUXILIOS ANTE TRAUMA CRANEAL GRAVE:
1. Llamar a emergencias de inmediato
2. NO mover al paciente si hay sospecha de trauma cervical (accidente de tráfico, caída de altura)
3. Mantener la vía aérea libre — si vomita y no hay lesión cervical: posición lateral con precaución
4. Controlar hemorragias externas con presión suave sin deprimir el cráneo
5. Monitorear el nivel de conciencia hasta que llegue ayuda`,
  },

  {
    category: "emergencias_abdominales",
    source: "Cruz Roja / Asociación Colombiana de Urología",
    content: `CÓLICO RENAL (CÁLCULO O PIEDRA EN EL RIÑÓN):

QUÉ ES: el cálculo renal es una piedra formada en el riñón que al moverse por el uréter causa un dolor intensísimo. Es una de las peores experiencias de dolor conocidas.

SÍNTOMAS TÍPICOS:
• Dolor muy intenso en el flanco (costado, entre costilla y cadera), que puede irradiar a la ingle, genitales y muslo interno
• El dolor es cólico: va y viene en olas, no cede con ninguna posición (a diferencia de la apendicitis)
• Náuseas y vómito frecuentes
• Ganas urgentes de orinar, ardor al orinar
• Orina rosada o rojiza (hematuria — sangre en orina)
• Inquietud — el paciente no puede quedarse quieto (signo diferenciador importante)

MANEJO:
• Ibuprofeno 600mg (si no hay contraindicación): primer antiinflamatorio de elección para el dolor agudo
• Hidratación abundante puede ayudar a "empujar" el cálculo
• Calor en el flanco puede aliviar el espasmo muscular
• La mayoría de cálculos <5mm pasan solos en 1-2 semanas

CUÁNDO IR A URGENCIAS:
• Dolor que no cede con ibuprofeno
• Fiebre + dolor en flanco + escalofríos → obstrucción + infección (pielonefritis obstructiva) = URGENCIA REAL — puede causar sepsis
• Orina con mucha sangre
• Solo tiene un riñón
• Embarazada con cólico renal`,
  },

  {
    category: "emergencias_abdominales",
    source: "Cruz Roja / Sociedad Colombiana de Cirugía",
    content: `DOLOR ABDOMINAL AGUDO — CUÁNDO ES UNA EMERGENCIA:

SEÑALES DE ALARMA QUE REQUIEREN URGENCIAS:
• Dolor abdominal de inicio súbito e intenso, especialmente si empeora rápidamente
• Abdomen duro como tabla (rigidez) — signo de peritonitis
• Dolor + fiebre alta
• Dolor + vómito de sangre o sangre en heces oscuras o rojas
• Síntomas de APENDICITIS: dolor que comienza alrededor del ombligo y migra hacia la fosa ilíaca derecha (cuadrante inferior derecho), empeora al moverse, fiebre, náuseas
• Dolor abdominal + imposibilidad de comer durante >24h
• Embarazada con dolor abdominal intenso
• Adulto mayor con dolor abdominal + distensión

CAUSAS FRECUENTES DE DOLOR ABDOMINAL Y SEÑALES:
• GASTRITIS: ardor en epigastrio (boca del estómago), mejora con antiácidos, empeora en ayunas o con alcohol/AINEs
• CÓLICO INTESTINAL: calambres que van y vienen, acompañados de gas, mejora al defecar
• APENDICITIS: dolor que migra a fosa ilíaca derecha + fiebre — requiere cirugía urgente
• CÓLICO BILIAR: dolor intenso en hipocondrio derecho (debajo del costado derecho) después de comidas grasas, posible irradiación al hombro derecho
• PANCREATITIS: dolor muy intenso en epigastrio que irradia en cinturón hacia la espalda, empeora al acostarse, asociado a alcohol o cálculos biliares

NUNCA dar laxantes, enemas o analgésicos potentes antes de la evaluación médica en dolor abdominal grave — pueden enmascarar la causa.`,
  },

];

async function seedGaps(): Promise<void> {
  process.stdout.write(`Adding ${GAP_CHUNKS.length} gap-filling chunks to knowledge base...\n`);

  await vectorService.ensureSchema();

  const before = await vectorService.countChunks();
  process.stdout.write(`Chunks before: ${before}\n\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < GAP_CHUNKS.length; i++) {
    const chunk = GAP_CHUNKS[i];
    process.stdout.write(`[${i + 1}/${GAP_CHUNKS.length}] ${chunk.category}... `);
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

  const after = await vectorService.countChunks();
  process.stdout.write(`\nCompleted: ${successful}/${GAP_CHUNKS.length} | Failed: ${failed}\n`);
  process.stdout.write(`Chunks after: ${after}\n`);

  await vectorService.disconnect();
  process.exit(0);
}

seedGaps().catch((err) => {
  process.stderr.write(`Seed failed: ${err}\n`);
  process.exit(1);
});

/**
 * Script para agregar chunks nuevos a una base de conocimiento existente.
 * NO borra chunks previos — solo inserta los definidos aquí.
 *
 *   npx tsx src/scripts/seed-additional.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { openAIService } from "../services/openai.service";
import { vectorService } from "../services/vector.service";
import { KnowledgeChunk } from "../models/types";

const NEW_CHUNKS: KnowledgeChunk[] = [
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
];

async function seedAdditional(): Promise<void> {
  process.stdout.write(`Adding ${NEW_CHUNKS.length} new chunks to existing knowledge base...\n`);

  await vectorService.ensureSchema();

  const before = await vectorService.countChunks();
  process.stdout.write(`Chunks before: ${before}\n\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < NEW_CHUNKS.length; i++) {
    const chunk = NEW_CHUNKS[i];
    process.stdout.write(`[${i + 1}/${NEW_CHUNKS.length}] ${chunk.category}... `);
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
  process.stdout.write(`\nCompleted: ${successful}/${NEW_CHUNKS.length} | Failed: ${failed}\n`);
  process.stdout.write(`Chunks after: ${after}\n`);

  await vectorService.disconnect();
  process.exit(0);
}

seedAdditional().catch((err) => {
  process.stderr.write(`Seed failed: ${err}\n`);
  process.exit(1);
});

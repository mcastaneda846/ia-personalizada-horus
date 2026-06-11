export type EmergencyLevel = 1 | 2 | 3;

const LEVEL1_PATTERNS = [
  /no (respira|responde|late|tiene pulso)/,
  /paro (cardiaco|respiratorio)/,
  /(inconsciente|sin conocimiento|no despierta|no reacciona)/,
  /(garganta|cara|lengua).{0,25}(hinch|infla)/,
  /(no puedo|dificultad para|imposible).{0,15}respira/,
  /sangr.{0,15}(no para|abundante|chorrea|empapa)/,
  /dolor.{0,15}pecho.{0,25}(brazo|mandibula|espalda|sudor)/,
  /(derrame|acv|stroke|cara torcida|paralisis facial)/,
  /convulsion.{0,20}(no para|lleva|hace \d+\s*min)/,
  /(electrocuci|electrocut)/,
  /(bebe|niño|recien nacido).{0,20}(azul|morado|no respira)/,
  /(quiero|voy a|pienso).{0,20}(matarme|suicidarme|quitarme la vida|hacerme daño)/,
  /me (corte|corté) (una arteria|la yugular|la muñeca).{0,20}(mucho|hundo|profundo)/,
];

const LEVEL2_PATTERNS = [
  /sangr/,
  /quemadura/,
  /atragant/,
  /corte|herida profunda/,
  /reaccion alergica|me pico.{0,20}(abeja|avispa|insecto)/,
  /convulsion/,
  /desmay/,
  /fractura|hueso roto/,
  /azucar baja|hipoglucemia|me tiembla.{0,20}(todo|manos)/,
  /crisis asmatica|no (puedo|me sale|me deja) respira/,
  /golpe.{0,15}(cabeza|craneo)/,
  /me trague|se trago/,
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function detectEmergencyLevel(message: string): EmergencyLevel {
  const normalized = normalize(message);
  if (LEVEL1_PATTERNS.some((p) => p.test(normalized))) return 1;
  if (LEVEL2_PATTERNS.some((p) => p.test(normalized))) return 2;
  return 3;
}

export function detectMentalHealthCrisis(message: string): boolean {
  const normalized = normalize(message);
  return /(\bsuicid|\bmatarme\b|\bquitarme la vida\b|\bhacerme daño\b|\bno quiero (vivir|seguir|estar aqui)\b)/.test(
    normalized
  );
}

export function isThirdPerson(message: string): boolean {
  const normalized = normalize(message);
  return /(mi (mama|papa|hijo|hija|abuelo|abuela|esposo|esposa|hermano|hermana|amigo|amiga|novia|novio|pareja|bebe)|le paso a|le ocurrio a)/.test(
    normalized
  );
}

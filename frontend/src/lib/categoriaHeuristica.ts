export interface HeuristicaCategory {
  aliases: string[]; // Palabras clave para encontrar la categoría en la base de datos
  keywords: string[]; // Palabras clave para encontrar el ítem
}

/**
 * Normaliza un texto removiendo tildes, signos de puntuación y pasándolo a minúsculas.
 * Esto soluciona problemas con "Cautín" vs "cautin", "Lápices" vs "lapices", etc.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ""); // Eliminar signos de puntuación (dejar solo letras, números y espacios)
}

// Diccionario heurístico estructurado y escalable
export const HEURISTICA_CATEGORIAS: HeuristicaCategory[] = [
  {
    aliases: ['tecnologia', 'computo', 'sistemas', 'informatica'],
    keywords: [
      'computador', 'portatil', 'laptop', 'mouse', 'teclado', 'monitor', 'pantalla', 
      'impresora', 'cable', 'cargador', 'telefono', 'tv', 'televisor', 'proyector', 
      'video beam', 'videobeam', 'tablet', 'ipad', 'camara', 'switch', 'router', 
      'servidor', 'usb', 'memoria', 'diadema', 'audifonos', 'software', 'licencia', 
      'disco duro', 'ups', 'respaldo'
    ]
  },
  {
    aliases: ['mobiliario', 'muebles'],
    keywords: [
      'silla', 'mesa', 'escritorio', 'archivador', 'estante', 'estanteria', 'tablero', 
      'sofa', 'mueble', 'pupitre', 'vitrina', 'locker', 'casillero', 'repisa', 
      'poltrona', 'sillon', 'banca', 'cajonera', 'banco de trabajo'
    ]
  },
  {
    aliases: ['herramientas', 'taller', 'mecanica', 'soldadura'],
    keywords: [
      'martillo', 'destornillador', 'llave', 'hombre solo', 'taladro', 'pulidora', 
      'sierra', 'segueta', 'alicate', 'pinza', 'metro', 'flexometro', 'soldador', 
      'calibrador', 'torno', 'fresadora', 'prensa', 'cizalla', 'yunque', 'broca', 
      'bisturi', 'maceta', 'porra', 'espatula', 'gato', 'compresor', 'motor', 'bujia', 
      'llanta', 'rin', 'aceite', 'filtro', 'polea', 'rodamiento', 'embrague', 'freno', 
      'valvula', 'piston', 'exosto', 'bomper', 'amortiguador', 'bateria', 'electrodo', 
      'careta', 'esmeril', 'soplete', 'argon', 'oxigeno', 'inversor', 'estacion de soldadura',
      'nivel de burbuja'
    ]
  },
  {
    aliases: ['electricos', 'electronicos', 'electricidad', 'electronica'],
    keywords: [
      'multimetro', 'cable', 'protoboard', 'resistencia', 'condensador', 'osciloscopio', 
      'breaker', 'transformador', 'rele', 'plc', 'contacto', 'bombillo', 'roseta', 
      'toma', 'enchufe', 'interruptor', 'alambre', 'multitoma', 'fuente de poder', 
      'generador de senal', 'variador de frecuencia', 'cautin', 'estano', 'kits de electronica',
      'sensor', 'motor electrico'
    ]
  },
  {
    aliases: ['materiales', 'formacion', 'practica', 'construccion'],
    keywords: [
      'cemento', 'ladrillo', 'varilla', 'arena', 'bloque', 'palustre', 'llana', 'plomada', 
      'nivel', 'andamio', 'mezcladora', 'grada', 'tubo', 'pvc', 'teja', 'zinc', 'drywall', 
      'baldosa', 'pintura', 'estuco', 'yeso', 'madera', 'tabla', 'lamina', 'tornillo', 
      'tuerca', 'remache', 'acero', 'aluminio', 'acrilico'
    ]
  },
  {
    aliases: ['seguridad', 'dotacion', 'proteccion', 'epp'],
    keywords: [
      'casco', 'guante', 'bota', 'gafa', 'mascarilla', 'arnes', 'extintor', 'botiquin', 
      'tapaoidos', 'protector auditivo', 'overol', 'chaleco', 'senalizacion', 'cinta de peligro'
    ]
  },
  {
    aliases: ['papeleria', 'oficina'],
    keywords: [
      'resma', 'papel', 'lapiz', 'lapices', 'esfero', 'lapicero', 'boligrafo', 'marcador', 
      'borrador', 'cuaderno', 'carpeta', 'gancho', 'tijeras', 'colbon', 'pegante', 
      'cosedora', 'grapadora', 'perforadora', 'chinche', 'clip', 'cinta', 'postit', 
      'sobre', 'oficina', 'etiqueta'
    ]
  },
  {
    aliases: ['aseo', 'mantenimiento', 'limpieza'],
    keywords: [
      'aseo', 'limpieza', 'escoba', 'trapeador', 'trapero', 'churrusco', 'recogedor', 
      'balde', 'jabon', 'cloro', 'limpido', 'blanqueador', 'desinfectante', 'papel higienico', 
      'basura', 'caneca', 'trapo', 'limpiador', 'detergente', 'limpiavidrios', 'cepillo', 
      'esponja', 'ambientador', 'bolsa'
    ]
  },
  {
    aliases: ['logistica', 'almacenamiento'],
    keywords: [
      'estiba', 'pallet', 'palet', 'caja', 'canastilla', 'montacargas', 'gato hidraulico', 
      'empaque', 'zuncho', 'almacenamiento', 'contenedor', 'banda transportadora', 'carretilla'
    ]
  },
  {
    aliases: ['electrodomesticos'],
    keywords: [
      'nevera', 'microondas', 'cafetera', 'licuadora', 'aire acondicionado', 'ventilador', 
      'estufa', 'horno', 'dispensador'
    ]
  },
  {
    aliases: ['vehiculos', 'transporte'],
    keywords: [
      'carro', 'moto', 'motocicleta', 'camioneta', 'bicicleta', 'buseta', 'mula'
    ]
  }
];

/**
 * Función altamente optimizada y tolerante a fallos para sugerir una categoría.
 * Resuelve problemas de plurales, tildes, mayúsculas, y variaciones en los nombres
 * de las categorías de la base de datos mediante un sistema de aliases.
 */
export function sugerirCategoria(
  nombreItem: string, 
  categoriasDb: { id: number | string; nombre: string }[]
): string {
  if (!nombreItem || categoriasDb.length === 0) return '';

  const nombreNorm = normalizeText(nombreItem);
  const scores: Record<string, number> = {};

  // Mapear qué ID de la DB corresponde a qué bloque heurístico
  const dbCatMapping = categoriasDb.map(c => {
    const normName = normalizeText(c.nombre);
    
    // Buscar qué bloque heurístico encaja mejor con esta categoría real
    const bestHeuristicBlocks = HEURISTICA_CATEGORIAS.filter(h => 
      h.aliases.some(alias => normName.includes(alias))
    );

    return {
      id: String(c.id),
      normName,
      heuristics: bestHeuristicBlocks
    };
  });

  // 1. Coincidencia directa con el nombre de la categoría real
  dbCatMapping.forEach(c => {
    // Si la categoría es "Mobiliario", y escribo "Mobiliario para oficina"
    if (nombreNorm.includes(c.normName)) {
      scores[c.id] = (scores[c.id] || 0) + 10;
    }
  });

  // 2. Evaluación de heurísticas (Palabras clave)
  dbCatMapping.forEach(c => {
    c.heuristics.forEach(heuristicBlock => {
      heuristicBlock.keywords.forEach(kw => {
        // Buscar la palabra clave exacta como palabra individual usando regex
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(nombreNorm)) {
          // Palabras compuestas valen más
          const pesoCompuesta = kw.includes(' ') ? 3 : 1;
          // Palabras clave de contexto (ej: aseo, seguridad) valen más
          const pesoContexto = (kw === 'aseo' || kw === 'limpieza' || kw === 'seguridad') ? 5 : 0;
          
          scores[c.id] = (scores[c.id] || 0) + pesoCompuesta + pesoContexto;
        }
      });
    });
  });

  // 3. Determinar la categoría con mayor puntuación
  let mejorCategoriaId = '';
  let maxScore = 0;

  for (const [catId, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      mejorCategoriaId = catId;
    }
  }

  return mejorCategoriaId;
}

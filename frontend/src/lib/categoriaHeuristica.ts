export const HEURISTICA_CATEGORIAS: Record<string, string[]> = {
  'tecnología': [
    'computador', 'portatil', 'portátil', 'mouse', 'teclado', 'monitor', 'pantalla', 
    'impresora', 'cable', 'cargador', 'telefono', 'teléfono', 'tv', 'televisor', 
    'proyector', 'video beam', 'videobeam', 'tablet', 'ipad', 'camara', 'cámara', 
    'switch', 'router', 'servidor', 'usb', 'memoria', 'diadema', 'audifonos', 'audífonos',
    'software', 'licencia'
  ],
  'mobiliario': [
    'silla', 'mesa', 'escritorio', 'archivador', 'estante', 'estanteria', 'estantería', 
    'tablero', 'sofa', 'sofá', 'mueble', 'pupitre', 'vitrina', 'locker', 'casillero', 
    'repisa', 'poltrona', 'sillon', 'sillón', 'banca', 'cajonera'
  ],
  'herramientas': [
    'martillo', 'destornillador', 'llave', 'llave expansiva', 'hombre solo', 'taladro', 
    'pulidora', 'sierra', 'segueta', 'alicate', 'pinza', 'cinta', 'metro', 'flexometro', 
    'flexómetro', 'soldador', 'calibrador', 'torno', 'fresadora', 'prensa', 'cizalla', 
    'yunque', 'broca', 'bisturi', 'bisturí', 'maceta', 'porra', 'espatula', 'espátula',
    'gato', 'compresor'
  ],
  'construcción': [
    'cemento', 'ladrillo', 'varilla', 'arena', 'bloque', 'palustre', 'llana', 'plomada', 
    'nivel', 'andamio', 'mezcladora', 'carretilla', 'pala', 'pica', 'grada', 'tubo', 
    'pvc', 'teja', 'zinc', 'drywall', 'baldoza', 'baldosa', 'pintura', 'estuco', 'yeso', 'madera'
  ],
  'soldadura': [
    'electrodo', 'careta', 'esmeril', 'soplete', 'argon', 'argón', 'oxigeno', 'oxígeno', 
    'soldadura', 'inversor', 'estaño', 'cautin', 'cautín'
  ],
  'mecánica': [
    'motor', 'bujia', 'bujía', 'llanta', 'rin', 'rines', 'aceite', 'filtro', 
    'polea', 'rodamiento', 'embrague', 'freno', 'valvula', 'pistón', 'exosto', 
    'bomper', 'amortiguador', 'bateria', 'batería'
  ],
  'electricidad': [
    'multimetro', 'multímetro', 'cable', 'protoboard', 'resistencia', 'condensador', 
    'osciloscopio', 'breaker', 'transformador', 'rele', 'relé', 'plc', 'contacto', 
    'bombillo', 'roseta', 'toma', 'enchufe', 'interruptor', 'alambre', 'multitoma'
  ],
  'seguridad': [
    'casco', 'guante', 'bota', 'gafa', 'mascarilla', 'arnes', 'arnés', 'extintor', 
    'botiquin', 'botiquín', 'tapaoídos', 'tapaoidos', 'overol', 'chaleco', 'señalizacion',
    'cinta de peligro', 'botas'
  ],
  'electrodomésticos': [
    'nevera', 'microondas', 'cafetera', 'licuadora', 'aire acondicionado', 'ventilador', 
    'estufa', 'horno', 'dispensador'
  ],
  'papelería': [
    'resma', 'papel', 'lapiz', 'lápiz', 'esfero', 'boligrafo', 'bolígrafo', 'marcador', 
    'borrador', 'cuaderno', 'carpeta', 'gancho', 'tijeras', 'colbon', 'colbón', 'pegante', 
    'cosedora', 'grapadora', 'perforadora', 'chinche', 'clip', 'cinta', 'post-it', 'sobre',
    'oficina'
  ],
  'aseo': [
    'aseo', 'limpieza', 'escoba', 'trapeador', 'trapero', 'churrusco', 'recogedor', 'balde', 
    'jabon', 'jabón', 'cloro', 'limpido', 'límpido', 'blanqueador', 'desinfectante', 
    'papel higienico', 'basura', 'caneca', 'trapo', 'limpiador', 'detergente', 'limpiavidrios',
    'cepillo', 'esponja', 'ambientador', 'bolsa'
  ],
  'vehículos': [
    'carro', 'moto', 'motocicleta', 'camioneta', 'bicicleta', 'buseta', 'mula'
  ],
  'logística': [
    'estiba', 'pallet', 'caja', 'canastilla', 'montacargas', 'gato hidraulico', 'gato hidráulico',
    'empaque', 'zuncho', 'almacenamiento'
  ]
};

/**
 * Función optimizada para sugerir una categoría basada en el nombre del ítem.
 * Utiliza un sistema de puntuación (scoring) para resolver colisiones (ej: "Guantes de aseo").
 */
export function sugerirCategoria(
  nombreItem: string, 
  categoriasDb: { id: number | string; nombre: string }[]
): string {
  if (!nombreItem || categoriasDb.length === 0) return '';

  const nombreLower = nombreItem.toLowerCase();
  
  // 1. Búsqueda directa exacta mejorada
  // Si la categoría de la DB dice "Aseo y Mantenimiento", y el usuario escribe "Aseo", esto lo detecta.
  const matchDirecto = categoriasDb.find(c => 
    nombreLower === c.nombre.toLowerCase() || 
    c.nombre.toLowerCase() === nombreLower
  );
  if (matchDirecto) return String(matchDirecto.id);

  // 2. Sistema de puntuación (Scoring)
  const scores: Record<string, number> = {};

  // Puntos por nombre de categoría de la DB (coincidencias parciales)
  categoriasDb.forEach(c => {
    const catNombreLower = c.nombre.toLowerCase();
    const catId = String(c.id);
    
    // Si el nombre ingresado contiene palabras de la categoría real (Ej: "Aseo" en "Carro de Aseo")
    const palabrasCategoria = catNombreLower.split(/[\s,]+/);
    palabrasCategoria.forEach(palabra => {
      if (palabra.length > 3 && nombreLower.includes(palabra)) {
        scores[catId] = (scores[catId] || 0) + 2; // +2 puntos por coincidir con el nombre de la DB
      }
    });
  });

  // Puntos por diccionario heurístico
  for (const [catName, keywords] of Object.entries(HEURISTICA_CATEGORIAS)) {
    // Buscar categoría en la DB que sea equivalente a nuestra catName heurística
    const dbCategory = categoriasDb.find(c => 
      c.nombre.toLowerCase().includes(catName.toLowerCase()) || 
      catName.includes(c.nombre.toLowerCase())
    );

    if (dbCategory) {
      const catId = String(dbCategory.id);
      
      keywords.forEach(kw => {
        // Usar regex para coincidencia de palabra exacta y evitar falsos positivos
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(nombreLower) || nombreLower.includes(kw)) {
          // Palabras compuestas valen más puntos (ej: "video beam", "hombre solo")
          const peso = kw.includes(' ') ? 3 : 1;
          
          // Contextos dominantes como "aseo" o "limpieza" en nombres de items dan extra
          const pesoContexto = (kw === 'aseo' || kw === 'limpieza' || kw === 'seguridad') ? 5 : 0;
          
          scores[catId] = (scores[catId] || 0) + peso + pesoContexto;
        }
      });
    }
  }

  // 3. Determinar el ganador
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

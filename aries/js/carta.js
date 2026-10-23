/* =====================================================================================================
   LA CARTA DE ARIES BISTRO BAR · el único sitio que hay que tocar para rellenarla (ver ../LEEME.md).

   Carta impresa de junio de 2026 (foto de Google Maps), transcrita literal en ../01-investigacion/carta.md. Precios sin
   confirmar por el dueño. Salen las pestañas SOLO de los apartados con platos, en este orden; sin ninguno, el respaldo.

   Cada apartado:  { nombre: 'Tostas', pestana: 'Tostas' (opcional, nombre corto), foto: 'tostas' | 'raciones' | 'ensaladas' | '' (opcional), platos: [ … ] }
   Cada plato:     { nombre: 'Nombre tal cual en su carta', desc: 'Descripción si la trae (opcional)', precio: '8,50 €' }
     · Varios precios: precios: [['Ración', '12 €'], ['Media', '7 €']]   · Sin precio: no pongas ni precio ni precios.
     · Escribe el precio como en su carta ("8,50 €", "s/m"). Nada inventado: ni platos, ni precios, ni alérgenos.
   fecha: el mes de la carta, para el pie ("junio de 2026" → "Carta de junio de 2026. Precios a confirmar.").
   Apartados nuevos (Desayunos, Postres, Copas…): copia una línea y cámbiale el nombre; los vacíos no salen.
   ===================================================================================================== */
window.CARTA = {
  fecha: 'junio de 2026',
  apartados: [
    { nombre: 'Ensaladas', foto: 'ensaladas', platos: [
      { nombre: 'Ensalada Cesar', desc: 'Lechuga, pollo, picatostes de pan frito, queso parmesano y salsa cesar.', precio: '10,00 €' },
      { nombre: 'Ensalada Ventresca Aries', desc: 'Ventresca, cebolla morada, sal, pimienta y aderezo de la casa.', precio: '11,90 €' },
      { nombre: 'Tartar de Aguacate', desc: 'Aguacate, tomate de rama, perlas de mozarella, semillas de calabaza.', precio: '10,00 €' },
      { nombre: 'Ensalada de Burrata', desc: 'Burrata, rúcula, tomate, pesto de albahaca, miel y almendras.', precio: '11,00 €' }
    ] },
    { nombre: 'Tostas', foto: 'tostas', platos: [
      { nombre: 'Tosta de solomillo', desc: 'Solomillo, queso brie, crema balsámica y cebolla caramelizada.', precio: '8,50 €' },
      { nombre: 'Tosta de gulas y gambas', precio: '8,50 €' },
      { nombre: 'Tosta de salmón y aguacate', precio: '10,00 €' }
    ] },
    { nombre: 'Entrantes', foto: '', platos: [
      { nombre: 'Croquetas de Jamon', precio: '10,00 €' },
      { nombre: 'Croquetas de Rabo de toro', precio: '10,00 €' },
      { nombre: 'Croquetas de Cecina', precio: '10,00 €' },
      { nombre: 'Nachos', desc: 'Guacamole, philadelphia, pico de gallo, cuatro quesos, queso chédar y jalapeños.', precio: '12,00 €' },
      { nombre: 'Tequeños', precio: '10,00 €' },
      { nombre: 'Gambas al ajillo', precio: '10,00 €' }
    ] },
    { nombre: 'Del Mar', foto: '', platos: [
      { nombre: 'Calamares', precio: '11,00 €' },
      { nombre: 'Rejos', precio: '11,00 €' },
      { nombre: 'Pulpo con pure de patatas', precio: '18,00 €' },
      { nombre: 'Sepia a la plancha', precio: '14,00 €' }
    ] },
    { nombre: 'Para Compartir', foto: '', platos: [
      { nombre: 'Patatas Mixtas', precio: '7,50 €' },
      { nombre: 'Alitas', precio: '10,00 €' },
      { nombre: 'Oreja a la Plancha', precio: '10,00 €' },
      { nombre: 'Huevos Rotos con Jamón Ibérico', precio: '14,00 €' },
      { nombre: 'Huevos rotos con Gulas y Gambas', precio: '14,00 €' },
      { nombre: 'Bastones de Berenjena', precio: '10,00 €' },
      { nombre: 'Fingers de pollo', precio: '10,00 €' },
      { nombre: 'Cachopo con Patatas', precio: '15,00 €' },
      { nombre: 'Torreznos de Soria con Pure de Patatas', precio: '13,00 €' },
      { nombre: 'Tempura de Langostinos', precio: '10,00 €' }
    ] },
    { nombre: 'Hamburguesas', foto: '', platos: [
      { nombre: 'Hamburguesa Americana', desc: 'Carne, Bacon, lechuga, queso crema, cebolla frita y tomate.', precio: '12,00 €' },
      { nombre: 'Hamburguesa Mexicana', desc: 'Carne, pico de gallo, jalapeño, guacamole, queso chedar y nachos.', precio: '12,00 €' },
      { nombre: 'Gourmet Estilo Aries', desc: 'Carne, cebolla caramelizada, Bacon, huevo, tomate, lechuga y salsa miel.', precio: '13,00 €' }
    ] },
    { nombre: 'A la brasa', foto: '', platos: [
      { nombre: 'Entrecot Trinchado con patatas', precio: '18,00 €' },
      { nombre: 'Entraña Trinchada con patatas', precio: '15,00 €' },
      { nombre: 'Secreto de Cerdo', precio: '14,00 €' },
      { nombre: 'Pechuga de pollo a la brasa', precio: '10,00 €' }
    ] },
    { nombre: 'Postres', foto: '', platos: [
      { nombre: 'Tarta de queso', precio: '5,50 €' },
      { nombre: 'Tarta Tiramisú', precio: '5,50 €' }
    ] }
  ]
};

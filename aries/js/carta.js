/* =====================================================================================================
   LA CARTA DE ARIES BISTRO BAR · el único sitio que hay que tocar para rellenarla (ver ../LEEME.md).

   CONFIRMAR: falta la carta. Mientras ningún apartado tenga platos, la web enseña el respaldo (los apartados que se
   saben, "La carta, en el local" y tres fotos de mesas). En cuanto un apartado tenga un plato, salen las pestañas,
   SOLO de los apartados con platos, en este orden.

   Cada apartado:  { nombre: 'Tostas', pestana: 'Tostas' (opcional, nombre corto), foto: 'tostas' | 'raciones' | 'ensaladas' | '' (opcional), platos: [ … ] }
   Cada plato:     { nombre: 'Nombre tal cual en su carta', desc: 'Descripción si la trae (opcional)', precio: '8,50 €' }
     · Varios precios: precios: [['Ración', '12 €'], ['Media', '7 €']]   · Sin precio: no pongas ni precio ni precios.
     · Escribe el precio como en su carta ("8,50 €", "s/m"). Nada inventado: ni platos, ni precios, ni alérgenos.
   fecha: el mes de la carta, para el pie ("junio de 2026" → "Carta de junio de 2026. Precios a confirmar.").
   Apartados nuevos (Desayunos, Postres, Copas…): copia una línea y cámbiale el nombre; los vacíos no salen.
   ===================================================================================================== */
window.CARTA = {
  fecha: '',
  apartados: [
    { nombre: 'Ensaladas', foto: 'ensaladas', platos: [] },
    { nombre: 'Tostas',    foto: 'tostas',    platos: [] },
    { nombre: 'Raciones',  foto: 'raciones',  platos: [] },
    { nombre: 'Brochetas', foto: '',          platos: [] },
    { nombre: 'Carnes',    foto: '',          platos: [] }
  ]
};

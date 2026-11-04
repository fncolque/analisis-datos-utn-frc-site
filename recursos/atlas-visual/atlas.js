const ramas = [
  {
    nombre:"Comparar", titulo:"Comparar categorías", pregunta:"¿Qué diferencia querés que se pueda leer?", color:"#f6ce72",
    icono:'<path d="M4 3v22M6 6h23M6 13h16M6 20h10" stroke-width="3"/>',
    opciones:[
      {
        id:"barras", opcion:"Ordenar de mayor a menor", nombre:"Barras ordenadas",
        razon:"La longitud permite ordenar regiones por la misma medida.",
        ejemplo:"Ventas netas por región · miles de USD", lectura:"Patagonia lidera con 64.403,20 USD. Otros 5.150 USD corresponden al cliente C099, sin región asignada.",
        armado:"Barras. Eje Y: Regiones[region]. Eje X: [Ventas netas]. Ordená de mayor a menor y conservá «(En blanco)».",
        cuidado:"Si ocultás «(En blanco)», las barras dejan de sumar el total de ventas.",
        prueba:"Seleccioná la barra sin región. ¿Qué clave buscarías en customers.csv?"
      },
      {
        id:"desvio", opcion:"Medir una brecha frente al objetivo", nombre:"Barras divergentes",
        razon:"El cero representa la meta. La dirección indica si falta vender o si ya se superó.",
        ejemplo:"Ventas menos objetivo del trimestre · miles de USD", lectura:"Patagonia supera su objetivo en 19.403,20 USD. Cuyo tiene una meta de 20.000 USD y ninguna venta.",
        armado:"Barras por Regiones[region]. Usá [Ventas netas] − [Objetivo T1] como valor y excluí la región en blanco, que carece de objetivo.",
        cuidado:"Compará el trimestre completo con la meta trimestral.",
        prueba:"Buscá qué región necesita el mayor importe adicional para llegar al objetivo."
      },
      {
        id:"matriz", opcion:"Consultar varios valores exactos", nombre:"Matriz",
        razon:"La fila y la columna identifican una combinación. La celda permite consultar su importe.",
        ejemplo:"Ventas netas por familia y canal · miles de USD", lectura:"Bombas suma 71.381,20 USD entre los tres canales. La familia en blanco corresponde al producto P031.",
        armado:"Matriz. Filas: Productos[family]. Columnas: Ventas[channel]. Valores: [Ventas netas].",
        cuidado:"El punto indica que no hay líneas en esa combinación. Conservá la fila sin familia.",
        prueba:"Seleccioná Bombas y compará sus importes por canal."
      }
    ]
  },
  {
    nombre:"Ver evolución", titulo:"Leer el tiempo", pregunta:"¿Qué aspecto de la secuencia importa?", color:"#9fd8ed",
    icono:'<path d="M3 3v21h28" opacity=".5"/><path d="m5 19 6-6 5 3 7-10 6 3" stroke-width="2.6"/>',
    opciones:[
      {
        id:"linea", opcion:"Seguir una tendencia", nombre:"Gráfico de líneas",
        razon:"El eje temporal conserva el orden y permite localizar una caída o una recuperación.",
        ejemplo:"Ventas netas mensuales · miles de USD", lectura:"Febrero baja a 25.240,60 USD. Marzo recupera parte de la caída y termina en 37.784,15 USD.",
        armado:"Líneas. Eje X: Calendario[Mes], ordenado por Mes número. Eje Y: [Ventas netas].",
        cuidado:"Tres meses permiten describir el trimestre. Para hablar de estacionalidad harían falta más ciclos.",
        prueba:"Filtrá Ventas[channel] por Portal B2B. ¿En qué mes alcanza su máximo?"
      },
      {
        id:"columnas", opcion:"Contrastar pocos períodos y series", nombre:"Columnas agrupadas",
        razon:"Las columnas contiguas permiten comparar canales dentro del mismo mes.",
        ejemplo:"Ventas mensuales por canal · miles de USD", lectura:"Ejecutivo de cuenta lidera en enero. En marzo, Distribuidor encabeza las ventas con 17.407,50 USD.",
        armado:"Columnas agrupadas. X: Calendario[Mes]. Y: [Ventas netas]. Leyenda: Ventas[channel].",
        cuidado:"Enero tiene dos canales con ventas. Distribuidor aparece desde febrero.",
        prueba:"Compará los canales en febrero. ¿Se conserva ese orden en marzo?"
      },
      {
        id:"calor", opcion:"Cruzar el mes con el día de semana", nombre:"Mapa de calor",
        razon:"El color revela qué combinaciones de mes y día reúnen más líneas.",
        ejemplo:"Líneas de venta por mes y día de semana", lectura:"El cruce más intenso es enero y viernes, con 8 líneas. En todo el trimestre hubo 17 líneas de viernes.",
        armado:"Matriz. Filas: Calendario[Mes]. Columnas: día de semana de Ventas[order_date]. Valores: recuento de Ventas[line_id]. Aplicá color de fondo por valor.",
        cuidado:"Un pedido puede tener varias líneas. La celda cuenta líneas, no pedidos distintos.",
        prueba:"Cambiá el valor a [Pedidos]. ¿Qué celdas cambian?"
      }
    ]
  },
  {
    nombre:"Ver distribución", titulo:"Explorar la distribución", pregunta:"¿Querés ver frecuencias o comparar grupos?", color:"#c6d9a2",
    icono:'<path d="M2 24h29" opacity=".55"/><path d="M5 23v-6m5 6V8m5 15V4m5 19V11m5 12v-8" stroke-width="4"/>',
    opciones:[
      {
        id:"histograma", opcion:"Encontrar concentraciones y colas", nombre:"Histograma",
        razon:"Cada barra cuenta las líneas cuyo importe cae en el mismo intervalo.",
        ejemplo:"Importe por línea · miles de USD en X, cantidad de líneas en Y", lectura:"45 de las 58 líneas valen menos de 2.000 USD. Una supera los 10.000 USD.",
        armado:"Creá la columna de intervalo indicada abajo. En un gráfico de columnas, llevá Inicio intervalo a X y el recuento de Ventas[line_id] a Y.",
        cuidado:"Una línea de 2.000 USD entra en el segundo intervalo. La altura cuenta líneas de pedido.",
        prueba:"¿Cuántas líneas quedan juntas si el primer intervalo va de 0 a menos de 4.000 USD?"
      },
      {
        id:"cajas", opcion:"Comparar la variabilidad entre grupos", nombre:"Diagrama de cajas",
        razon:"La caja contiene la mitad central de las líneas. La marca interior indica la mediana.",
        ejemplo:"Importe por línea y canal · miles de USD", lectura:"Distribuidor tiene la menor mediana (931 USD) y la caja más ancha. Sus importes centrales son los más dispersos.",
        armado:"En un visual de cajas habilitado, agrupá por Ventas[channel] y usá Ventas[net_sales_usd] con una observación por line_id.",
        cuidado:"La ficha usa cuartiles inclusivos y bigotes mínimo–máximo. Revisá esa configuración en el visual.",
        prueba:"Compará las cajas de Portal B2B y Ejecutivo de cuenta. ¿Qué diferencia se ve en sus máximos?"
      }
    ]
  },
  {
    nombre:"Relacionar", titulo:"Relacionar variables", pregunta:"¿Cuántas medidas describen cada observación?", color:"#f4b8a2",
    icono:'<path d="M3 3v21h28" opacity=".5"/><g fill="currentColor" stroke="none"><circle cx="8" cy="18" r="2"/><circle cx="13" cy="13" r="2"/><circle cx="18" cy="16" r="2"/><circle cx="21" cy="8" r="2"/><circle cx="27" cy="5" r="2.2"/></g>',
    opciones:[
      {
        id:"dispersion", opcion:"Cruzar dos medidas", nombre:"Gráfico de dispersión",
        razon:"Un punto por cliente permite comparar frecuencia de compra e importe total.",
        ejemplo:"Pedidos en X · ventas netas en Y (miles de USD)", lectura:"C006 hizo 6 pedidos y compró por menos que C002, que hizo 5.",
        armado:"Dispersión. X: [Pedidos]. Y: [Ventas netas]. Separá los puntos por Ventas[customer_id].",
        cuidado:"Usá el identificador de Ventas para que C099 conserve su punto aunque falte en Clientes.",
        prueba:"Buscá dos clientes con la misma cantidad de pedidos. Compará sus ventas."
      },
      {
        id:"burbujas", opcion:"Agregar el volumen de cada caso", nombre:"Gráfico de burbujas",
        razon:"El área añade el volumen vendido a la comparación entre frecuencia e importe.",
        ejemplo:"Pedidos en X · ventas netas en Y · área según unidades", lectura:"C006 reúne 38 unidades y C002, 18. La burbuja más grande pertenece a C006, aunque C002 factura más.",
        armado:"Dispersión. X: [Pedidos]. Y: [Ventas netas]. Detalle: Ventas[customer_id]. Tamaño: suma de Ventas[quantity].",
        cuidado:"Las burbujas cercanas pueden superponerse. Consultá sus valores exactos.",
        prueba:"Compará C001 y C007. ¿Cómo cambia la posición cuando la cantidad de unidades es la misma?"
      }
    ]
  },
  {
    nombre:"Desglosar", titulo:"Explicar un total", pregunta:"¿Qué comparación entre el todo y sus partes necesitás?", color:"#d4bdeb",
    icono:'<g fill="currentColor" stroke="none"><path d="M15 3a11 11 0 1 0 12 12H15z"/><path opacity=".6" d="M18 1v11h11A11 11 0 0 0 18 1"/></g>',
    opciones:[
      {
        id:"anillo", opcion:"Describir las partes de un solo total", nombre:"Gráfico de anillo",
        razon:"Cada arco expresa qué parte de una misma venta total pertenece a un canal.",
        ejemplo:"Participación de cada canal en las ventas del T1", lectura:"Ejecutivo de cuenta aporta 48.686,45 de los 105.520,35 USD del trimestre, cerca del 46 %.",
        armado:"Anillo. Leyenda: Ventas[channel]. Valores: [Ventas netas]. Mostrá el porcentaje del total.",
        cuidado:"Unificá «portal b2b» y «Portal B2B» al preparar Ventas.",
        prueba:"Filtrá marzo. ¿Qué canal ocupa ahora el mayor arco?"
      },
      {
        id:"porcentaje", opcion:"Comparar proporciones entre períodos", nombre:"Barras 100 % apiladas",
        razon:"Todas las barras representan el 100 % de su mes. Los tramos comparan la mezcla de canales.",
        ejemplo:"Participación mensual en ventas por canal", lectura:"Portal B2B pasa del 21,2 % en enero al 40,3 % en marzo. El denominador cambia con el mes.",
        armado:"Barras 100 % apiladas. Eje: Calendario[Mes]. Leyenda: Ventas[channel]. Valores: [Ventas netas].",
        cuidado:"Un porcentaje mayor puede coincidir con un importe menor. Consultá ambos en la marca.",
        prueba:"Pasá a «Comparar importes y totales». ¿Qué pasó con las ventas de Portal B2B en febrero?"
      },
      {
        id:"apiladas", opcion:"Comparar importes y totales", nombre:"Barras apiladas",
        razon:"Los tramos muestran aportes por canal y el extremo de la barra indica el total mensual.",
        ejemplo:"Ventas mensuales por canal · miles de USD", lectura:"Portal B2B baja de 8.996,20 USD en enero a 7.270,60 USD en febrero, aunque gana participación.",
        armado:"Barras apiladas. Eje: Calendario[Mes]. Leyenda: Ventas[channel]. Valores: [Ventas netas].",
        cuidado:"Compará los extremos para leer el total. Usá la selección para leer un tramo interior.",
        prueba:"Pasá a «Comparar proporciones entre períodos». ¿Por qué Portal B2B gana participación en febrero?"
      },
      {
        id:"cascada", opcion:"Explicar el cambio entre dos meses", nombre:"Gráfico de cascada",
        razon:"Cada escalón añade el cambio frente al mes anterior. El total llega al valor de marzo.",
        ejemplo:"De las ventas de enero a las de marzo · miles de USD", lectura:"Desde enero, las ventas caen 17.255 USD en febrero y recuperan 12.543,55 USD en marzo.",
        armado:"Cascada. Categoría: Calendario[Mes] en orden cronológico. Valor: la medida de variación mensual de abajo. Mostrá el total.",
        cuidado:"El primer escalón toma las ventas de enero completas porque el calendario comienza en enero.",
        prueba:"Comprobá que el total de la cascada coincida con marzo en el gráfico de líneas."
      }
    ]
  },
  {
    nombre:"Ubicar", titulo:"Leer el territorio", pregunta:"¿Cada dato representa una zona o un punto?", color:"#a3dbcc",
    icono:'<path d="m3 7 8-4 9 4 8-4v17l-8 4-9-4-8 4zM11 3v17m9-13v17" stroke-width="1.8"/>',
    opciones:[
      {
        id:"regiones", opcion:"Comparar tasas entre regiones", nombre:"Mapa coroplético",
        razon:"Un tono por provincia permite comparar la proporción de su cartera que compró.",
        ejemplo:"Clientes con compras por provincia · cartograma esquemático", lectura:"En Córdoba compraron 2 de 3 clientes. En Jujuy, el único cliente registrado quedó sin ventas.",
        armado:"En Azure Maps usá la capa coroplética. Ubicación: provincia de Clientes, con país Argentina. Color: la medida Clientes activos % de abajo.",
        cuidado:"Leé el denominador de cada provincia. En algunas hay un solo cliente registrado.",
        prueba:"Compará Córdoba y Neuquén. ¿Tienen igual cantidad de clientes activos?"
      },
      {
        id:"ubicaciones", opcion:"Ubicar puntos y mostrar su volumen", nombre:"Mapa de burbujas",
        razon:"La posición ubica cada ciudad. El área del círculo representa sus ventas.",
        ejemplo:"Ventas por ciudad de Córdoba · miles de USD · esquema", lectura:"Córdoba capital suma 18.275,35 USD y Villa María 4.159,70 USD. Río Cuarto tiene un cliente sin ventas.",
        armado:"En Azure Maps usá burbujas. Filtrá Clientes[provincia] por Córdoba y ubicá Clientes[ciudad] con provincia y país. Tamaño: [Ventas netas].",
        cuidado:"El círculo hueco señala una ciudad sin ventas. Power BI puede omitirla cuando el tamaño queda en blanco.",
        prueba:"Seleccioná Villa María y contrastá el importe con una tabla filtrada a esa ciudad."
      }
    ]
  }
];

const el = id => document.getElementById(id);
const dos = n => String(n).padStart(2,"0");
const glyph = rama => `<svg viewBox="0 0 32 27" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${rama.icono}</svg>`;
// Las siluetas orientan la elección antes de abrir la ficha de tamaño completo.
const siluetas = {
  barras:"M2 4h24M2 10h17M2 16h10", desvio:"M15 1v20M15 5h12M15 10h7M15 15H5", matriz:"M1 3h26v15H1zM1 8h26M1 13h26M13 3v15",
  linea:"m1 17 6-7 5 3 6-9 4 3 5-6", columnas:"M3 19v-8m4 8V7m6 12V5m4 14v-9m6 9V6m4 13V2",
  calor:"M2 3h5v5H2zM12 3h5v5h-5zM22 3h5v5h-5zM2 13h5v5H2zM12 13h5v5h-5zM22 13h5v5h-5z",
  histograma:"M1 19h26M4 18v-7m5 7V6m5 12V2m5 16V7m5 11v-7", cajas:"M1 6h26M7 3h11v6H7zM13 3v6M3 16h23m-16-3h11v6H10zM16 13v6",
  dispersion:"M3 17h2m2-5h2m4 2h2m1-9h2m3 4h2m1-7h2", burbujas:"M6 13a2 2 0 1 0 .1 0m8-6a3 3 0 1 0 .1 0m8-6a4 4 0 1 0 .1 0",
  anillo:"M23 11a9 9 0 1 1-18 0 9 9 0 1 1 18 0M14 2v5m8 8-4-2",
  porcentaje:"M1 3h26v5H1zM16 3v5M1 13h26v5H1zM11 13v5", apiladas:"M1 3h17v5H1zM10 3v5M1 13h26v5H1zM13 13v5",
  cascada:"M2 19V9h5v10zM7 9h3V4h5v5zM15 4h3v3h5V4zM24 19V7h4v12z",
  regiones:"m1 5 8-4 9 5 8-2v13l-8 4-9-5-8 3zM9 1v15m9-10v15", ubicaciones:"M2 19 9 4l9 4 8-5M7 14a2 2 0 1 0 .1 0m11-7a3 3 0 1 0 .1 0"
};
let ramaActiva=0;

const calculos = {
  desvio:["Medida de brecha","Brecha T1 = COALESCE([Ventas netas], 0) - [Objetivo T1]"],
  histograma:["Columna DAX para el eje X","Inicio intervalo = 2000 * INT(Ventas[net_sales_usd] / 2000)"],
  cascada:["Medida de variación","Variación mensual =\n    [Ventas netas] - CALCULATE(\n        [Ventas netas],\n        DATEADD(Calendario[Date], -1, MONTH)\n    )"],
  regiones:["Medida de clientes activos","Clientes activos % = DIVIDE(\n    COALESCE(DISTINCTCOUNT(Ventas[customer_id]), 0),\n    DISTINCTCOUNT(Clientes[customer_id])\n)"]
};

function elegirOpcion(index, navegar=false) {
  const rama=ramas[ramaActiva], ficha=rama.opciones[index];
  el("scenarios").querySelectorAll("button").forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));
  el("sheet-id").textContent=`Ficha ${dos(ramaActiva+1)}.${dos(index+1)} / ${rama.nombre}`;
  el("chart-name").textContent=ficha.nombre;
  el("reason").textContent=ficha.razon;
  el("plot-title").textContent=ficha.ejemplo;
  el("reading").textContent=ficha.lectura;
  el("build").textContent=ficha.armado;
  const calculo=calculos[ficha.id];
  el("formula").hidden=!calculo;
  el("formula").open=false;
  if(calculo) {
    el("formula-label").textContent=calculo[0];
    el("formula-code").textContent=calculo[1];
  }
  el("pitfall").textContent=ficha.cuidado;
  el("experiment").textContent=ficha.prueba;
  graficos.mostrar(el("plot"),ficha.ejemplo,graficos.make[ficha.id]);
  if(navegar && window.matchMedia("(max-width:760px)").matches) el("chart-name").focus();
}
function elegirRama(index,navegar=false) {
  ramaActiva=index;
  const rama=ramas[index];
  el("branches").querySelectorAll("button").forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));
  el("route-id").textContent=`Rama ${dos(index+1)} / 06`;
  el("route-title").textContent=rama.titulo;
  el("route-question").textContent=rama.pregunta;
  el("scenarios").innerHTML=rama.opciones.map(opcion=>`<button type="button" aria-controls="ficha"><svg viewBox="0 0 30 22" aria-hidden="true"><path d="${siluetas[opcion.id]}"/></svg>${opcion.opcion}<span aria-hidden="true">→</span></button>`).join("");
  el("scenarios").querySelectorAll("button").forEach((button,i)=>button.onclick=()=>elegirOpcion(i,true));
  elegirOpcion(0);
  if(navegar) {
    el("route-title").focus({preventScroll:true});
    el("recorrido").scrollIntoView({block:"start"});
  }
}

el("branches").innerHTML=ramas.map((rama,i)=>`<button class="branch" style="--swatch:${rama.color}" type="button" aria-controls="recorrido">${glyph(rama)}${rama.nombre}<small aria-hidden="true">${dos(i+1)}</small></button>`).join("");
el("branches").querySelectorAll("button").forEach((button,i)=>button.onclick=()=>elegirRama(i,true));
elegirRama(0);

const canales=datos.canales.map((nombre,i)=>({
  nombre, ventas:graficos.totalesCanal[i], pedidos:datos.pedidosCanal[i]
}));
el("lab-rows").innerHTML=canales.map(c=>`<tr><th scope="row">${c.nombre}</th><td>${graficos.usd(c.ventas)}</td><td>${c.pedidos}</td></tr>`).join("");
function cambiarMedida(medida) {
  const ticket=medida==="ticket";
  const rows=canales.map(c=>{
    const importe=ticket?c.ventas/c.pedidos:c.ventas;
    const detalle=`${c.nombre} · ${graficos.usd(c.ventas)} en ${c.pedidos} pedidos. Ticket promedio de ${graficos.usd(c.ventas/c.pedidos)}.`;
    return [c.nombre==="Ejecutivo de cuenta"?"Ejecutivo":c.nombre,importe/1000,detalle];
  }).sort((a,b)=>b[1]-a[1]);
  const title=ticket?"Ticket promedio · miles de USD por pedido":"Ventas netas por canal · miles de USD";
  el("metric").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.metric===medida)));
  el("lab-chart-title").textContent=title;
  graficos.mostrar(el("lab-plot"),title,m=>graficos.barras(m,rows,ticket?5:50,"mil USD"));
  el("lab-reading").textContent=ticket?"Distribuidor lidera con 4.224,25 USD por pedido. Sus 6 pedidos aportaron 25.345,50 USD.":"Ejecutivo de cuenta lidera con 48.686,45 USD en 15 pedidos. Cambiá a ticket promedio para comparar cuánto factura cada canal por pedido.";
}
el("metric").querySelectorAll("button").forEach(b=>b.onclick=()=>cambiarMedida(b.dataset.metric));
cambiarMedida("ventas");


(function(){
'use strict';
const $ = (s,el)=>(el||document).querySelector(s);
const $$ = (s,el)=>Array.from((el||document).querySelectorAll(s));
const esc = s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function renderTable(cfg){
  const cols = cfg.cols.map(c=>typeof c==='string'?{name:c}:c), rows = cfg.rows;
  let h = '<table>'+(cfg.caption?'<caption>'+cfg.caption+'</caption>':'')+'<thead><tr>';
  cols.forEach(k=>{ h+='<th class="'+[(k.pk?'pk':k.fk?'fk':''),k.sel?'sel':''].join(' ')+'" data-col="'+esc(k.name)+'">'+esc(k.name).replace(/_/g,'_<wbr>')+(k.pk?'<span class="tag pk">PK</span>':'')+(k.fk?'<span class="tag fk">FK</span>':'')+'</th>';});
  h+='</tr></thead><tbody>';
  rows.forEach(r=>{h+='<tr'+(r._cls?' class="'+r._cls+'"':'')+'>';cols.forEach(k=>{const v=r[k.name];
    const cls=[k.pk?'pk':'',k.fk?'fk':'',k.sel?'sel':'',r._bad&&r._bad.includes(k.name)?'bad':'',r._ok&&r._ok.includes(k.name)?'ok':'',v===null?'null':'',r._ghost?'ghost':'',r._cc&&r._cc[k.name]?r._cc[k.name]:''].filter(Boolean).join(' ');
    const raw = r._html&&r._html[k.name]!=null ? r._html[k.name] : (v===null?'NULL':esc(v===undefined?'':v));
    h+='<td class="'+cls+'" data-col="'+esc(k.name)+'"'+(r._style&&r._style[k.name]?' style="'+r._style[k.name]+'"':'')+'>'+raw+'</td>';});h+='</tr>';});
  return h+'</tbody></table>';
}
function say(id,t,cls){const m=$('#'+id);m.className='msg'+(cls?' '+cls:'');m.innerHTML=t;}

/* ---------- datos de muestra de Faro Sur (compartidos por todas las slides) ---------- */
const DATA = {
 customers:{grain:'un cliente',cols:[{name:'customer_id',pk:1},'customer_name','cuit','region','segmento'],rows:[
  ['CLI01','Andina SA','30-70123456-1','Centro','Industria'],
  ['CLI02','Pampa SRL','30-70987654-3','Sur','Distribuidor'],
  ['CLI03','Litoral SA','30-71555555-9','Litoral','Industria'],
  ['CLI04','Norte Minera','30-71222222-4','Norte','Minería'],
  ['CLI05','Cuyo Riego SA','30-71888888-7','Cuyo','Agro']]},
 products:{grain:'un producto',cols:[{name:'product_id',pk:1},'description','familia','costo_estandar'],rows:[
  ['PR10','Bomba X','Bombas',8500],['PR20','Válvula Y','Válvulas',1200],['PR30','Filtro Z','Filtros',600],['PR40','Motor W','Motores',15000],['PR50','Manguera V','Accesorios',300]]},
 sales_orders:{grain:'un pedido',cols:[{name:'order_id',pk:1},'order_date','canal',{name:'customer_id',fk:1}],rows:[
  ['P100','2026-08-01','Directo','CLI01'],['P101','2026-08-02','Web','CLI01'],['P102','2026-08-03','Directo','CLI02'],['P103','2026-08-04','Distribuidor','CLI03'],['P104','2026-08-05','Web','CLI04'],['P105','2026-08-06','Directo','CLI02']]},
 sales_order_lines:{grain:'una línea de pedido',cols:[{name:'order_line_id',pk:1},{name:'order_id',fk:1},{name:'product_id',fk:1},'cantidad','precio_unitario','descuento'],rows:[
  [1,'P100','PR10',2,12000,0],[2,'P100','PR20',5,1800,0.1],[3,'P101','PR10',1,12000,0],[4,'P102','PR30',10,900,0.05],[5,'P102','PR50',20,450,0],[6,'P103','PR40',1,21000,0],[7,'P103','PR20',8,1800,0.1],[8,'P104','PR10',3,12000,0.15],[9,'P105','PR30',4,900,0],[10,'P105','PR20',2,1800,0]]},
 shipments:{grain:'un despacho asociado a una línea',cols:[{name:'shipment_id',pk:1},{name:'order_line_id',fk:1},'fecha_entrega','costo_flete'],rows:[
  ['S1',1,'2026-08-05',1200],['S2',2,null,0],['S3',3,'2026-08-07',null],['S4',4,null,null],['S5',6,'2026-08-09',2500],['S6',8,'2026-08-10',1800]]},
 inventory_snapshots:{grain:'un producto en una ubicación en una fecha',cols:[{name:'product_id',pk:1},{name:'ubicacion',pk:1},{name:'fecha',pk:1},'stock'],rows:[
  ['PR10','Depósito A','2026-08-01',40],['PR10','Depósito A','2026-08-02',38],['PR10','Depósito B','2026-08-01',12],['PR20','Depósito A','2026-08-01',150],['PR20','Depósito A','2026-08-02',145],['PR30','Depósito B','2026-08-01',80],['PR30','Depósito B','2026-08-02',70]]}
};
const colName = c=>typeof c==='string'?c:c.name;
function rowsOf(name){const t=DATA[name];return t.rows.map(r=>{const o={};t.cols.forEach((c,i)=>o[colName(c)]=r[i]);return o;});}
function tbl(name,extra){const t=DATA[name];return Object.assign({caption:name+' <small>'+t.grain+'</small>',cols:t.cols.slice(),rows:rowsOf(name)},extra||{});}
/* esquema estrella derivado de los datos operacionales */
(function buildStar(){
  const cust=rowsOf('customers'),prod=rowsOf('products'),ord=rowsOf('sales_orders'),lines=rowsOf('sales_order_lines');
  const dates=[...new Set(ord.map(o=>o.order_date))].sort();
  const canales=[...new Set(ord.map(o=>o.canal))];
  const fid=d=>+d.replace(/-/g,'');
  DATA.dim_fecha={grain:'una fecha',cols:[{name:'fecha_id',pk:1},'fecha','mes','año'],rows:dates.map(d=>[fid(d),d,+d.slice(5,7),+d.slice(0,4)])};
  DATA.dim_cliente={grain:'un cliente',cols:[{name:'cliente_id',pk:1},'cliente','región','segmento'],rows:cust.map(c=>[c.customer_id,c.customer_name,c.region,c.segmento])};
  DATA.dim_producto={grain:'un producto',cols:[{name:'producto_id',pk:1},'producto','familia'],rows:prod.map(p=>[p.product_id,p.description,p.familia])};
  DATA.dim_canal={grain:'un canal',cols:[{name:'canal_id',pk:1},'canal'],rows:canales.map((c,i)=>[i+1,c])};
  DATA.fact_ventas={grain:'una línea de venta',cols:[{name:'venta_id',pk:1},{name:'fecha_id',fk:1},{name:'cliente_id',fk:1},{name:'producto_id',fk:1},{name:'canal_id',fk:1},'cantidad','venta_neta','margen'],rows:lines.map(l=>{
    const o=ord.find(x=>x.order_id===l.order_id), p=prod.find(x=>x.product_id===l.product_id);
    const neta=Math.round(l.cantidad*l.precio_unitario*(1-l.descuento));
    return [l.order_line_id,fid(o.order_date),o.customer_id,l.product_id,canales.indexOf(o.canal)+1,l.cantidad,neta,neta-l.cantidad*p.costo_estandar];})};
})();

/* Navigation, accessible index and section progress. */
const slides=$$('.slide'); let cur=0;
const dots=$('#dots');
slides.forEach((s,i)=>{
  const heading=$('h1,h2',s); heading.id='heading-'+i;heading.tabIndex=-1;s.setAttribute('aria-labelledby',heading.id);
  const b=document.createElement('button');b.title=s.dataset.title;b.setAttribute('aria-label',(i+1)+'. '+s.dataset.title);b.addEventListener('click',()=>go(i,true));dots.appendChild(b);
});
$('#posTot').textContent=slides.length;
const groups=[...new Set(slides.map(s=>s.dataset.group))];
groups.forEach((group,i)=>{
  const b=document.createElement('button');b.innerHTML='<span>'+String(i).padStart(2,'0')+'</span>'+esc(group);b.dataset.group=group;b.addEventListener('click',()=>go(slides.findIndex(s=>s.dataset.group===group),true));$('#chapterNav').appendChild(b);
  const box=document.createElement('div');box.className='index-group';box.innerHTML='<h3>'+esc(group)+'</h3>';
  slides.forEach((s,k)=>{if(s.dataset.group!==group)return;const link=document.createElement('button');link.className='index-link';link.innerHTML='<span>'+String(k+1).padStart(2,'0')+'</span>'+esc(s.dataset.title)+'<i aria-hidden="true">↗</i>';link.dataset.slide=k;link.addEventListener('click',()=>{$('#indexDialog').close();go(k,true)});box.appendChild(link)});$('#agenda').appendChild(box);
});
function go(i,focus=false){
  cur=Math.max(0,Math.min(slides.length-1,i));
  slides.forEach((s,k)=>{s.classList.toggle('active',k===cur);s.hidden=k!==cur});
  $$('button',dots).forEach((b,k)=>{b.classList.toggle('on',k===cur);b.setAttribute('aria-current',k===cur?'step':'false')});
  $$('#chapterNav button').forEach(b=>{b.classList.toggle('on',b.dataset.group===slides[cur].dataset.group);b.setAttribute('aria-current',b.classList.contains('on')?'step':'false')});
  const chapter=$('#chapterNav button.on'),chapterNav=$('#chapterNav');
  if(chapter.offsetLeft<chapterNav.scrollLeft||chapter.offsetLeft+chapter.offsetWidth>chapterNav.scrollLeft+chapterNav.clientWidth)chapterNav.scrollLeft=chapter.offsetLeft-16;
  $$('.index-link').forEach(b=>b.setAttribute('aria-current',+b.dataset.slide===cur?'step':'false'));
  $('#posNow').textContent=String(cur+1).padStart(2,'0');$('#prog').style.width=((cur+1)/slides.length*100)+'%';$('#slideTitle').textContent=slides[cur].dataset.title;
  $('#prev').disabled=cur===0;$('#next').disabled=cur===slides.length-1;
  $('#main').scrollTop=0;
  $('#slideAnnouncement').textContent='Pantalla '+(cur+1)+' de '+slides.length+': '+slides[cur].dataset.title;
  if(focus)$('h1,h2',slides[cur]).focus({preventScroll:true});
  try{history.replaceState(null,'','#s'+(cur+1))}catch(e){}
}
$('#prev').addEventListener('click',()=>go(cur-1,true));$('#next').addEventListener('click',()=>go(cur+1,true));
$$('[data-index]').forEach(b=>b.addEventListener('click',()=>$('#indexDialog').showModal()));
$('#helpBtn').addEventListener('click',()=>$('#helpDialog').showModal());
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('[data-jump]').forEach(b=>b.addEventListener('click',()=>{const i=slides.findIndex(s=>s.dataset.title===b.dataset.jump);if(i>=0)go(i,true)}));
$('[data-start]').addEventListener('click',()=>go(1,true));
$('.brand').addEventListener('click',e=>{e.preventDefault();go(0,true)});
window.addEventListener('hashchange',()=>{const match=/^#s(\d+)$/.exec(location.hash);if(match)go(+match[1]-1,true)});
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||$('dialog[open]'))return;
  const target=e.target;
  if(target.closest('input,select,textarea,button,a,summary,[role="button"],[contenteditable="true"],.tablewrap'))return;
  if(['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End'].includes(e.key))e.preventDefault();
  if(['ArrowRight','PageDown'].includes(e.key))go(cur+1,true);
  if(['ArrowLeft','PageUp'].includes(e.key))go(cur-1,true);
  if(e.key==='Home')go(0,true);if(e.key==='End')go(slides.length-1,true);
});
$('#fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
  catch(e){$('#slideAnnouncement').textContent='El navegador no habilitó pantalla completa. Podés usar su menú de visualización.'}
});
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Salir de pantalla completa':'Activar pantalla completa');$('#fullscreen span').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa'});
if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
const initial=/^#s(\d+)$/.exec(location.hash);go(initial?+initial[1]-1:0);

/* ---------- 2 · grano ---------- */
const GRAINS = [
  {t:'customers', g:'un cliente', id:'customer_id', sum:'Contar filas = cantidad de clientes.', err:'Contar pedidos en esta tabla: cada fila representa un cliente, aunque todavía no haya comprado.',
   cols:[{name:'customer_id',pk:1},'customer_name','region'], rows:[{customer_id:'CLI01',customer_name:'Andina SA',region:'Centro'},{customer_id:'CLI02',customer_name:'Pampa SRL',region:'Sur'}]},
  {t:'products', g:'un producto', id:'product_id', sum:'Contar filas = tamaño del catálogo.', err:'Sumar costo_estandar no da el valor del inventario: también necesitás las cantidades en stock.',
   cols:[{name:'product_id',pk:1},'description','familia','costo_estandar'], rows:[{product_id:'PR10',description:'Bomba X',familia:'Bombas',costo_estandar:8500},{product_id:'PR20',description:'Válvula Y',familia:'Válvulas',costo_estandar:1200}]},
  {t:'sales_orders', g:'un pedido', id:'order_id', sum:'Contar filas = cantidad de pedidos.', err:'Buscar "cantidad vendida" acá: la cantidad vive en las líneas.',
   cols:[{name:'order_id',pk:1},'order_date','canal',{name:'customer_id',fk:1}], rows:[{order_id:'P100',order_date:'2026-08-01',canal:'Directo',customer_id:'CLI01'},{order_id:'P101',order_date:'2026-08-02',canal:'Web',customer_id:'CLI01'}]},
  {t:'sales_order_lines', g:'una línea de pedido', id:'order_line_id', sum:'Sumar cantidad = unidades vendidas. Contar filas ≠ pedidos.', err:'Contar filas y llamarlo "pedidos": P100 aparece dos veces.',
   cols:[{name:'order_line_id',pk:1},{name:'order_id',fk:1},{name:'product_id',fk:1},'cantidad','precio_unitario'], rows:[{order_line_id:1,order_id:'P100',product_id:'PR10',cantidad:2,precio_unitario:12000},{order_line_id:2,order_id:'P100',product_id:'PR20',cantidad:5,precio_unitario:1800},{order_line_id:3,order_id:'P101',product_id:'PR10',cantidad:1,precio_unitario:12000}]},
  {t:'inventory_snapshots', g:'un producto en una ubicación en una fecha', id:'(product_id, ubicacion, fecha)', sum:'Sumar stock de varias fechas duplica existencias: hay que fijar una fecha.', err:'Sumar todo el stock sin filtrar la fecha.',
   cols:[{name:'product_id',pk:1},{name:'ubicacion',pk:1},{name:'fecha',pk:1},'stock'], rows:[{product_id:'PR10',ubicacion:'Depósito A',fecha:'2026-08-01',stock:40},{product_id:'PR10',ubicacion:'Depósito A',fecha:'2026-08-02',stock:38},{product_id:'PR10',ubicacion:'Depósito B',fecha:'2026-08-01',stock:12}]},
  {t:'shipments', g:'un despacho asociado a una línea', id:'shipment_id', sum:'Contar filas = despachos. Puede haber líneas sin despacho.', err:'Confundir cantidad de despachos con cantidad de pedidos: son unidades diferentes.',
   cols:[{name:'shipment_id',pk:1},{name:'order_line_id',fk:1},'fecha_entrega','costo_flete'], rows:[{shipment_id:'S1',order_line_id:1,fecha_entrega:'2026-08-05',costo_flete:1200},{shipment_id:'S2',order_line_id:2,fecha_entrega:null,costo_flete:0}]}
];
const gb = $('#grainBtns');
GRAINS.forEach((g,i)=>{const b=document.createElement('button');b.className='btn'+(i===0?' on':'');b.textContent=g.t;b.addEventListener('click',()=>showGrain(i));gb.appendChild(b);});
function showGrain(i){
  const g=GRAINS[i]; $$('button',gb).forEach((b,k)=>b.classList.toggle('on',k===i));
  $('#grainTable').innerHTML = renderTable({caption:g.t+' <small>Recorte de ejemplo · '+g.rows.length+' filas</small>',cols:g.cols,rows:g.rows});
  $('#grainText').textContent = g.g; $('#grainId').textContent = g.id; $('#grainSum').textContent = g.sum; $('#grainErr').textContent = g.err;
}
showGrain(0);

/* ---------- 3 · entidades ---------- */
const entTable = $('#entTable');
const ENT_TXT = {
  entidad:'Entidad: Cliente. La tabla entera modela una clase de cosas del negocio. Cada tabla del modelo representa una entidad, y su grano dice qué es una fila.',
  atributo:'Atributo: region. Una columna. Describe una característica del cliente. Vive acá porque cambia con el cliente, no con el pedido.',
  registro:'Registro: Pampa SRL. Una fila. Un caso concreto de la entidad, identificado por su PK (CLI02).',
  none:'Elegí un concepto para resaltarlo en la tabla.'};
function entShow(kind, col, row){
  $$('th,td',entTable).forEach(c=>c.classList.remove('hl-col')); $$('tr',entTable).forEach(r=>r.classList.remove('hl-row')); entTable.classList.remove('hl-ent');
  if(kind==='entidad') entTable.classList.add('hl-ent');
  if(kind==='atributo'){ const c = col==null?3:col; $$('tr',entTable).forEach(r=>{const cell=r.children[c]; if(cell) cell.classList.add('hl-col');}); }
  if(kind==='registro'){ const r = row==null?1:row; const tr=$$('tbody tr',entTable)[r]; if(tr) tr.classList.add('hl-row'); }
  say('entMsg',ENT_TXT[kind]);
}
$$('[data-ent]').forEach(b=>b.addEventListener('click',()=>entShow(b.dataset.ent)));
$$('thead th',entTable).forEach((th,i)=>th.addEventListener('mouseenter',()=>{entShow('atributo',i);say('entMsg','Atributo: '+esc(th.textContent)+'. Una columna que describe a la entidad Cliente.');}));
$$('tbody tr',entTable).forEach((tr,i)=>tr.addEventListener('mouseenter',()=>{entShow('registro',null,i);say('entMsg','Registro: '+esc(tr.children[1].textContent)+'. Una fila, identificada por '+esc(tr.children[0].textContent)+'.');}));

/* ---------- 4 · tabla plana ---------- */
const FLAT0 = [
  {pedido_id:'P100',fecha:'2026-08-01',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',producto_id:'PR10',producto:'Bomba X',cantidad:2},
  {pedido_id:'P100',fecha:'2026-08-01',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',producto_id:'PR20',producto:'Válvula Y',cantidad:5},
  {pedido_id:'P101',fecha:'2026-08-02',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',producto_id:'PR10',producto:'Bomba X',cantidad:1}];
const FLAT_COLS = ['pedido_id','fecha','cliente_id','cliente','region','producto_id','producto','cantidad'];
let flat = JSON.parse(JSON.stringify(FLAT0));
function flatRender(){ $('#flatTable').innerHTML = renderTable({caption:'export_ventas.csv <small>una fila = una línea de pedido, con todo repetido</small>',cols:FLAT_COLS,rows:flat}); }
$$('[data-flat]').forEach(b=>b.addEventListener('click',()=>{
  const a=b.dataset.flat;
  if(a==='reset'){flat=JSON.parse(JSON.stringify(FLAT0));say('flatMsg','Tres filas, un solo cliente, una sola región… repetida tres veces.');}
  if(a==='upd1'){
    flat.forEach(r=>{r._bad=null;r._ok=null;});
    const rows=flat.filter(r=>r.cliente_id==='CLI01'&&!r._ghost);
    if(!rows.length){say('flatMsg','Ya no quedan filas de Andina SA. Reiniciá el ejemplo para probar el cambio.');}
    else{
      rows[0].region='Norte';
      const inconsistent=new Set(rows.map(r=>r.region)).size>1;
      rows.forEach(r=>{if(inconsistent)r._bad=['region'];else r._ok=['region'];});
      say('flatMsg',inconsistent?'Andina SA figura en Norte y Centro a la vez. Corregir solo una fila dejó versiones distintas del mismo dato.':'Todas las filas de Andina SA ya indican Norte. Para repetir el caso, reiniciá el ejemplo.',inconsistent?'bad':'ok');
    }
  }
  if(a==='updall'){let n=0;flat.forEach(r=>{if(r.cliente_id==='CLI01'&&!r._ghost){r.region='Norte';r._bad=null;r._ok=['region'];n++;}}); say('flatMsg','Consistente otra vez, pero un dato que cambió una vez obligó a tocar '+n+' filas. Con miles de líneas, el costo y el riesgo crecen con cada pedido.','warn');}
  if(a==='ins'){ if(!flat.some(r=>r._ghost)) flat.push({pedido_id:'¿?',fecha:'¿?',cliente_id:'CLI02',cliente:'Pampa SRL',region:'Sur',producto_id:'¿?',producto:'¿?',cantidad:'¿?',_ghost:true}); say('flatMsg','Anomalía de inserción. Pampa SRL existe como cliente, pero en esta tabla no hay lugar para un cliente sin pedido: la mitad de la fila queda vacía o inventada.','bad');}
  if(a==='del'){ const target=flat.some(r=>r.pedido_id==='P101')?'P101':'P100'; const before=flat.length; flat=flat.filter(r=>r.pedido_id!==target); say('flatMsg',before===flat.length?'Ya no quedan pedidos de Andina SA.':flat.some(r=>r.cliente_id==='CLI01')?'Se eliminó P101. Todavía quedan las dos líneas de P100. Volvé a pulsar para borrar el último pedido.':'Se eliminó P100. También perdimos el nombre y la región de Andina SA: estaban guardados solo en sus pedidos.','bad');}
  flatRender();
}));
flatRender();

/* ---------- 5 · PK/FK ---------- */
const pkC=$('#pkCustomers tbody'), pkO=$('#pkOrders tbody');
pkO.addEventListener('mouseover',e=>{const tr=e.target.closest('tr'); if(!tr) return; const ref=tr.dataset.ref; $$('tr',pkC).forEach(r=>{r.classList.toggle('linked',r.dataset.id===ref);r.classList.toggle('dim',r.dataset.id!==ref);});});
pkO.addEventListener('mouseleave',()=>$$('tr',pkC).forEach(r=>r.classList.remove('linked','dim')));
pkC.addEventListener('mouseover',e=>{const tr=e.target.closest('tr'); if(!tr) return; const id=tr.dataset.id; $$('tr',pkO).forEach(r=>{r.classList.toggle('linked',r.dataset.ref===id);r.classList.toggle('dim',r.dataset.ref!==id);});});
pkC.addEventListener('mouseleave',()=>$$('tr',pkO).forEach(r=>r.classList.remove('linked','dim')));
const PK_C0 = pkC.innerHTML, PK_O0 = pkO.innerHTML;
$$('[data-pk]').forEach(b=>b.addEventListener('click',()=>{
  const a=b.dataset.pk;
  if(a==='reset'){pkC.innerHTML=PK_C0;pkO.innerHTML=PK_O0;say('pkMsg','Cada pedido apunta a un cliente que existe. Eso es integridad referencial.');}
  if(a==='ok'){
    if(!$$('tr',pkC).some(r=>r.dataset.id==='CLI03')){say('pkMsg','El cliente CLI03 no existe. Reiniciá el ejemplo para volver a registrarlo.','bad');return;}
    if($$('tr',pkO).some(r=>r.children[0].textContent==='P103')){say('pkMsg','P103 ya existe. La PK impide repetir ese pedido.','bad');return;}
    const tr=document.createElement('tr');tr.dataset.ref='CLI03';tr.innerHTML='<td class="pk ok">P103</td><td class="ok">2026-08-04</td><td class="fk ok">CLI03</td>';pkO.appendChild(tr);
    say('pkMsg','Se agregó P103: su identificador es único y el cliente CLI03 existe.','ok');
  }
  if(a==='fk'){say('pkMsg','Error: viola FK. No existe customers.customer_id = CLI99. El motor rechaza la fila: un pedido no puede pertenecer a un cliente que no está registrado.','bad');}
  if(a==='pk'){say('pkMsg','Error: viola PK. Ya existe customer_id = CLI01. La clave primaria no admite duplicados, aunque el nombre sea otro.','bad');}
  if(a==='delref'){say('pkMsg','Error: hay pedidos que referencian a CLI01. Borrarlo dejaría a P100 y P101 apuntando a la nada (filas huérfanas). Primero hay que decidir qué pasa con esos pedidos.','bad');}
  if(a==='delfree'){ const has=$$('tr',pkO).some(r=>r.dataset.ref==='CLI03'); const tr=$$('tr',pkC).find(r=>r.dataset.id==='CLI03');
    if(!tr){say('pkMsg','CLI03 ya fue eliminado.');}
    else if(has){say('pkMsg','Error: ahora P103 referencia a CLI03. Desde que insertaste ese pedido, el cliente ya no se puede borrar sin más.','bad');}
    else { tr.remove(); say('pkMsg','OK. Ningún pedido apuntaba a CLI03, así que se puede eliminar sin romper referencias.','ok'); } }
}));

/* ---------- 6 · tipos de clave ---------- */
let natState=0, surState=0;
function natRender(){
  const cuit = natState? '30-71999999-0' : '30-70123456-1';
  const bad = natState? ['cuit']:null;
  $('#natTable').innerHTML = renderTable({caption:'customers',cols:[{name:'cuit',pk:1},'customer_name'],rows:[{cuit:cuit,customer_name:'Andina SA',_bad:bad}]}) +
    '<div style="height:8px"></div>' + renderTable({caption:'sales_orders',cols:[{name:'order_id',pk:1},{name:'cuit',fk:1}],rows:[{order_id:'P100',cuit:cuit,_bad:bad},{order_id:'P101',cuit:cuit,_bad:bad}]});
}
function surRender(){
  const cuit = surState? '30-71999999-0' : '30-70123456-1';
  $('#surTable').innerHTML = renderTable({caption:'customers',cols:[{name:'customer_id',pk:1},'cuit','customer_name'],rows:[{customer_id:1,cuit:cuit,customer_name:'Andina SA',_ok:surState?['cuit']:null}]}) +
    '<div style="height:8px"></div>' + renderTable({caption:'sales_orders',cols:[{name:'order_id',pk:1},{name:'customer_id',fk:1}],rows:[{order_id:'P100',customer_id:1},{order_id:'P101',customer_id:1}]});
}
natRender(); surRender();
$('[data-key="nat"]').addEventListener('click',()=>{natState=1;natRender();say('natMsg','Cambió la PK: 3 celdas modificadas. Hay que reescribir el CUIT en customers y en los dos pedidos que lo referencian. La corrección alcanza a todas las referencias.','bad');});
$('[data-key="sur"]').addEventListener('click',()=>{surState=1;surRender();say('surMsg','Un solo cambio. El CUIT es un atributo: se actualiza en una celda. Los pedidos siguen apuntando al 1. El CUIT igual lleva una restricción UNIQUE para no duplicar clientes.','ok');});
let comp = [{product_id:'PR10',ubicacion:'Depósito A',fecha:'2026-08-01',stock:40},{product_id:'PR10',ubicacion:'Depósito A',fecha:'2026-08-02',stock:38},{product_id:'PR20',ubicacion:'Depósito B',fecha:'2026-08-01',stock:12}];
function compRender(){$('#compTable').innerHTML=renderTable({caption:'inventory_snapshots',cols:[{name:'product_id',pk:1},{name:'ubicacion',pk:1},{name:'fecha',pk:1},'stock'],rows:comp});}
compRender();
$('[data-key="comp"]').addEventListener('click',()=>{
  const p=$('#cProd').value,l=$('#cLoc').value,d=$('#cDate').value;
  comp.forEach(r=>{r._bad=null;r._ok=null;});
  const dup=comp.find(r=>r.product_id===p&&r.ubicacion===l&&r.fecha===d);
  if(dup){dup._bad=['product_id','ubicacion','fecha'];say('compMsg','Viola la PK compuesta. Ya hay un snapshot de '+p+' en '+l+' el '+d+'. Dos filas con la misma combinación harían ambiguo el stock de ese día.','bad');}
  else{comp.push({product_id:p,ubicacion:l,fecha:d,stock:25,_ok:['product_id','ubicacion','fecha']});say('compMsg','OK. La combinación ('+p+', '+l+', '+d+') no existía. Cada columna por separado se repite; la terna, no.','ok');}
  compRender();
});

/* ---------- 7 · cardinalidad ---------- */
const CARD = {
 '1n':{title:'Uno a muchos (1:N)',left:['CLI01 Andina SA','CLI02 Pampa SRL','CLI03 Litoral SA'],right:['P100','P101','P102','P103'],links:[[0,0],[0,1],[1,2],[2,3]],lname:'customers',rname:'sales_orders',
   text:'<p>Un cliente puede tener varios pedidos; cada pedido pertenece a exactamente un cliente.</p><p>La FK va del lado de los muchos: <span class="dep">sales_orders.customer_id</span>. Cada pedido guarda el identificador de su cliente.</p>'},
 'nm':{title:'Muchos a muchos (N:M)',left:['P100','P101','P102'],right:['PR10 Bomba X','PR20 Válvula Y','PR30 Filtro Z'],links:[[0,0],[0,1],[1,0],[2,2]],lname:'sales_orders',rname:'products',bridge:'sales_order_lines',
   text:'<p>Un pedido tiene muchos productos y un producto aparece en muchos pedidos. Ninguna de las dos tablas puede alojar la FK.</p><p>Se resuelve con una tabla intermedia: <span class="dep">sales_order_lines</span>, con una fila por cada cruce (order_id, product_id) y los atributos propios del cruce: cantidad, precio, descuento.</p>'},
 '11':{title:'Uno a uno (1:1)',left:['P100','P101','P102'],right:['F-0001','F-0002','F-0003'],links:[[0,0],[1,1],[2,2]],lname:'sales_orders',rname:'invoices',
   text:'<p>Cada pedido tiene como máximo una factura y cada factura corresponde a un solo pedido.</p><p>Podrían ser una sola tabla. Se separan cuando los atributos nacen en momentos distintos, tienen distinta seguridad o uno de los lados es opcional. En este ejemplo, invoices.order_id referencia al pedido y lleva una restricción UNIQUE para impedir dos facturas del mismo pedido.</p>'},
 'opt':{title:'Opcionalidad: también puede haber cero',left:['Línea 1','Línea 2','Línea 5','Línea 7'],right:['S1','S2'],links:[[0,0],[1,1]],lonely:[2,3],lname:'sales_order_lines',rname:'shipments',
   text:'<p>Algunas líneas todavía no tienen despacho: la relación es opcional del lado de shipments.</p><p>Consecuencia práctica: un <span class="dep">INNER JOIN</span> con shipments hace desaparecer las líneas 5 y 7. Para "ver todo lo pedido, despachado o no", el join tiene que ser LEFT y las columnas del despacho vendrán NULL.</p>'}
};
function drawCard(k){
  const c=CARD[k]; const svg=$('#cardSvg'); const NS='http://www.w3.org/2000/svg';
  svg.innerHTML=''; const el=(t,a,txt)=>{const n=document.createElementNS(NS,t);Object.keys(a).forEach(q=>n.setAttribute(q,a[q]));if(txt!=null)n.textContent=txt;svg.appendChild(n);return n;};
  const LX=20,RX=440,W=180,H=30,GAP=14,TOP=40; const bridge=!!c.bridge; const BX=262;
  el('text',{x:LX,y:22,'class':'lbl'},c.lname.toUpperCase()); el('text',{x:RX,y:22,'class':'lbl'},c.rname.toUpperCase());
  if(bridge) el('text',{x:BX-20,y:22,'class':'lbl'},c.bridge.toUpperCase());
  const ly=i=>TOP+i*(H+GAP), ry=i=>TOP+i*(H+GAP);
  c.left.forEach((t,i)=>{el('rect',{x:LX,y:ly(i),width:W,height:H,rx:6,'class':'ent'+((c.lonely||[]).includes(i)?' lonely':'')});el('text',{x:LX+10,y:ly(i)+19},t);});
  c.right.forEach((t,i)=>{el('rect',{x:RX,y:ry(i),width:W,height:H,rx:6,'class':'ent'});el('text',{x:RX+10,y:ry(i)+19},t);});
  c.links.forEach((pair,i)=>{
    const a=pair[0],b=pair[1]; const y1=ly(a)+H/2,y2=ry(b)+H/2;
    if(bridge){ const by=TOP+i*(H+GAP-8); const bh=H-8; const bm=by+bh/2;
      el('rect',{x:BX-20,y:by,width:120,height:bh,rx:5,'class':'bridge'}); el('text',{x:BX-12,y:by+15,'class':'small'},c.left[a]+' · '+c.right[b].split(' ')[0]);
      el('path',{d:'M'+(LX+W)+' '+y1+' C '+(LX+W+40)+' '+y1+' '+(BX-60)+' '+bm+' '+(BX-20)+' '+bm,'class':'link'});
      el('path',{d:'M'+(BX+100)+' '+bm+' C '+(BX+140)+' '+bm+' '+(RX-40)+' '+y2+' '+RX+' '+y2,'class':'link'});
    } else { el('path',{d:'M'+(LX+W)+' '+y1+' C '+(LX+W+90)+' '+y1+' '+(RX-90)+' '+y2+' '+RX+' '+y2,'class':'link'+(k==='opt'?' opt':'')}); }
  });
  (c.lonely||[]).forEach(i=>{el('path',{d:'M'+(LX+W)+' '+(ly(i)+H/2)+' l 50 0','class':'link opt'});el('text',{x:LX+W+56,y:ly(i)+H/2+4,'class':'warn'},'sin despacho → NULL en el join');});
  $('#cardTitle').textContent=c.title; $('#cardText').innerHTML=c.text;
}
$$('[data-card]').forEach(b=>b.addEventListener('click',()=>{$$('[data-card]').forEach(x=>x.classList.toggle('on',x===b));drawCard(b.dataset.card);}));
drawCard('1n');

/* ---------- 8 · ERD ---------- */
const erd=$('#erd'), erdMsg=$('#erdMsg'); const ERD0=erdMsg.innerHTML;
const ERD_TXT={'customers.customer_id':'sales_orders.customer_id → customers.customer_id. Un cliente, muchos pedidos.','sales_orders.order_id':'sales_order_lines.order_id → sales_orders.order_id. Un pedido, muchas líneas.','products.product_id':'sales_order_lines.product_id → products.product_id. Un producto, muchas líneas en distintos pedidos.','sales_order_lines.order_line_id':'Clave sustituta de la línea. En este ejemplo, cada producto aparece una vez por pedido. Solo con esa regla (order_id, product_id) puede identificar una línea. shipments.order_line_id apuntaría acá.'};
function highlightRelation(e){
  const li=e.target.closest('li'); if(!li) return; const key=li.dataset.fk||li.dataset.pk; if(!key) return;
  $$('li',erd).forEach(x=>{x.classList.toggle('glow',x.dataset.pk===key); x.classList.toggle('glow-fk',x.dataset.fk===key);});
  erdMsg.innerHTML = ERD_TXT[key] || '';
}
['mouseover','focusin','click'].forEach(type=>erd.addEventListener(type,highlightRelation));
erd.addEventListener('mouseleave',()=>{$$('li',erd).forEach(x=>x.classList.remove('glow','glow-fk'));erdMsg.innerHTML=ERD0;});

/* ---------- 9 · normalización ---------- */
const NF=[
 {name:'Sin normalizar',sub:'grupos repetidos',deps:['<span class="dep bad">productos = lista dentro de una celda</span>'],
  msg:'Una fila por pedido, con los productos apilados en una celda. No se puede sumar cantidades ni filtrar por producto sin separar e interpretar el texto.',
  tables:[{caption:'pedidos',cols:[{name:'pedido_id',pk:1},'fecha','cliente_id','cliente','region','productos','cantidades'],rows:[{pedido_id:'P100',fecha:'2026-08-01',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',productos:'PR10 Bomba X; PR20 Válvula Y',cantidades:'2; 5',_bad:['productos','cantidades']},{pedido_id:'P101',fecha:'2026-08-02',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',productos:'PR10 Bomba X',cantidades:'1',_bad:['productos','cantidades']}]}]},
 {name:'1FN',sub:'valores atómicos',deps:['<span class="dep">clave = (pedido_id, producto_id)</span>','<span class="dep bad">fecha, cliente dependen solo de pedido_id</span>','<span class="dep bad">producto depende solo de producto_id</span>'],
  msg:'En este ejemplo, cada producto aparece una sola vez por pedido. Cada celda tiene un valor. Ahora la clave es compuesta (pedido + producto), pero fecha y cliente dependen de parte de la clave: se repiten por cada producto del pedido. Es la misma estructura del ejemplo de tabla plana.',
  tables:[{caption:'pedido_lineas',cols:[{name:'pedido_id',pk:1},{name:'producto_id',pk:1},'fecha','cliente_id','cliente','region','producto','cantidad'],rows:[{pedido_id:'P100',producto_id:'PR10',fecha:'2026-08-01',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',producto:'Bomba X',cantidad:2,_bad:['fecha','cliente_id','cliente','region','producto']},{pedido_id:'P100',producto_id:'PR20',fecha:'2026-08-01',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',producto:'Válvula Y',cantidad:5,_bad:['fecha','cliente_id','cliente','region','producto']},{pedido_id:'P101',producto_id:'PR10',fecha:'2026-08-02',cliente_id:'CLI01',cliente:'Andina SA',region:'Centro',producto:'Bomba X',cantidad:1,_bad:['fecha','cliente_id','cliente','region','producto']}]}]},
 {name:'2FN',sub:'sin dependencias parciales',deps:['<span class="dep">fecha, cliente_id → dependen de order_id completo</span>','<span class="dep bad">cliente, region dependen de cliente_id, no de la PK</span>'],
  msg:'Lo que depende solo del pedido se va a sales_orders; lo que depende solo del producto, a products. Queda una dependencia transitiva: cliente y región dependen de cliente_id, que no es la clave.',
  tables:[
   {caption:'sales_orders',cols:[{name:'order_id',pk:1},'order_date','customer_id','cliente','region'],rows:[{order_id:'P100',order_date:'2026-08-01',customer_id:'CLI01',cliente:'Andina SA',region:'Centro',_bad:['cliente','region']},{order_id:'P101',order_date:'2026-08-02',customer_id:'CLI01',cliente:'Andina SA',region:'Centro',_bad:['cliente','region']}]},
   {caption:'products',cols:[{name:'product_id',pk:1},'description'],rows:[{product_id:'PR10',description:'Bomba X'},{product_id:'PR20',description:'Válvula Y'}]},
   {caption:'sales_order_lines',cols:[{name:'order_id',pk:1,fk:1},{name:'product_id',pk:1,fk:1},'cantidad'],rows:[{order_id:'P100',product_id:'PR10',cantidad:2},{order_id:'P100',product_id:'PR20',cantidad:5},{order_id:'P101',product_id:'PR10',cantidad:1}]}]},
 {name:'3FN',sub:'sin dependencias transitivas',deps:['<span class="dep">cliente_id → nombre y región; pedido_id → fecha y cliente_id</span>'],
  msg:'Cliente y región viven en customers. Cada atributo descriptivo se administra en su tabla: cambiar la región de Andina SA es una celda. Este es el modelo operacional de Faro Sur.',
  tables:[
   {caption:'customers',cols:[{name:'customer_id',pk:1},'customer_name','region'],rows:[{customer_id:'CLI01',customer_name:'Andina SA',region:'Centro',_ok:['region']}]},
   {caption:'sales_orders',cols:[{name:'order_id',pk:1},'order_date',{name:'customer_id',fk:1}],rows:[{order_id:'P100',order_date:'2026-08-01',customer_id:'CLI01'},{order_id:'P101',order_date:'2026-08-02',customer_id:'CLI01'}]},
   {caption:'products',cols:[{name:'product_id',pk:1},'description'],rows:[{product_id:'PR10',description:'Bomba X'},{product_id:'PR20',description:'Válvula Y'}]},
   {caption:'sales_order_lines',cols:[{name:'order_line_id',pk:1},{name:'order_id',fk:1},{name:'product_id',fk:1},'cantidad'],rows:[{order_line_id:1,order_id:'P100',product_id:'PR10',cantidad:2},{order_line_id:2,order_id:'P100',product_id:'PR20',cantidad:5},{order_line_id:3,order_id:'P101',product_id:'PR10',cantidad:1}]}]}
];
const nfSteps=$('#nfSteps');
NF.forEach((s,i)=>{const b=document.createElement('button');b.className='btn';b.innerHTML=esc(s.name)+'<small>'+esc(s.sub)+'</small>';b.addEventListener('click',()=>nfShow(i));nfSteps.appendChild(b);});
function nfShow(i){const s=NF[i];$$('button',nfSteps).forEach((b,k)=>b.classList.toggle('on',k===i));$('#nfDeps').innerHTML=s.deps.join('');$('#nfTables').innerHTML=s.tables.map(t=>'<div class="tablewrap">'+renderTable(t)+'</div>').join('');say('nfMsg',s.msg);}
nfShow(0);

/* ---------- 10 · tradeoffs ---------- */
const TRADE=[
 {name:'Modelo operacional',desc:'La región del cliente se guarda en customers. Las líneas registran las cantidades y los precios de cada pedido.',tables:[['customers','un cliente'],['sales_orders','un pedido'],['sales_order_lines','una línea']],joins:'2 uniones entre 3 tablas',change:'Corregir una región actual requiere cambiar una fila de customers.',calc:'La consulta calcula cantidad × precio × (1 − descuento) y agrupa por región y mes.'},
 {name:'Cliente dentro del pedido',desc:'El pedido incluye el nombre y la región del cliente. La misma región aparece en cada pedido de ese cliente.',tables:[['sales_orders (+ región)','un pedido'],['sales_order_lines','una línea']],joins:'1 unión entre 2 tablas',change:'Si es la región actual, hay que corregir todos los pedidos. Si es histórica, esa regla debe quedar documentada.',calc:'Las líneas se unen a los pedidos para obtener región y fecha.'},
 {name:'Esquema estrella',desc:'Una tabla de hechos conserva las medidas de cada línea. Las dimensiones describen al cliente y la fecha.',tables:[['fact_ventas','una línea de venta'],['dim_cliente','un cliente'],['dim_fecha','una fecha']],joins:'2 uniones entre 3 tablas',change:'La región se administra en la dimensión. Un proceso de carga mantiene el modelo de análisis.',calc:'La consulta suma venta_neta y agrupa por región y mes. Otras preguntas pueden usar más dimensiones.'},
 {name:'Tabla plana',desc:'Cada línea incluye los datos del cliente, del pedido y del producto. Es cómoda como exportación para analizar.',tables:[['ventas_plana','una línea con contexto repetido']],joins:'0 uniones: una sola tabla',change:'La región se repite en varias líneas. Para mantenerla actual, hay que actualizar todas o regenerar la exportación.',calc:'Puede sumar una venta_neta ya calculada. Hay que documentar el grano para evitar dobles conteos.'}
];
function tradeShow(i){const t=TRADE[i];$('#tradeName').textContent=t.name;$('#tradeDesc').textContent=t.desc;$('#tradeSchema').innerHTML=renderTable({cols:['tabla','una fila es'],rows:t.tables.map(([tabla,g])=>({tabla,'una fila es':g}))});$('#tradeFacts').innerHTML='<div class="trade-number">'+esc(t.joins)+'</div><h3>Al actualizar</h3><p>'+esc(t.change)+'</p><h3>Al consultar</h3><p>'+esc(t.calc)+'</p>';$$('[data-trade]').forEach((b,k)=>{b.classList.toggle('on',k===i);b.setAttribute('aria-pressed',k===i);});}
$$('[data-trade]').forEach(b=>b.addEventListener('click',()=>tradeShow(+b.dataset.trade)));tradeShow(0);

/* ---------- 11 · estrella ---------- */
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{$$('[data-mode]').forEach(x=>x.classList.toggle('on',x===b));const st=b.dataset.mode==='star';$('#modeOp').hidden=st;$('#modeStar').hidden=!st;}));
const star=$('#star'); const STAR0=$('#starMsg').innerHTML;
const STAR_TXT={fecha_id:'dim_fecha responde "¿cuándo?". Agrupar por mes es leer una columna, no calcular EXTRACT en cada consulta.',cliente_id:'dim_cliente responde "¿a quién?". Región y segmento viajan planos: ventas por región es un join y un GROUP BY.',producto_id:'dim_producto responde "¿qué?". La familia ya está resuelta.',canal_id:'dim_canal responde "¿por dónde?". En el operacional el canal era una columna de sales_orders; acá es una dimensión propia.'};
function highlightDimension(e){const d=e.target.closest('[data-dim]');if(!d)return;const k=d.dataset.dim;$$('li',star).forEach(x=>x.classList.toggle('glow-fk',x.dataset.fkdim===k));$$('[data-dim]',star).forEach(x=>x.classList.toggle('hot',x===d));$('#starMsg').innerHTML=STAR_TXT[k];}
['mouseover','focusin','click'].forEach(type=>star.addEventListener(type,highlightDimension));
star.addEventListener('mouseleave',()=>{$$('li',star).forEach(x=>x.classList.remove('glow-fk'));$$('[data-dim]',star).forEach(x=>x.classList.remove('hot'));$('#starMsg').innerHTML=STAR0;});

/* ---------- 12 · NULL ---------- */
const nullRows=$$('#nullTable tbody tr');
const NULL_TXT={
 eq:{t:'0 filas. NULL = NULL no es verdadero ni falso: es desconocido, y WHERE descarta lo desconocido. Para buscar valores ausentes, usá IS NULL.',cls:'bad',rows:[]},
 is:{t:'2 filas: S2 y S4. IS NULL permite buscar valores ausentes. Con la convención documentada, esto lista los despachos con entrega sin confirmar.',cls:'ok',rows:[1,3]},
 avg:{t:'AVG = 600. (1200 + 0) / 2. AVG ignora los NULL: promedia solo los fletes cargados. S2 vale 0 porque el flete fue bonificado; eso sí cuenta.',cls:'',rows:[0,1]},
 avg0:{t:'AVG = 300. (1200 + 0 + 0 + 0) / 4. Al reemplazar NULL por 0 convertí "no sé" en "gratis". El promedio bajó a la mitad por una decisión que nadie documentó.',cls:'warn',rows:[0,1,2,3]}};
$$('[data-null]').forEach(b=>b.addEventListener('click',()=>{const r=NULL_TXT[b.dataset.null];say('nullMsg',r.t,r.cls);nullRows.forEach((tr,i)=>{tr.classList.toggle('linked',r.rows.includes(i));tr.classList.toggle('dim',!r.rows.includes(i));});$$('[data-null]').forEach(x=>x.classList.toggle('on',x===b));}));

/* ---------- tablas completas: esquema ↔ tabla física ---------- */
const FULL=['customers','products','sales_orders','sales_order_lines','shipments','inventory_snapshots'];
const FULL_NOTE={
 customers:'Cada fila es un cliente. CLI05 todavía no tiene pedidos, pero existe como cliente igual: eso no se podía hacer en la tabla plana.',
 products:'Cada fila es un producto del catálogo. costo_estandar es un dato del producto, no de una venta: por eso no hay cantidades acá.',
 sales_orders:'Cada fila es un pedido. Fijate que customer_id se repite (CLI01 hizo dos pedidos): eso está bien, porque acá la FK puede repetirse. Lo que no puede repetirse es order_id.',
 sales_order_lines:'Cada fila es una línea de pedido. P100 tiene dos filas (dos productos). Sumar cantidad tiene sentido; contar filas y llamarlo "pedidos", no.',
 shipments:'Cada fila es un despacho. Las celdas NULL son "todavía no sabemos": fecha_entrega NULL significa entrega sin confirmar por convención documentada.',
 inventory_snapshots:'Cada fila es una foto del stock de un producto en un depósito en una fecha. Ninguna columna sola identifica la fila: la PK es la combinación de tres.'};
const fb=$('#fullBtns');
FULL.forEach((n,i)=>{const b=document.createElement('button');b.className='btn'+(i?'':' on');b.textContent=n;b.addEventListener('click',()=>fullShow(i));fb.appendChild(b);});
function schemaBox(name){const t=DATA[name];return '<h4>'+esc(name)+' <small>'+esc(t.grain)+'</small></h4><ul>'+t.cols.map(c=>{const k=typeof c==='string'?{name:c}:c;return '<li tabindex="0" role="button" data-col="'+esc(k.name)+'">'+(k.pk?'<span class="tag pk">PK</span>':'')+(k.fk?'<span class="tag fk">FK</span>':'')+esc(k.name)+'</li>';}).join('')+'</ul>';}
function fullShow(i){const n=FULL[i];$$('button',fb).forEach((b,k)=>b.classList.toggle('on',k===i));$('#fullSchema').innerHTML=schemaBox(n);$('#fullTable').innerHTML=renderTable(tbl(n,{caption:n+' <small>'+DATA[n].rows.length+' filas · '+DATA[n].cols.length+' columnas</small>'}));$('#fullNote').innerHTML=FULL_NOTE[n];}
function highlightColumn(e){const li=e.target.closest('li');if(!li)return;const c=li.dataset.col;$$('li',$('#fullSchema')).forEach(x=>x.classList.toggle('hl',x===li));$$('th,td',$('#fullTable')).forEach(x=>x.classList.toggle('hl-col',x.dataset.col===c));}
['mouseover','focusin','click'].forEach(type=>$('#fullSchema').addEventListener(type,highlightColumn));
$('#fullSchema').addEventListener('mouseleave',()=>{$$('li',$('#fullSchema')).forEach(x=>x.classList.remove('hl'));$$('th,td',$('#fullTable')).forEach(x=>x.classList.remove('hl-col'));});
fullShow(0);

/* ---------- ver con datos (ERD y estrella) ---------- */
$$('[data-showdata]').forEach(b=>b.addEventListener('click',()=>{
  const root=b.dataset.showdata==='erd'?$('#erd'):$('#star'); const on=!b.classList.contains('on');
  b.classList.toggle('on',on); b.textContent=on?'Ver solo el esquema':'Ver las tablas con datos';
  $$('.ent[data-table]',root).forEach(en=>{let d=$('.ent-data',en);if(!d){d=document.createElement('div');d.className='ent-data';d.innerHTML='<div class="tablewrap">'+renderTable({cols:DATA[en.dataset.table].cols,rows:rowsOf(en.dataset.table)})+'</div>';en.appendChild(d);}d.hidden=!on;});
}));

/* ---------- SQL helpers ---------- */
const KW=(w,c)=>'<span class="kw c-'+c+'">'+w+'</span>';
const cloneCols=(name,selected)=>DATA[name].cols.map(c=>{const k=typeof c==='string'?{name:c}:Object.assign({},c);k.sel=selected?selected.includes(k.name):false;return k;});

/* ---------- SQL 1 · anatomía ---------- */
const anatCols=['customer_name','region']; const anatPass=r=>r.segmento==='Industria';
const ANAT_TXT={
 select:'SELECT elige columnas. De las 5 columnas de customers me quedo con 2. Las otras existen, pero no se muestran.',
 from:'FROM nombra la tabla. En este ejemplo, FROM customers indica de dónde obtener los datos.',
 where:'WHERE filtra filas. Cada fila se evalúa: segmento = \'Industria\' es verdadero para Andina SA y Litoral SA; las otras 3 se descartan.',
 none:'Para entender esta consulta, seguí su orden lógico: FROM elige la tabla; WHERE conserva las filas que cumplen; SELECT elige las columnas. El motor puede optimizar la ejecución.'};
function anatRender(mode){
  const rows=rowsOf('customers').map(r=>Object.assign({},r,{_cls:mode==='where'?(anatPass(r)?'pass':'fail'):''}));
  $('#anatTable').innerHTML=renderTable({caption:'customers <small>5 filas · 5 columnas</small>',cols:cloneCols('customers',mode==='select'?anatCols:null),rows});
  $('table',$('#anatTable')).classList.toggle('hl-ent',mode==='from');
  $('#anatResult').innerHTML=renderTable({caption:'<small>2 filas × 2 columnas</small>',cols:anatCols,rows:rowsOf('customers').filter(anatPass)});
  $$('#anat .clause').forEach(c=>c.classList.toggle('on',c.dataset.cl===mode));
  say('anatMsg',ANAT_TXT[mode]);
}
$$('#anat .clause').forEach(c=>{c.setAttribute('role','button');c.tabIndex=0;['mouseenter','focus','click'].forEach(type=>c.addEventListener(type,()=>anatRender(c.dataset.cl)));});
$('#anat').addEventListener('mouseleave',()=>anatRender('none'));
anatRender('none');

/* ---------- SQL 2 · SELECT ---------- */
const selState={table:'products',cols:[],distinct:false};
function selBuildCols(){const names=DATA[selState.table].cols.map(colName);selState.cols=names.slice(0,2);
  $('#selCols').innerHTML='<label><input type="checkbox" value="*"> *</label>'+names.map(n=>'<label><input type="checkbox" value="'+esc(n)+'"'+(selState.cols.includes(n)?' checked':'')+'> '+esc(n)+'</label>').join('');}
$('#selTable').addEventListener('change',e=>{selState.table=e.target.value;selBuildCols();selRender();});
$('#selCols').addEventListener('change',e=>{const names=DATA[selState.table].cols.map(colName);const boxes=$$('input',$('#selCols'));
  if(e.target.value==='*'){boxes.forEach(b=>{if(b.value!=='*')b.checked=e.target.checked;});}
  const chosen=boxes.filter(b=>b.value!=='*'&&b.checked).map(b=>b.value); boxes[0].checked=chosen.length===names.length;
  selState.cols=names.filter(n=>chosen.includes(n)); selRender();});
$('#selDistinct').addEventListener('change',e=>{selState.distinct=e.target.checked;selRender();});
function selRender(){
  const t=selState.table,names=DATA[t].cols.map(colName),cols=selState.cols,all=cols.length===names.length;
  $('#selSql').innerHTML=KW('SELECT','select')+' '+(selState.distinct?KW('DISTINCT','select')+' ':'')+(cols.length?(all?'*':cols.join(', ')):'<span class="c-where">¿qué columnas?</span>')+'\n'+KW('FROM','from')+' '+t+';';
  $('#selSource').innerHTML=renderTable({caption:t+' <small>'+DATA[t].rows.length+' filas · '+names.length+' columnas</small>',cols:cloneCols(t,cols),rows:rowsOf(t)});
  let res=rowsOf(t).map(r=>{const o={};cols.forEach(c=>o[c]=r[c]);return o;}); const before=res.length;
  if(selState.distinct){const seen=new Set();res=res.filter(r=>{const k=JSON.stringify(r);if(seen.has(k))return false;seen.add(k);return true;});}
  $('#selResult').innerHTML=cols.length?renderTable({caption:'<small>'+res.length+' filas × '+cols.length+' columnas</small>',cols,rows:res}):'<p class="note">Sin columnas no hay resultado.</p>';
  let m;
  if(!cols.length) m='Elegí al menos una columna.';
  else if(selState.distinct&&res.length<before) m='DISTINCT eliminó '+(before-res.length)+' filas repetidas: quedan '+res.length+' combinaciones distintas.';
  else if(selState.distinct) m='DISTINCT no cambió nada: no había filas repetidas en esas columnas. Para ver un cambio, elegí sales_orders y solo la columna canal: Directo y Web se repiten.';
  else m='En esta consulta, SELECT sin DISTINCT conserva la cantidad de filas ('+res.length+'): solo decide cuáles columnas se ven.';
  say('selMsg',m);
}
selBuildCols();selRender();

/* ---------- SQL 3 · WHERE ---------- */
const WCOLS=DATA.sales_order_lines.cols.map(colName), OPS=['=','<>','>','<','>=','<='];
['w1c','w2c'].forEach(id=>$('#'+id).innerHTML=WCOLS.map(c=>'<option>'+c+'</option>').join(''));
['w1o','w2o'].forEach(id=>$('#'+id).innerHTML=OPS.map(o=>'<option>'+o+'</option>').join(''));
$('#w1c').value='order_id';$('#w2c').value='cantidad';$('#w2o').value='>';
function cmp(a,op,b){ if(typeof a==='number'){b=Number(b);if(isNaN(b))return false;} else {a=String(a);b=String(b);}
  switch(op){case '=':return a===b;case '<>':return a!==b;case '>':return a>b;case '<':return a<b;case '>=':return a>=b;case '<=':return a<=b;} return false;}
function whRender(){
  const c1=$('#w1c').value,o1=$('#w1o').value,v1=$('#w1v').value,j=$('#wjoin').value,c2=$('#w2c').value,o2=$('#w2o').value,v2=$('#w2v').value;
  const rows=rowsOf('sales_order_lines'); const num=c=>typeof rows[0][c]==='number';
  const lit=(c,v)=>num(c)&&!isNaN(Number(v))&&v!==''?v:"'"+v.replace(/'/g,"''")+"'";
  const test=r=>{const a=cmp(r[c1],o1,v1);if(!j)return a;const b=cmp(r[c2],o2,v2);return j==='AND'?a&&b:a||b;};
  $('#whSql').innerHTML=KW('SELECT','select')+' *\n'+KW('FROM','from')+' sales_order_lines\n'+KW('WHERE','where')+' '+c1+' '+o1+' '+esc(lit(c1,v1))+(j?'\n  '+KW(j,'where')+' '+c2+' '+o2+' '+esc(lit(c2,v2)):'')+';';
  const marked=rows.map(r=>{const ok=test(r);const cc={};cc[c1]='sel';if(j)cc[c2]='sel';return Object.assign({},r,{_cls:ok?'pass':'fail',_cc:cc});});
  $('#whTable').innerHTML=renderTable({caption:'sales_order_lines <small>verde pasa · tachado se descarta</small>',cols:DATA.sales_order_lines.cols,rows:marked});
  const res=rows.filter(test);
  $('#whResult').innerHTML=res.length?renderTable({caption:'<small>'+res.length+' filas</small>',cols:DATA.sales_order_lines.cols,rows:res}):'<p class="note">Ninguna fila cumple: el resultado tiene 0 filas. No es un error, es una respuesta.</p>';
  let m='Pasan '+res.length+' de '+rows.length+' filas.'+(j?' Con '+j+(j==='AND'?' las dos condiciones tienen que ser verdaderas en la misma fila.':' alcanza con que una sea verdadera.'):'');
  if(num(c1)&&isNaN(Number(v1))) m+=' Ojo: '+c1+' es numérica y la estás comparando con texto; ninguna fila puede cumplir.';
  say('whMsg',m,res.length?'':'warn');
}
['w1c','w1o','w1v','wjoin','w2c','w2o','w2v'].forEach(id=>{$('#'+id).addEventListener('input',whRender);$('#'+id).addEventListener('change',whRender);});
whRender();

/* ---------- SQL 4 · ORDER BY / LIMIT ---------- */
$('#obCol').innerHTML=DATA.products.cols.map(colName).map(c=>'<option>'+c+'</option>').join('');$('#obCol').value='costo_estandar';$('#obDir').value='DESC';
function obRender(){
  const c=$('#obCol').value,dir=$('#obDir').value,lim=+$('#obLim').value;
  $('#obLimTxt').textContent=lim?'LIMIT '+lim:'sin LIMIT';
  let rows=rowsOf('products').sort((a,b)=>{const x=a[c],y=b[c];const r=typeof x==='number'?x-y:String(x).localeCompare(String(y));return dir==='ASC'?r:-r;});
  const isNum=typeof rows[0][c]==='number'; const max=isNum?Math.max.apply(null,rows.map(r=>r[c])):1;
  rows=rows.map((r,i)=>{const o=Object.assign({},r);o._cls=lim&&i>=lim?'cut':'';o._cc={};o._cc[c]='sel';o._html={};o._html[c]='<span class="rank">'+(i+1)+'º</span>'+esc(r[c])+(isNum?'<span class="gbar" style="width:'+Math.round(r[c]/max*60)+'px"></span>':'');return o;});
  $('#obSql').innerHTML=KW('SELECT','select')+' *\n'+KW('FROM','from')+' products\n'+KW('ORDER BY','order')+' '+c+' '+KW(dir,'order')+(lim?'\n'+KW('LIMIT','order')+' '+lim:'')+';';
  $('#obTable').innerHTML=renderTable({caption:'products <small>ordenado por '+c+' '+dir+'</small>',cols:DATA.products.cols,rows});
  say('obMsg',(isNum?'Columna numérica: se ordena por valor.':'Columna de texto: se ordena alfabéticamente, letra por letra.')+(lim?' LIMIT '+lim+' corta después de la fila '+lim+': las atenuadas no salen en el resultado.':' Sin LIMIT salen todas las filas, pero ordenadas.')+(lim===1&&dir==='DESC'&&c==='costo_estandar'?' Esto responde "¿qué producto tiene el mayor costo estándar?".':''));
}
['obCol','obDir','obLim'].forEach(id=>{$('#'+id).addEventListener('input',obRender);$('#'+id).addEventListener('change',obRender);});
obRender();

/* ---------- SQL 5 · agregación / GROUP BY ---------- */
const r2=x=>Math.round(x*100)/100;
const AGG=[
 {k:'count',sql:'COUNT(*)',f:rs=>rs.length,how:rs=>'contar '+rs.length+' filas'},
 {k:'sum',sql:'SUM(cantidad)',f:rs=>rs.reduce((s,r)=>s+r.cantidad,0),how:rs=>rs.map(r=>r.cantidad).join(' + ')},
 {k:'avg',sql:'AVG(precio_unitario)',f:rs=>r2(rs.reduce((s,r)=>s+r.precio_unitario,0)/rs.length),how:rs=>'('+rs.map(r=>r.precio_unitario).join(' + ')+') / '+rs.length},
 {k:'max',sql:'MAX(precio_unitario)',f:rs=>Math.max.apply(null,rs.map(r=>r.precio_unitario)),how:rs=>'el mayor de '+rs.map(r=>r.precio_unitario).join(', ')},
 {k:'min',sql:'MIN(cantidad)',f:rs=>Math.min.apply(null,rs.map(r=>r.cantidad)),how:rs=>'el menor de '+rs.map(r=>r.cantidad).join(', ')},
 {k:'bruto',sql:'SUM(cantidad * precio_unitario)',f:rs=>rs.reduce((s,r)=>s+r.cantidad*r.precio_unitario,0),how:rs=>rs.map(r=>r.cantidad+'×'+r.precio_unitario).join(' + ')}];
const PAL=['#3B82F6','#F59E0B','#10B981','#EF4444','#8B5CF6','#EC4899'];
$('#agFn').innerHTML=AGG.map(a=>'<option value="'+a.k+'">'+a.sql+'</option>').join('');$('#agFn').value='sum';$('#agGroup').value='order_id';
function agRender(){
  const fn=AGG.find(a=>a.k===$('#agFn').value), g=$('#agGroup').value, rows=rowsOf('sales_order_lines');
  const keys=g?[...new Set(rows.map(r=>r[g]))]:['(todas)']; const color=k=>PAL[keys.indexOf(k)%PAL.length];
  const marked=rows.map(r=>{const k=g?r[g]:'(todas)',c=color(k),st={};st.order_line_id='box-shadow:inset 6px 0 0 '+c;if(g)st[g]='background:'+c+'33;font-weight:600';return Object.assign({},r,{_style:st});});
  $('#agTable').innerHTML=renderTable({caption:'sales_order_lines <small>'+rows.length+' filas · '+keys.length+(g?' grupos':' grupo')+'</small>',cols:DATA.sales_order_lines.cols,rows:marked});
  const res=keys.map(k=>{const rs=g?rows.filter(r=>r[g]===k):rows;const o={};if(g){o[g]=k;o._style={};o._style[g]='box-shadow:inset 6px 0 0 '+color(k)+';font-weight:600';}o[fn.sql]=fn.f(rs);o['cómo se calculó']=fn.how(rs)+' = '+fn.f(rs);return o;});
  $('#agResult').innerHTML=renderTable({cols:(g?[g]:[]).concat([fn.sql,'cómo se calculó']),rows:res});
  $('#agSql').innerHTML=KW('SELECT','select')+' '+(g?g+', ':'')+fn.sql+'\n'+KW('FROM','from')+' sales_order_lines'+(g?'\n'+KW('GROUP BY','group')+' '+g:'')+';';
  say('agMsg',g?''+keys.length+' grupos → '+keys.length+' filas de resultado. Cada color es un grupo: todas las filas con el mismo '+g+' se resumen en una. En estos ejemplos, SELECT muestra la columna usada para agrupar y la función de agregación.':'Sin GROUP BY, las '+rows.length+' filas forman un solo grupo y el resultado es una sola fila con un solo número.');
}
['agFn','agGroup'].forEach(id=>$('#'+id).addEventListener('change',agRender));
agRender();
/* Inclusive interaction: touch and keyboard expose the same relationships. */
$$('#erd li[data-pk],#erd li[data-fk],#star [data-dim]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button')});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"]')){e.preventDefault();e.target.click()}});
function linkRows(root,other,key,otherKey){
  function highlight(e){const tr=e.target.closest('tbody tr');if(!tr)return;$$('tr',other).forEach(r=>{r.classList.toggle('linked',r.dataset[otherKey]===tr.dataset[key]);r.classList.toggle('dim',r.dataset[otherKey]!==tr.dataset[key])})}
  ['click','focusin'].forEach(type=>root.addEventListener(type,highlight));
}
linkRows(pkO,pkC,'ref','id');linkRows(pkC,pkO,'id','ref');
function prepareRows(){ $$('#pkOrders tbody tr,#pkCustomers tbody tr').forEach(tr=>{tr.tabIndex=0;tr.setAttribute('role','button');tr.setAttribute('aria-label','Resaltar relaciones de '+tr.cells[0].textContent)}) }
prepareRows();new MutationObserver(prepareRows).observe(pkO,{childList:true});new MutationObserver(prepareRows).observe(pkC,{childList:true});
$$('#entTable thead th').forEach((th,i)=>{th.tabIndex=0;th.setAttribute('role','button');['focus','click'].forEach(type=>th.addEventListener(type,()=>{entShow('atributo',i);say('entMsg','Atributo: '+esc(th.textContent)+'. Esta columna describe una característica del cliente.')}))});
$$('#entTable tbody tr').forEach((tr,i)=>{tr.tabIndex=0;tr.setAttribute('role','button');['focus','click'].forEach(type=>tr.addEventListener(type,()=>{entShow('registro',null,i);say('entMsg','Registro: '+esc(tr.cells[1].textContent)+'. Una fila identificada por '+esc(tr.cells[0].textContent)+'.')}))});

/* Long source/result exercises have an explicit view switch, never tiny scaled text. */
for(const [sourceId,resultId] of [['anatTable','anatResult'],['selSource','selResult'],['whTable','whResult'],['agTable','agResult']]){
  const source=$('#'+sourceId),result=$('#'+resultId),panel=source.parentElement;
  const sourceHeading=source.previousElementSibling,resultHeading=result.previousElementSibling;
  const bar=document.createElement('div');bar.className='toolbar view-switch';bar.setAttribute('aria-label','Vista de los datos');
  const sourceBtn=document.createElement('button'),resultBtn=document.createElement('button');
  sourceBtn.className=resultBtn.className='btn';sourceBtn.textContent=sourceId==='whTable'?'Evaluar cada fila':'Ver tabla de origen';resultBtn.textContent='Ver resultado';
  sourceBtn.setAttribute('aria-controls',sourceId);resultBtn.setAttribute('aria-controls',resultId);
  function show(sourceOn){source.hidden=!sourceOn;if(sourceHeading)sourceHeading.hidden=true;result.hidden=sourceOn;resultHeading.hidden=true;sourceBtn.classList.toggle('on',sourceOn);resultBtn.classList.toggle('on',!sourceOn);sourceBtn.setAttribute('aria-pressed',sourceOn);resultBtn.setAttribute('aria-pressed',!sourceOn)}
  sourceBtn.addEventListener('click',()=>show(true));resultBtn.addEventListener('click',()=>show(false));bar.append(sourceBtn,resultBtn);panel.prepend(bar);show(sourceId==='anatTable');
  if(sourceId==='anatTable')$$('#anat .clause').forEach(c=>['mouseenter','focus','click'].forEach(type=>c.addEventListener(type,()=>show(true))));
}
const labels={selTable:'Tabla de origen',w1c:'Columna de la primera condición',w1o:'Comparación de la primera condición',wjoin:'Combinar condiciones',w2c:'Columna de la segunda condición',w2o:'Comparación de la segunda condición',obCol:'Columna para ordenar',obDir:'Dirección del orden',agFn:'Función de agregación',agGroup:'Columna para agrupar'};
Object.entries(labels).forEach(([id,label])=>$('#'+id).setAttribute('aria-label',label));
$$('.msg').forEach(el=>{el.setAttribute('role','status');el.setAttribute('aria-live','polite')});
function prepareTables(){
  $$('.tablewrap').forEach(el=>{if(el.scrollWidth>el.clientWidth+2){el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label','Tabla desplazable horizontalmente')}else{el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label')}});
  $$('.toolbar .btn,.steps .btn,.mode .btn').filter(b=>b.matches('[data-card],[data-mode],[data-showdata],[data-null],#grainBtns button,#fullBtns button,#nfSteps button')).forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('on')));
}
let preparePending=false;
new MutationObserver(()=>{if(!preparePending){preparePending=true;requestAnimationFrame(()=>{prepareTables();preparePending=false})}}).observe($('#main'),{childList:true,subtree:true});
window.addEventListener('resize',prepareTables);document.addEventListener('click',()=>requestAnimationFrame(prepareTables));prepareTables();

/* Three checks with explanatory feedback; all answers can be retried. */
const quiz=[
 {q:'¿Cuántos pedidos aparecen en estas dos filas?',options:['1 pedido','2 pedidos','7 pedidos'],correct:0,ok:'P100 aparece dos veces, pero es un único pedido. Cada fila corresponde a una línea.',no:'Mirá order_id: las dos filas pertenecen a P100. Repetir el identificador no crea otro pedido.'},
 {q:'¿Qué devuelve SUM(cantidad) para P100?',options:['2 líneas','7 unidades','1 pedido'],correct:1,ok:'2 + 5 = 7 unidades. La suma usa los valores de cantidad; COUNT(*) contaría 2 filas.',no:'SUM(cantidad) suma 2 y 5. La unidad de ese resultado es “unidades”, según este ejemplo.'},
 {q:'Un costo_flete es NULL. ¿Cómo lo interpretás?',options:['El flete fue gratis','El costo todavía no fue cargado, según la convención del ejemplo','El despacho cuesta 0'],correct:1,ok:'La convención indica un costo sin cargar. Reemplazarlo por cero haría bajar el promedio sin conocer el costo real.',no:'En este ejemplo, 0 significa flete bonificado. NULL significa que falta cargar el costo.'}
];
let quizIndex=0;
function showQuiz(){const q=quiz[quizIndex];$('#quizProgress').textContent='PREGUNTA '+(quizIndex+1)+' / '+quiz.length;$('#quizQuestion').textContent=q.q;$('#quizOptions').replaceChildren();$('#quizNext').hidden=true;say('quizFeedback','Seleccioná una respuesta para comprobarla.');q.options.forEach((option,i)=>{const b=document.createElement('button');b.className='btn';b.textContent=option;b.addEventListener('click',()=>{$$('#quizOptions button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});say('quizFeedback',(i===q.correct?'Correcto. ':'Revisá esta pista. ')+(i===q.correct?q.ok:q.no),i===q.correct?'ok':'warn');$('#quizNext').hidden=i!==q.correct;$('#quizNext').textContent=quizIndex===quiz.length-1?'Volver a practicar ↺':'Siguiente pregunta →'});$('#quizOptions').appendChild(b)})}
$('#quizNext').addEventListener('click',()=>{quizIndex=(quizIndex+1)%quiz.length;showQuiz();$('#quizQuestion').tabIndex=-1;$('#quizQuestion').focus()});showQuiz();

})();

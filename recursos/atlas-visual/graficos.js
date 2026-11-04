// Cada marca reúne la geometría que se dibuja y el dato que se puede consultar.
const graficos = (() => {
  const azul = "#3158be", verde = "#167969", oro = "#bc792a", claro = "#a6b9e8";
  const num = value => value.toLocaleString("es-AR", {maximumFractionDigits: 1});
  const txt = (x,y,value,anchor="start",cl="chart-label") =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cl}">${value}</text>`;
  const rect = (x,y,w,h,color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
  const dot = (x,y,r,color) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const line = (x,y,x2,y2,color="#cbd1c6",width=1) => `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
  const path = (d,color,width=2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
  const meses = ["Ene","Feb","Mar"];

  function barras(mark, rows, max, unit) {
    const x = 92, y = 25, w = 265, paso = 33;
    const base = y + rows.length*paso;
    let svg = [0,max/2,max].map(t => line(x+w*t/max,12,x+w*t/max,base)+txt(x+w*t/max,base+18,num(t),"middle")).join("");
    rows.forEach(([nombre,valor,detalle],i) => {
      const top = y + paso*i, length = w*valor/max;
      svg += mark(detalle || `${nombre} · ${num(valor)} ${unit}.`,
        txt(x-8,top+15,nombre,"end") + rect(x,top,length,19,i===0?azul:claro) + txt(x+length+6,top+15,num(valor),"start","chart-value"));
    });
    return svg;
  }
  const suma = valores => valores.reduce((a,b)=>a+b,0);
  const totalesMes = datos.mesCanal.map(suma);
  const totalesCanal = datos.canales.map((_,i)=>suma(datos.mesCanal.map(fila=>fila[i])));
  const usd = valor => valor.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})+" USD";
  const colores = [azul,verde,"#94621d"];
  const cortos = ["Ejecutivo","Portal B2B","Distribuidor"];
  const leyenda = () => cortos.map((c,i)=>rect(48+115*i,6,10,10,colores[i])+txt(63+115*i,16,c)).join("");

  const make = {
    barras(m) {
      const filas=Object.entries(datos.regiones).map(([nombre,[ventas]])=>[nombre,ventas]);
      filas.push(["(En blanco)",datos.sinRegion]);
      const ranking=filas.filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
      return barras(m,ranking.map(([n,v])=>[n,v/1000,n+" · "+usd(v)]),70,"mil USD");
    },
    desvio(m) {
      let s=line(209,24,209,155,"#344b60",1.5)+txt(209,17,"Objetivo","middle");
      Object.entries(datos.regiones).forEach(([n,[ventas,meta]],i)=>{
        const y=33+i*30, gap=ventas-meta, ancho=gap/250, label=(gap>0?"+":"")+num(gap/1000);
        s+=m(n+" · "+usd(ventas)+" en ventas frente a "+usd(meta)+" de objetivo. Diferencia de "+usd(gap)+".",
          txt(4,y+13,n)+rect(209+Math.min(0,ancho),y,Math.abs(ancho),17,gap>0?verde:oro)+txt(209+ancho+(gap>0?4:-4),y+13,label,gap>0?"start":"end","chart-value"));
      });
      return s+txt(209,177,"Diferencia en miles de USD","middle");
    },
    matriz(m) {
      let s=txt(7,28,"Familia")+cortos.map((c,i)=>txt(187+i*106,28,c,"end")).join("")+line(6,36,410,36);
      Object.entries(datos.familias).forEach(([n,row],i)=>{
        const y=60+i*29;
        s+=m(n+" · "+datos.canales.map((c,j)=>c+" "+usd(row[j])).join(", ")+".",
          rect(5,y-17,405,25,i%2?"#e8edf2":"#f6f7f8")+txt(9,y,n==="Kits de mantenimiento"?"Kits":n)+row.map((v,j)=>txt(187+j*106,y,v?num(v/1000):"·","end","chart-value")).join(""));
      });return s;
    },
    linea(m) {
      const x=i=>62+i*152,y=v=>146-v/445;
      let s=[0,25000,50000].map(v=>line(42,y(v),388,y(v))+txt(33,y(v)+4,v/1000,"end")).join("");
      s+=path(totalesMes.map((v,i)=>(i?"L":"M")+x(i)+" "+y(v)).join(" "),azul,3);
      totalesMes.forEach((v,i)=>s+=m(meses[i]+" · "+usd(v),dot(x(i),y(v),12,"transparent")+dot(x(i),y(v),5,azul)+txt(x(i),168,meses[i],"middle")));
      return s;
    },
    columnas(m) {
      let s=leyenda();
      for(const v of [0,20000,40000]) s+=line(39,149-v/350,400,149-v/350)+txt(30,153-v/350,v/1000,"end");
      datos.mesCanal.forEach((row,i)=>{
        const x=61+i*117;
        row.forEach((v,j)=>{
          if(v) s+=m(meses[i]+" · "+datos.canales[j]+" · "+usd(v),rect(x+23*j,149-v/350,19,v/350,colores[j]));
        });
        s+=txt(x+32,170,meses[i],"middle");
      });return s;
    },
    calor(m) {
      const dias=["Lun","Mar","Mié","Jue","Vie"];
      let s=dias.map((d,i)=>txt(90+i*68,25,d,"middle")).join("");
      datos.dias.forEach((row,j)=>{
        s+=txt(48,60+j*42,meses[j],"end");
        row.forEach((v,i)=>{
          const x=60+i*68,y=36+j*42;
          s+=m(meses[j]+" · "+dias[i]+" · "+v+" líneas de venta.",rect(x,y,61,35,v>=6?"#305588":v>=3?"#a3c1de":"#e3edf4")+
            '<text x="'+(x+30)+'" y="'+(y+23)+'" text-anchor="middle" style="font:600 14px sans-serif" fill="'+(v>=6?"white":"#182e45")+'">'+v+'</text>');
        });
      });return s;
    },
    histograma(m) {
      let s=[0,25,50].map(v=>line(35,145-v*2.2,390,145-v*2.2)+txt(28,149-v*2.2,v,"end")).join("");
      datos.intervalos.forEach((v,i)=>s+=m("De "+num(2000*i)+" a menos de "+num(2000*(i+1))+" USD · "+v+" de 58 líneas.",
        rect(40+i*57,145-v*2.2,56,v*2.2,i===0?azul:claro)));
      return s+Array.from({length:7},(_,i)=>txt(40+i*57,167,i*2,"middle")).join("");
    },
    cajas(m) {
      const x=v=>105+v/37;
      let s=[0,2500,5000,7500,10000].map(v=>line(x(v),23,x(v),145)+txt(x(v),166,num(v/1000),"middle")).join("");
      datos.cajas.forEach(([a,b,c,d,e],i)=>{
        const y=48+40*i;
        s+=m(datos.canales[i]+" · Mínimo "+usd(a)+", Q1 "+usd(b)+", mediana "+usd(c)+", Q3 "+usd(d)+" y máximo "+usd(e)+".",
          txt(90,y+4,cortos[i],"end")+line(x(a),y,x(e),y,azul,2)+line(x(a),y-7,x(a),y+7,azul,2)+line(x(e),y-7,x(e),y+7,azul,2)+rect(x(b),y-11,x(d)-x(b),22,claro)+line(x(c),y-13,x(c),y+13,azul,3));
      });return s;
    },
    dispersion:m=>nube(m,false), burbujas:m=>nube(m,true),
    porcentaje:m=>apiladas(m,true), apiladas:m=>apiladas(m,false),
    anillo(m) {
      let s="",start=-90;
      const total=suma(totalesCanal);
      totalesCanal.forEach((v,i)=>{
        const share=100*v/total,end=start+share*3.6;
        const point=a=>[110+62*Math.cos(a*Math.PI/180),91+62*Math.sin(a*Math.PI/180)].join(" ");
        const arc='<path d="M'+point(start)+' A62 62 0 '+(share>50?1:0)+' 1 '+point(end)+'" fill="none" stroke="'+colores[i]+'" stroke-width="26"/>';
        s+=m(datos.canales[i]+" · "+usd(v)+" de "+usd(total)+" ("+num(share)+" %).",
          arc+rect(210,48+i*35,10,10,colores[i])+txt(228,58+i*35,cortos[i])+txt(407,58+i*35,num(share)+" %","end","chart-value"));
        start=end;
      });return s+txt(110,92,"100 %","middle","chart-value")+txt(110,111,"del T1","middle");
    },
    cascada(m) {
      const [a,b,c]=totalesMes, steps=[["Ene",0,a],["Δ feb",a,b],["Δ mar",b,c],["Cierre",0,c]],y=v=>149-v/420;
      let s=line(18,149,402,149);
      steps.forEach(([n,desde,hasta],i)=>{
        const x=32+i*97, salto=hasta-desde;
        if(i<3) s+=line(x+51,y(hasta),x+97,y(hasta),"#838c92");
        s+=m(n+" · "+usd(salto)+". Nivel alcanzado: "+usd(hasta)+".",
          rect(x,y(Math.max(desde,hasta)),51,Math.abs(salto)/420,i===1?oro:i===2?verde:azul)+txt(x+25,y(Math.max(desde,hasta))-7,(i===2?"+":"")+num(salto/1000),"middle","chart-value")+txt(x+25,170,n,"middle"));
      });return s;
    },
    regiones(m) {
      // Cartograma de las ocho provincias presentes en Contactos. Norte arriba.
      const celdas=[["Jujuy",79,20],["Salta",112,40],["Tucumán",79,60],["Córdoba",112,80],
        ["Santa Fe",145,100],["Neuquén",79,120],["Río Negro",112,140],["Chubut",79,160]];
      let s="";
      celdas.forEach(([n,x,y],i)=>{
        const [activos,cartera]=datos.provincias[n], pct=100*activos/cartera, color=pct===100?azul:pct===0?"#e6ebf2":"#94add9";
        const hex='<polygon points="'+[[x-21,y],[x-11,y-18],[x+11,y-18],[x+21,y],[x+11,y+18],[x-11,y+18]].map(p=>p.join(",")).join(" ")+'" fill="'+color+'" stroke="#697d90"/>';
        const ly=22+i*21;
        s+=m(n+" · "+activos+" de "+cartera+" clientes compraron ("+num(pct)+" %).",
          hex+rect(220,ly-9,10,10,color)+txt(237,ly,n)+txt(400,ly,num(pct)+" %","end","chart-value"));
      });return s;
    },
    ubicaciones(m) {
      // Silueta esquemática de Córdoba y posiciones relativas de las tres ciudades.
      let s=path("M90 14L145 10L168 38L161 76L179 114L145 166L96 176L73 145L54 107L70 73L57 50Z","#aab9c9",1.6);
      [["Córdoba",109,62],["Villa María",143,96],["Río Cuarto",112,125]].forEach(([n,x,y],i)=>{
        const v=datos.ciudadesCordoba[n], ly=50+i*42;
        const marca=v?dot(x,y,Math.sqrt(v)*.13,azul):'<circle cx="'+x+'" cy="'+y+'" r="4" fill="white" stroke="#61738c"/>';
        s+=m(n+" · "+usd(v)+(v?" en ventas netas.":" · Cliente sin ventas en T1."),marca+txt(205,ly,n)+txt(405,ly,num(v/1000),"end","chart-value"));
      });return s;
    }
  };

  function nube(m,size) {
    const x=v=>52+v*52,y=v=>146-v/242;
    let s=[0,15000,30000].map(v=>line(45,y(v),389,y(v))+txt(34,y(v)+4,v/1000,"end")).join("")+[0,1,2,3,4,5,6].map(v=>txt(x(v),167,v,"middle")).join("");
    datos.clientes.forEach(([id,pedidos,ventas,unidades])=>s+=m(id+" · "+pedidos+" pedidos, "+usd(ventas)+(size?" y "+unidades+" unidades.":"."),
      dot(x(pedidos),y(ventas),size?Math.sqrt(unidades)*2.1:5.2,size?verde:azul)));
    return s;
  }
  function apiladas(m,percent) {
    let s=leyenda();
    datos.mesCanal.forEach((row,i)=>{
      let x=54;const y=38+41*i,total=totalesMes[i];
      s+=txt(44,y+17,meses[i],"end");
      row.forEach((v,j)=>{
        if(!v) return;
        const share=v*100/total,w=322*(percent?share/100:v/45000);
        s+=m(meses[i]+" · "+datos.canales[j]+" · "+usd(v)+" de "+usd(total)+" ("+num(share)+" %).",rect(x,y,w,24,colores[j])+
          (w>43?'<text x="'+(x+w/2)+'" y="'+(y+17)+'" text-anchor="middle" style="fill:white;font:600 12px sans-serif">'+(percent?num(share)+" %":num(v/1000))+'</text>':""));
        x+=w;
      });
    });return s+txt(54,167,percent?"0 %":"0")+txt(376,167,percent?"100 %":"45 mil USD","end");
  }

  function mostrar(target,title,draw) {
    const labels=[];
    function mark(label,geometry) {
      const index=labels.push(label)-1;
      return `<g class="datum" role="button" data-point="${index}" tabindex="-1" aria-label="${label}"><title>${label}</title>${geometry}</g>`;
    }
    const body=draw(mark);
    target.innerHTML=`<svg viewBox="0 0 418 190" role="group" aria-label="${title}. Seleccioná una marca para consultar su valor.">${body}</svg>
      <div class="inspector"><div><small>Explorar marcas</small><p aria-live="polite"></p></div>
      <div class="point-nav"><button type="button" aria-label="Marca anterior">←</button><span></span><button type="button" aria-label="Marca siguiente">→</button></div></div>`;
    const items=[...target.querySelectorAll(".datum")], buttons=target.querySelectorAll("button");
    let current=0;
    function select(index,focus=false) {
      current=(index+items.length)%items.length;
      items.forEach((item,i)=>{
        item.setAttribute("aria-pressed",String(i===current));
        item.setAttribute("tabindex",i===current?"0":"-1");
      });
      target.querySelector(".inspector p").textContent=labels[current];
      target.querySelector(".point-nav span").textContent=`${current+1}/${items.length}`;
      if(focus) items[current].focus();
    }
    target.querySelector("svg").addEventListener("click",e=>{
      const item=e.target.closest(".datum");
      if(item) select(Number(item.dataset.point));
    });
    target.querySelector("svg").addEventListener("keydown",e=>{
      const moves={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1,Home:-current,End:items.length-1-current,Enter:0," ":0};
      if(e.key in moves){e.preventDefault(); select(current+moves[e.key],true);}
    });
    buttons[0].onclick=()=>select(current-1);
    buttons[1].onclick=()=>select(current+1);
    select(0);
  }
  return {make,mostrar,barras,totalesCanal,usd};
})();

/* La red: un cerebro de puntos en WebGL2.
   Los puntos salen de la foto de la portada (cada celda toma su color), vuelan y forman el cerebro.
   Modelo anatómico: BodyParts3D, © The Database Center for Life Science, CC BY 4.0
   (muestreado en 24.000 puntos de superficie, recentrado y escalado). */
(function(){
  'use strict';

  var VS_PUNTOS='#version 300 es\n'+
  'layout(location=0) in vec3 aPos;layout(location=1) in vec2 aRej;layout(location=2) in vec3 aCol;layout(location=3) in vec2 aAz;\n'+
  'uniform mat4 uMVP;uniform vec2 uOff;uniform float uMorph,uShift,uTiempo,uDpr,uCelda,uTam,uAparece,uBrillo,uFocoAmt;uniform vec3 uFoco,uFocoCol;\n'+
  'out vec4 vCol;out float vE;\n'+
  'const vec3 IND=vec3(.431,.42,.965);const vec3 CIA=vec3(.271,.824,.949);\n'+
  'void main(){\n'+
  ' vec4 c=uMVP*vec4(aPos,1.);c.xy+=uOff*c.w;vec3 nb=c.xyz/c.w;\n'+
  ' float d=.3*(aRej.y*.5+.5)+aAz.x*.32;\n'+
  ' float e=smoothstep(d,d+.38,uMorph);\n'+
  ' vec2 st=vec2(aRej.x,aRej.y+uShift);\n'+
  ' float arco=sin(3.14159*e);float an=aAz.y*6.2832+uTiempo*.35;\n'+
  ' vec2 sw=vec2(cos(an),sin(an))*arco*(.08+.22*aAz.x);\n'+
  ' gl_Position=vec4(mix(st,nb.xy,e)+sw,mix(0.,nb.z,e),1.);\n'+
  ' float h=clamp(.5+.45*sin(aPos.x*2.7+aPos.z*1.9+aAz.y*1.5)+aPos.y*.3,0.,1.);\n'+
  ' vec3 base=mix(IND,CIA,h);\n'+
  ' float prof=clamp((c.w-3.3)/1.9,0.,1.);\n'+
  ' float tw=.72+.28*sin(uTiempo*(.8+aAz.x*2.2)+aAz.y*60.);\n'+
  ' vec3 fin=base*(1.25-prof*.85)*tw*uBrillo;\n'+
  ' float f=uFocoAmt*smoothstep(.5,.0,distance(aPos,uFoco));\n'+
  ' fin=mix(fin,uFocoCol*(1.15+.3*tw),f);\n'+
  ' vCol=vec4(mix(aCol,fin,e),uAparece);vE=e;\n'+
  ' float sFin=uTam*(.5+aAz.x*1.)/c.w*uDpr*(1.+f*.9);\n'+
  ' gl_PointSize=mix(uCelda,sFin,smoothstep(0.,.3,e));\n'+
  '}';
  var FS_PUNTOS='#version 300 es\nprecision mediump float;in vec4 vCol;in float vE;out vec4 o;\n'+
  'void main(){vec2 q=gl_PointCoord-.5;float r=length(q);float m=mix(1.,smoothstep(.5,.08,r),smoothstep(.04,.35,vE));\n'+
  ' float a=vCol.a*m;if(a<.004)discard;float op=1.-smoothstep(0.,.45,vE);o=vec4(vCol.rgb*a,a*op);}';

  var VS_PLEXO='#version 300 es\nlayout(location=0) in vec3 aPos;layout(location=1) in vec2 aT;\n'+
  'uniform mat4 uMVP;uniform vec2 uOff;uniform float uTiempo,uAlfa;out float vA;\n'+
  'void main(){vec4 c=uMVP*vec4(aPos,1.);c.xy+=uOff*c.w;gl_Position=c;\n'+
  ' float prof=clamp((c.w-3.3)/1.9,0.,1.);\n'+
  ' float p=pow(.5+.5*sin(uTiempo*1.3+aT.y*40.-aT.x*2.2),10.);\n'+
  ' vA=uAlfa*((.2-prof*.13)+p*.55);}';
  var FS_PLEXO='#version 300 es\nprecision mediump float;in float vA;out vec4 o;void main(){o=vec4(vec3(.42,.72,1.)*vA,0.);}';

  var VS_COLOR='#version 300 es\nlayout(location=0) in vec3 aPos;layout(location=1) in vec4 aCol;layout(location=2) in float aTam;\n'+
  'uniform mat4 uMVP;uniform vec2 uOff;uniform float uDpr;out vec4 vCol;\n'+
  'void main(){vec4 c=uMVP*vec4(aPos,1.);c.xy+=uOff*c.w;gl_Position=c;vCol=aCol;gl_PointSize=aTam*uDpr*16./c.w;}';
  var FS_LINEA='#version 300 es\nprecision mediump float;in vec4 vCol;out vec4 o;void main(){o=vec4(vCol.rgb*vCol.a,0.);}';
  var FS_BRILLO='#version 300 es\nprecision mediump float;in vec4 vCol;out vec4 o;\n'+
  'void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float halo=pow(1.-r,2.2)*.55;float nucleo=smoothstep(.22,.0,r);\n'+
  ' vec3 c=vCol.rgb*halo+mix(vCol.rgb,vec3(1.),.6)*nucleo;o=vec4(c*vCol.a,0.);}';

  function shader(gl,t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x}
  function programa(gl,vs,fs){
    var p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    var u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
    for(var i=0;i<n;i++){var a=gl.getActiveUniform(p,i);u[a.name]=gl.getUniformLocation(p,a.name)}
    return {p:p,u:u};
  }
  function perspectiva(f,a,n,l){var t=1/Math.tan(f/2),m=new Float32Array(16);m[0]=t/a;m[5]=t;m[10]=(l+n)/(n-l);m[11]=-1;m[14]=2*l*n/(n-l);return m}
  function mul(a,b){var o=new Float32Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
  function rotY(t){var c=Math.cos(t),s=Math.sin(t);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1])}
  function rotX(t){var c=Math.cos(t),s=Math.sin(t);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1])}
  function escTras(s,d){return new Float32Array([s,0,0,0,0,s,0,0,0,0,s,0,0,0,-d,1])}
  function azar(sem){return function(){sem=(sem*1664525+1013904223)>>>0;return sem/4294967296}}

  /* Direcciones donde nace cada web (x = hemisferio izquierdo, y = arriba, z = frente) */
  var DIRS=[[.55,.55,.75],[-.45,.85,-.25],[.95,-.25,.1],[-.35,.05,-.95],[.45,-.75,-.55],[-.7,.3,.7],[.35,.9,-.3],[-.9,-.2,.05],[.1,.5,-.9]];

  function crear(lienzo,buf,op){
    var gl=lienzo.getContext('webgl2',{antialias:false,alpha:true,premultipliedAlpha:true,depth:false,powerPreference:'high-performance'});
    if(!gl)return null;
    var total=new DataView(buf).getUint32(0,true), n=Math.min(total,op.n||total);
    var q=new Int16Array(buf,4,total*3);
    var P=new Float32Array(n*3);for(var i=0;i<n*3;i++)P[i]=q[i]/32767;
    var rnd=azar(91), AZ=new Float32Array(n*2);for(i=0;i<n*2;i++)AZ[i]=rnd();

    var pP=programa(gl,VS_PUNTOS,FS_PUNTOS), pX=programa(gl,VS_PLEXO,FS_PLEXO), pL=programa(gl,VS_COLOR,FS_LINEA), pB=programa(gl,VS_COLOR,FS_BRILLO);

    function bufer(datos,uso){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,datos,uso||gl.STATIC_DRAW);return b}
    function attr(loc,b,tam,tipo,norm,paso,off){gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,tam,tipo,!!norm,paso||0,off||0)}

    /* Puntos */
    var vaoP=gl.createVertexArray();gl.bindVertexArray(vaoP);
    var bPos=bufer(P), bRej=bufer(new Float32Array(n*2),gl.DYNAMIC_DRAW), bCol=bufer(new Uint8Array(n*3),gl.DYNAMIC_DRAW), bAz=bufer(AZ);
    attr(0,bPos,3,gl.FLOAT);attr(1,bRej,2,gl.FLOAT);attr(2,bCol,3,gl.UNSIGNED_BYTE,true);attr(3,bAz,2,gl.FLOAT);

    /* Red de neuronas: vecinos más cercanos entre los primeros puntos */
    var M=Math.min(n,op.nodos||1500), R2=.17*.17, ady=[], aristas=[];
    for(i=0;i<M;i++)ady.push([]);
    for(i=0;i<M;i++){
      var mejores=[];
      for(var j=0;j<M;j++){if(j===i)continue;var dx=P[i*3]-P[j*3],dy=P[i*3+1]-P[j*3+1],dz=P[i*3+2]-P[j*3+2],d=dx*dx+dy*dy+dz*dz;if(d<R2){mejores.push([d,j])}}
      mejores.sort(function(a,b){return a[0]-b[0]});
      for(var k=0;k<Math.min(3,mejores.length);k++){var jj=mejores[k][1];if(ady[i].indexOf(jj)<0){ady[i].push(jj);ady[jj].push(i);aristas.push(i,jj)}}
    }
    var ne=aristas.length/2, lin=new Float32Array(ne*2*3), linT=new Float32Array(ne*2*2);
    for(i=0;i<ne;i++){var a=aristas[i*2],b=aristas[i*2+1],ph=rnd();
      lin.set([P[a*3],P[a*3+1],P[a*3+2],P[b*3],P[b*3+1],P[b*3+2]],i*6);linT.set([0,ph,1,ph],i*4)}
    var vaoX=gl.createVertexArray();gl.bindVertexArray(vaoX);attr(0,bufer(lin),3,gl.FLOAT);attr(1,bufer(linT),2,gl.FLOAT);

    /* Anclas de las webs y caminos del impulso desde el tronco */
    function masCercano(x,y,z){var m=-1,md=1e9;for(var i=0;i<M;i++){var dx=P[i*3]-x,dy=P[i*3+1]-y,dz=P[i*3+2]-z,d=dx*dx+dy*dy+dz*dz;if(d<md&&ady[i].length){md=d;m=i}}return m}
    var raiz=masCercano(0,-.45,-.05), anclas=[], usados={};
    var previo=new Int32Array(M).fill(-1);previo[raiz]=raiz;var cola=[raiz];
    while(cola.length){var c0=cola.shift();ady[c0].forEach(function(v){if(previo[v]<0){previo[v]=c0;cola.push(v)}})}
    for(i=0;i<op.colores.length;i++){
      var D=DIRS[i%DIRS.length],l=Math.hypot(D[0],D[1],D[2]),mj=-1,mv=-9;
      for(j=0;j<M;j++){if(usados[j]||previo[j]<0)continue;var x=P[j*3],y=P[j*3+1],z=P[j*3+2],r=Math.hypot(x,y,z)||1,v=(x*D[0]+y*D[1]+z*D[2])/(r*l)+r*.25;if(v>mv){mv=v;mj=j}}
      usados[mj]=1;anclas.push(mj);
    }
    var caminos=anclas.map(function(a){
      var c=[],v=a;if(previo[a]<0)return [[0,-.45,-.05],[P[a*3],P[a*3+1],P[a*3+2]]];
      while(v!==raiz){c.push([P[v*3],P[v*3+1],P[v*3+2]]);v=previo[v]}c.push([P[raiz*3],P[raiz*3+1],P[raiz*3+2]]);return c.reverse();
    });
    var anclaPos=anclas.map(function(a){return [P[a*3],P[a*3+1],P[a*3+2]]});

    /* Buffers dinámicos: líneas de color y destellos */
    var MAXL=600, dinL=new Float32Array(MAXL*7), MAXB=64, dinB=new Float32Array(MAXB*8);
    var vaoL=gl.createVertexArray();gl.bindVertexArray(vaoL);var bL=bufer(dinL,gl.DYNAMIC_DRAW);
    attr(0,bL,3,gl.FLOAT,false,28,0);attr(1,bL,4,gl.FLOAT,false,28,12);gl.disableVertexAttribArray(2);gl.vertexAttrib1f(2,1);
    var vaoB=gl.createVertexArray();gl.bindVertexArray(vaoB);var bB=bufer(dinB,gl.DYNAMIC_DRAW);
    attr(0,bB,3,gl.FLOAT,false,32,0);attr(1,bB,4,gl.FLOAT,false,32,12);attr(2,bB,1,gl.FLOAT,false,32,28);
    gl.bindVertexArray(null);

    /* Rejilla de salida (la foto de la portada en celdas) */
    var W=1,H=1,dpr=1,cols=1,filas=1,celdaPx=1,ultimaFoto=null,asignacion=null;
    function rejilla(){
      cols=Math.max(8,Math.round(Math.sqrt(n*W/H)));filas=Math.ceil(n/cols);var celdas=cols*filas;
      var perm=new Uint32Array(celdas);for(var i=0;i<celdas;i++)perm[i]=i;var r=azar(7);
      for(i=celdas-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=perm[i];perm[i]=perm[j];perm[j]=t}
      asignacion=perm;var g=new Float32Array(n*2);
      for(i=0;i<n;i++){var cel=perm[i],cx=cel%cols,cy=Math.floor(cel/cols);g[i*2]=(cx+.5)/cols*2-1;g[i*2+1]=1-(cy+.5)/filas*2}
      gl.bindBuffer(gl.ARRAY_BUFFER,bRej);gl.bufferData(gl.ARRAY_BUFFER,g,gl.DYNAMIC_DRAW);
      celdaPx=(W/cols)*dpr+1.2;
      if(ultimaFoto)foto(ultimaFoto);
    }
    var c2=document.createElement('canvas'),x2=c2.getContext('2d',{willReadFrequently:true});
    function foto(img){
      ultimaFoto=img;if(!img||!img.naturalWidth)return;
      c2.width=cols;c2.height=filas;var iw=img.naturalWidth,ih=img.naturalHeight,va=W/H,sx=0,sy=0,sw=iw,sh=ih;
      if(iw/ih>va){sw=ih*va;sx=(iw-sw)/2}else{sh=iw/va}
      x2.filter='blur(1px)';x2.drawImage(img,sx,sy,sw,sh,0,0,cols,filas);
      var d=x2.getImageData(0,0,cols,filas).data,col=new Uint8Array(n*3);
      for(var i=0;i<n;i++){var cel=asignacion[i],cx=cel%cols,cy=Math.floor(cel/cols),k=cel*4;
        var nx=(cx+.5)/cols*2-1,ny=(cy+.5)/filas*2-1;
        var f=.5*(1-.55*Math.exp(-(nx*nx/.35+ny*ny/.3)))*(1-.6*Math.max(0,Math.hypot(nx*.8,ny)-.75));
        if(ny>.3)f*=1-.8*Math.min(1,(ny-.3)/.7);
        col[i*3]=Math.min(255,d[k]*f*1.1);col[i*3+1]=Math.min(255,d[k+1]*f*1.1);col[i*3+2]=Math.min(255,d[k+2]*f*1.1)}
      gl.bindBuffer(gl.ARRAY_BUFFER,bCol);gl.bufferData(gl.ARRAY_BUFFER,col,gl.DYNAMIC_DRAW);
    }
    function medir(){
      dpr=Math.min(window.devicePixelRatio||1,op.dprMax||2);
      var w=lienzo.clientWidth||innerWidth,h=lienzo.clientHeight||innerHeight,cambia=Math.abs(w-W)>1||Math.abs(h-H)>h*.12;
      lienzo.width=Math.round(w*dpr);lienzo.height=Math.round(h*dpr);
      if(cambia||!asignacion){W=w;H=h;rejilla()}else{W=w;H=h}
    }
    medir();

    var MVP=null,off=[0,0],pant=[];
    function proyectar(v){var m=MVP,x=v[0],y=v[1],z=v[2];
      var cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],cw=m[3]*x+m[7]*y+m[11]*z+m[15];
      cx+=off[0]*cw;cy+=off[1]*cw;return {x:(cx/cw*.5+.5)*W,y:(.5-cy/cw*.5)*H,w:cw}}

    function hexRGB(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]}
    var COL=op.colores.map(hexRGB);

    function pintar(s){
      gl.viewport(0,0,lienzo.width,lienzo.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      off=[s.offX,s.offY];
      var proy=perspectiva(.62,W/H,.1,50),mod=mul(rotX(s.pitch),rotY(s.yaw));
      MVP=mul(proy,mul(escTras(s.escala,4.2),mod));
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      var t=s.tiempo;

      if(s.aparece>0){
        gl.useProgram(pP.p);var u=pP.u;
        gl.uniformMatrix4fv(u.uMVP,false,MVP);gl.uniform2f(u.uOff,off[0],off[1]);
        gl.uniform1f(u.uMorph,s.morph);gl.uniform1f(u.uShift,s.shift);gl.uniform1f(u.uTiempo,t);gl.uniform1f(u.uDpr,dpr);
        gl.uniform1f(u.uCelda,celdaPx);gl.uniform1f(u.uTam,op.tam||9);gl.uniform1f(u.uAparece,s.aparece);gl.uniform1f(u.uBrillo,s.brillo);
        var fa=s.foco>=0?s.focoAmt:0,fp=s.foco>=0?anclaPos[s.foco]:[9,9,9],fc=s.foco>=0?COL[s.foco]:[0,0,0];
        gl.uniform1f(u.uFocoAmt,fa);gl.uniform3f(u.uFoco,fp[0],fp[1],fp[2]);gl.uniform3f(u.uFocoCol,fc[0],fc[1],fc[2]);
        gl.bindVertexArray(vaoP);gl.drawArrays(gl.POINTS,0,n);
      }
      var red=Math.max(0,Math.min(1,(s.morph-.86)/.14));
      if(red>0){
        gl.useProgram(pX.p);gl.uniformMatrix4fv(pX.u.uMVP,false,MVP);gl.uniform2f(pX.u.uOff,off[0],off[1]);gl.uniform1f(pX.u.uTiempo,t);gl.uniform1f(pX.u.uAlfa,red*s.brillo);
        gl.bindVertexArray(vaoX);gl.drawArrays(gl.LINES,0,ne*2);
      }

      /* Posición de cada nodo: en su ancla o, al final, en órbita */
      var nl=0,nb=0,ef=s.final;pant=[];
      function linea(a,b,c,al,bl){if(nl>=MAXL-1)return;dinL.set([a[0],a[1],a[2],c[0],c[1],c[2],al,b[0],b[1],b[2],c[0],c[1],c[2],bl],nl*7);nl+=2}
      function brillo(p,c,al,tam){if(nb>=MAXB)return;dinB.set([p[0],p[1],p[2],c[0],c[1],c[2],al,tam],nb*8);nb++}
      for(var i=0;i<anclaPos.length;i++){
        var A=anclaPos[i],L=Math.hypot(A[0],A[1],A[2])||1,fuera=1+.09,
            base=[A[0]*fuera,A[1]*fuera,A[2]*fuera];
        /* órbita en una elipse de cara a la cámara: se deshace el giro del cerebro */
        var ang=i/anclaPos.length*Math.PI*2+t*.07+.35,q=[Math.cos(ang)*(op.orbX||1.75),Math.sin(ang)*(op.orbY||1.08),Math.sin(ang)*.45];
        var cp=Math.cos(-s.pitch),sp=Math.sin(-s.pitch),qy=q[1]*cp-q[2]*sp,qz=q[1]*sp+q[2]*cp;
        var cy=Math.cos(-s.yaw),sy=Math.sin(-s.yaw),orb=[q[0]*cy+qz*sy,qy,-q[0]*sy+qz*cy];
        var e=ef*ef*(3-2*ef),p=[base[0]+(orb[0]-base[0])*e,base[1]+(orb[1]-base[1])*e,base[2]+(orb[2]-base[2])*e];
        var vis=Math.max(s.visto[i]||0,ef),act=(s.activo===i?s.focoAmt:0);
        if(vis>0||act>0){
          var tl=.85+.15*Math.sin(t*2.4+i);
          brillo(p,COL[i],Math.min(1,(vis*.55+act*.6+ef*.3))*tl,(5+act*5+ef*3)*(s.escala));
          if(ef>0)linea(A,p,COL[i],.0,.55*ef);
          else if(vis>0)linea(A,base,COL[i],.5*vis,.5*vis);
        }
        pant.push(proyectar(p));
      }
      /* Impulso: recorre el camino desde el tronco hasta el ancla */
      if(s.activo>=0&&s.impulso>0&&s.impulso<1.5){
        var cam=caminos[s.activo],seg=cam.length-1,cab=Math.min(1,s.impulso)*seg,ap=s.impulso>1?Math.max(0,1-(s.impulso-1)/.5):1,cc=COL[s.activo];
        for(var k=0;k<seg;k++){if(k>cab)break;var a1=Math.max(0,1-(cab-k)/5),a2=Math.max(0,1-(cab-k-1)/5);
          var fin=k+1>cab?cab-k:1,pb=[cam[k][0]+(cam[k+1][0]-cam[k][0])*fin,cam[k][1]+(cam[k+1][1]-cam[k][1])*fin,cam[k][2]+(cam[k+1][2]-cam[k][2])*fin];
          linea(cam[k],pb,cc,(.25+a1*.75)*ap,(.25+a2*.75)*ap)}
        if(s.impulso<1){var kk=Math.floor(cab),ff=cab-kk,ph=kk<seg?[cam[kk][0]+(cam[kk+1][0]-cam[kk][0])*ff,cam[kk][1]+(cam[kk+1][1]-cam[kk][1])*ff,cam[kk][2]+(cam[kk+1][2]-cam[kk][2])*ff]:cam[seg];
          brillo(ph,cc,1,9*s.escala);brillo(cam[0],cc,.5*(1-s.impulso),6*s.escala)}
      }
      if(nl){gl.useProgram(pL.p);gl.uniformMatrix4fv(pL.u.uMVP,false,MVP);gl.uniform2f(pL.u.uOff,off[0],off[1]);
        gl.bindVertexArray(vaoL);gl.bindBuffer(gl.ARRAY_BUFFER,bL);gl.bufferSubData(gl.ARRAY_BUFFER,0,dinL.subarray(0,nl*7));gl.drawArrays(gl.LINES,0,nl)}
      if(nb){gl.useProgram(pB.p);gl.uniformMatrix4fv(pB.u.uMVP,false,MVP);gl.uniform2f(pB.u.uOff,off[0],off[1]);gl.uniform1f(pB.u.uDpr,dpr*(op.brilloEsc||1));
        gl.bindVertexArray(vaoB);gl.bindBuffer(gl.ARRAY_BUFFER,bB);gl.bufferSubData(gl.ARRAY_BUFFER,0,dinB.subarray(0,nb*8));gl.drawArrays(gl.POINTS,0,nb)}
      gl.bindVertexArray(null);
    }

    /* Ángulo para que un ancla mire a cámara (con un pequeño desvío) */
    function orientar(i,desvio){
      var A=anclaPos[i],alfa=Math.atan2(A[0],A[2]),yaw=desvio-alfa;
      var x=A[0]*Math.cos(yaw)+A[2]*Math.sin(yaw),z=-A[0]*Math.sin(yaw)+A[2]*Math.cos(yaw),elev=Math.atan2(A[1],z);
      return {yaw:yaw,pitch:Math.max(-.55,Math.min(.55,(.12-elev)*.7))};
    }
    return {pintar:pintar,medir:medir,foto:foto,orientar:orientar,pantalla:function(){return pant},n:n,gl:gl};
  }
  window.Red={crear:crear};
})();

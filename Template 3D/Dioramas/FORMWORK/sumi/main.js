/* SUMI — ink diffusion on washi paper (raw WebGL) + motion */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('ink');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });

  if (!gl) { canvas.classList.add('fallback'); }
  else {
    const vert = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
    const frag = `
      precision highp float;
      uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse;
      float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);
        float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
      float fbm(vec2 p){float v=0.,a=.55;mat2 m=mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
      void main(){
        vec2 uv=gl_FragCoord.xy/u_res.xy;
        vec2 p=(gl_FragCoord.xy-0.5*u_res.xy)/u_res.y;
        float t=u_time*0.03;
        vec2 q=vec2(fbm(p*1.5+vec2(0.0,t)), fbm(p*1.5+vec2(3.1,-t)));
        float f=fbm(p*1.7+1.5*q+t*0.4);
        // pool ink toward the right so the left copy stays on clean paper
        float bias=smoothstep(-0.2,0.9,p.x)*0.14;
        vec2 mp=(u_mouse-0.5)*vec2(u_res.x/u_res.y,1.0)*2.0;
        float bloom=smoothstep(0.85,0.0,length(p-mp))*0.4;
        float ink=f+bias+bloom-0.12;
        float amt=smoothstep(0.56,0.80,ink);
        float feather=smoothstep(0.44,0.56,ink)*0.35;
        amt=clamp(amt+feather*0.5,0.0,1.0);
        vec3 paper=vec3(0.937,0.914,0.867)+ (noise(gl_FragCoord.xy*0.4)-0.5)*0.018;
        vec3 sumi=vec3(0.10,0.088,0.078);
        vec3 col=mix(paper,sumi,amt*0.94);
        col=mix(col,paper,0.10*pow(1.0-uv.y,2.0)); // soften bottom
        gl_FragColor=vec4(col,1.0);
      }`;
    const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);return s;};
    const prog=gl.createProgram();
    gl.attachShader(prog,sh(gl.VERTEX_SHADER,vert));
    gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,frag));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){canvas.classList.add('fallback');}
    else{
      gl.useProgram(prog);
      const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      const uT=gl.getUniformLocation(prog,'u_time'),uR=gl.getUniformLocation(prog,'u_res'),uM=gl.getUniformLocation(prog,'u_mouse');
      const m={x:.62,y:.5,tx:.62,ty:.5};
      if(!reduce)addEventListener('pointermove',e=>{m.tx=e.clientX/innerWidth;m.ty=1-e.clientY/innerHeight;},{passive:true});
      const dpr=Math.min(devicePixelRatio||1,1.5);
      function resize(){const w=(canvas.clientWidth*dpr)|0,h=(canvas.clientHeight*dpr)|0;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}}
      const start=performance.now();
      function frame(now){resize();
        m.x+=(m.tx-m.x)*0.045;m.y+=(m.ty-m.y)*0.045;
        gl.uniform1f(uT,reduce?40.0:(now-start)/1000);
        gl.uniform2f(uR,canvas.width,canvas.height);
        gl.uniform2f(uM,m.x,m.y);
        gl.drawArrays(gl.TRIANGLES,0,3);
        if(!reduce)requestAnimationFrame(frame);
      }
      addEventListener('resize',resize);resize();requestAnimationFrame(frame);
    }
  }

  /* motion layer */
  const hero=document.querySelector('.hero');
  requestAnimationFrame(()=>requestAnimationFrame(()=>hero.classList.add('loaded')));
  setTimeout(()=>hero.classList.add('loaded'),400);
  const revealAll=()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in'));
  window.addEventListener('load',()=>{
    if(!window.gsap){revealAll();return;}
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal:not(.hero .reveal)').forEach(el=>
      ScrollTrigger.create({trigger:el,start:'top 88%',onEnter:()=>el.classList.add('is-in')}));
  });
  setTimeout(()=>{if(!window.gsap)revealAll();},2500);
})();

/* Aviso de temporada (Thanksgiving / Navidad). Lo carga functions/_middleware.js en lugar del pop-up del club hasta el 7 de enero de 2027; despues vuelve solo el del club.
   Sale a los 8 s o al bajar 40% de la pagina; no sale en /navidad/; si lo cierran no vuelve en 7 dias. Para verlo sin esperar: #ghn-preview */
(function(){var C={"id":"sm","a":"#0b2f5b","t1":"Thanksgiving en Siete Mares","d1":"Especial para 4 personas, para retirar o a domicilio. Jueves 26 de noviembre.","img1":"/assets/navidad/sm-nav-thanksgiving-540.webp","t2":"Navidad en Siete Mares","d2":"Combos para 4, buffets en el Lounge y menú para grupos.","img2":"/assets/navidad/sm-nav-combos-540.webp","cta":"Ver todo"};
try{if(location.pathname.indexOf("/navidad")===0)return}catch(e){}
var KEY="ghnav_closed_"+C.id,force=location.hash==="#ghn-preview";
try{var v=localStorage.getItem(KEY);if(!force&&v&&Date.now()-(+v)<6048e5)return}catch(e){}
var tg=Date.now()<Date.UTC(2026,10,27,5),title=tg?C.t1:C.t2,desc=tg?C.d1:C.d2,img=tg?C.img1:C.img2,href="/navidad/#"+(tg?"thanksgiving":"navidad"),shown=false;
function save(){try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}}
function show(){if(shown||!document.body)return;shown=true;var st=document.createElement("style");st.textContent=".ghn{position:fixed;left:16px;bottom:16px;z-index:2147483000;width:min(370px,calc(100vw - 32px));background:#fff;color:#1d1d1d;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:hidden;display:flex;align-items:stretch;font:15px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;animation:ghnIn .35s ease-out}.ghn img{width:112px;height:auto;object-fit:cover;flex:none;display:block}.ghn .ghn-b{padding:14px 34px 14px 14px}.ghn strong{display:block;font-size:1.05rem;margin:0 0 4px}.ghn p{margin:0 0 10px;font-size:.92rem;color:#444}.ghn a.ghn-go{display:inline-block;background:"+C.a+";color:#fff;text-decoration:none;font-weight:700;padding:9px 14px;border-radius:9px}.ghn button{position:absolute;top:4px;right:6px;border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#666;padding:6px}@media (max-width:600px){.ghn{bottom:84px}}@keyframes ghnIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}@media (prefers-reduced-motion:reduce){.ghn{animation:none}}";document.head.appendChild(st);
var el=document.createElement("aside");el.className="ghn";el.setAttribute("aria-label",title);el.innerHTML="<img src=\""+img+"\" alt=\"\" width=\"112\" height=\"140\"><div class=\"ghn-b\"><strong>"+title+"</strong><p>"+desc+"</p><a class=\"ghn-go\" href=\""+href+"\">"+C.cta+"</a></div><button type=\"button\" aria-label=\"Cerrar\">\u00d7</button>";
el.querySelector("button").onclick=function(){el.remove();save();if(window.gtag)gtag("event","navidad_popup_close",{site:C.id})};
el.querySelector("a.ghn-go").addEventListener("click",function(){save();if(window.gtag)gtag("event","navidad_popup_click",{site:C.id})});
document.body.appendChild(el);if(window.gtag)gtag("event","navidad_popup_view",{site:C.id})}
if(force){if(document.readyState==="loading")addEventListener("DOMContentLoaded",show);else show();return}
setTimeout(show,8000);
addEventListener("scroll",function f(){var h=document.documentElement;if((h.scrollTop+innerHeight)/h.scrollHeight>.4){removeEventListener("scroll",f);show()}},{passive:true});
})();

export function mountHeroCarousel(root,{autoplay=true,delay=6000}={}){
 if(!root)return ()=>{};
 const slides=Array.from(root.querySelectorAll('[data-hero-slide]'));
 const choices=Array.from(root.querySelectorAll('[data-hero-choice]'));
 const caption=root.querySelector('[data-hero-caption]'),toggle=root.querySelector('[data-hero-toggle]'),status=root.querySelector('[data-hero-status]');
 if(slides.length<2)return ()=>{};
 const doc=root.ownerDocument,view=doc.defaultView,media=view.matchMedia('(prefers-reduced-motion: reduce)');
 const interval=Math.max(4000,Math.min(10000,Number(delay)||6000));
 let index=0,timer=null,paused=!autoplay||media.matches,hovered=false,focused=false,destroyed=false;
 const listeners=[];
 function listen(target,type,handler){target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));}
 function stop(){if(timer!==null){view.clearInterval(timer);timer=null;}}
 function refresh(){stop();if(toggle){toggle.textContent=paused?'Play':'Pause';toggle.setAttribute('aria-label',paused?'Play image rotation':'Pause image rotation');}if(!destroyed&&!paused&&!hovered&&!focused&&!doc.hidden)timer=view.setInterval(()=>show(index+1,false),interval);}
 function show(next,manual){index=(next+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});choices.forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));if(caption)caption.textContent=slides[index].dataset.caption||'';if(manual&&status)status.textContent='Image '+(index+1)+' of '+slides.length+': '+(slides[index].dataset.title||'Research');}
 choices.forEach((button,i)=>listen(button,'click',()=>{show(i,true);refresh();}));
 if(toggle)listen(toggle,'click',()=>{paused=!paused;focused=false;refresh();});
 listen(root,'mouseenter',()=>{hovered=true;refresh();});
 listen(root,'mouseleave',()=>{hovered=false;refresh();});
 listen(root,'focusin',()=>{focused=true;refresh();});
 listen(root,'focusout',event=>{if(!root.contains(event.relatedTarget)){focused=false;refresh();}});
 listen(doc,'visibilitychange',refresh);
 listen(media,'change',()=>{if(media.matches)paused=true;refresh();});
 show(0,false);refresh();
 return ()=>{destroyed=true;stop();listeners.forEach(remove=>remove());};
}

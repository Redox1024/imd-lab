// Shared by the editor, preview and published home page.
export const homeLayoutDefaults = Object.freeze({
  paddingTop:36,paddingBottom:30,headingSize:62,bodySize:15,
  imageShape:'Square (1:1)',imageMaxHeight:760,textAlignment:'Center'
});
export const balancedHomeLayout = Object.freeze({
  ...homeLayoutDefaults,paddingTop:24,paddingBottom:24,bodySize:18,
  imageShape:'Landscape (6:5)',imageMaxHeight:520
});
export const homeLayoutFields = [
  ['paddingTop','Space above the intro','range',true,{min:0,max:100,step:1,unit:'px',help:'Distance between the navigation and the home intro.'}],
  ['paddingBottom','Space below the intro','range',true,{min:0,max:100,step:1,unit:'px',help:'Distance between the home intro and recent research.'}],
  ['headingSize','Headline size','range',true,{min:36,max:80,step:1,unit:'px',help:'Maximum desktop size. The headline scales down on smaller screens.'}],
  ['bodySize','Description size','range',true,{min:14,max:22,step:1,unit:'px',help:'Size of the description below the headline.'}],
  ['imageShape','Image proportions','select',true,['Portrait (4:5)','Square (1:1)','Landscape (6:5)','Wide (4:3)']],
  ['imageMaxHeight','Maximum image height','range',true,{min:280,max:760,step:1,unit:'px',help:'Caps the image height on desktop. Smaller screens also use the chosen proportions.'}],
  ['textAlignment','Text vertical position','select',true,['Top','Center','Bottom']]
];
export function normalizeHomeLayout(raw={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Home layout: Invalid settings.');
  const result={...homeLayoutDefaults,...raw};
  for(const [key,label,type,,extra] of homeLayoutFields){
    const value=result[key];
    if(type==='range'){
      if((typeof value!=='number'&&typeof value!=='string')||String(value).trim()===''||!Number.isFinite(Number(value))||!Number.isInteger(Number(value))||Number(value)<extra.min||Number(value)>extra.max)throw new Error(`${label}: Enter a whole number from ${extra.min} to ${extra.max}.`);
      result[key]=Number(value);
    }else if(!extra.includes(value))throw new Error(label+': Choose a value from the list.');
  }
  return Object.fromEntries(homeLayoutFields.map(([key])=>[key,result[key]]));
}
export function homeLayoutStyle(raw) {
  const l=normalizeHomeLayout(raw);
  const ratio={'Portrait (4:5)':.8,'Square (1:1)':1,'Landscape (6:5)':1.2,'Wide (4:3)':4/3}[l.imageShape];
  const alignment={Top:'start',Center:'center',Bottom:'end'}[l.textAlignment];
  return `--home-pad-top:${l.paddingTop}px;--home-pad-bottom:${l.paddingBottom}px;--home-heading:${l.headingSize}px;--home-body:${l.bodySize}px;--home-image-ratio:${ratio};--home-image-max:${l.imageMaxHeight}px;--home-text-align:${alignment}`;
}

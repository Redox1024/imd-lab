// Pack content into the available panel; no wheel scrolling is required.
export function elementPages(container,onPage,initialPage=0){
 const items=Array.from(container.children),height=container.clientHeight;
 container.dataset.density=height<160?'brief':height<260?'compact':'normal';
 if(!items.length){onPage(0,0);return {show(){},page:0,count:0};}
 const groups=[];let group=[];
 items.forEach(item=>item.hidden=true);
 for(const item of items){
  item.hidden=false;
  if(height>0&&container.scrollHeight>height+1&&group.length){
   item.hidden=true;groups.push(group);group.forEach(node=>node.hidden=true);group=[];item.hidden=false;
  }
  if(height>0&&container.scrollHeight>height+1&&!group.length)container.dataset.density='brief';
  group.push(item);
 }
 if(group.length)groups.push(group);
 let current=0;
 const pager={show(page){current=Math.max(0,Math.min(groups.length-1,page));items.forEach(item=>item.hidden=true);groups[current].forEach(item=>item.hidden=false);onPage(current,groups.length);},get page(){return current;},get count(){return groups.length;}};
 pager.show(initialPage);return pager;
}
export function textPages(container,text,onPage,initialPage=0){
 const chars=Array.from(String(text||'')),height=container.clientHeight,pages=[];
 let start=0;
 if(!chars.length)pages.push('');
 while(start<chars.length){
  let low=1,high=chars.length-start,best=1;
  if(height<=0){pages.push(chars.slice(start).join(''));break;}
  while(low<=high){const mid=Math.floor((low+high)/2);container.textContent=chars.slice(start,start+mid).join('');if(container.scrollHeight<=height+1){best=mid;low=mid+1;}else high=mid-1;}
  if(start+best<chars.length){for(let i=best-1;i>best*.72;i--){if(/[\s.!?。]/u.test(chars[start+i])){best=i+1;break;}}}
  pages.push(chars.slice(start,start+best).join('').trim());start+=best;
 }
 let current=0;
 const pager={show(page){current=Math.max(0,Math.min(pages.length-1,page));container.textContent=pages[current];onPage(current,pages.length);},get page(){return current;},get count(){return pages.length;}};
 pager.show(initialPage);return pager;
}

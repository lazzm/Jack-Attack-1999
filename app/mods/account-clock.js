/* Release-calendar override only. Real earning days, caps, shared simulations
 * and lottery timers always continue to use their original clock. */
'use strict';
module.exports=(state,c,day)=>{
 const date=c?.ready&&c.member?.toLowerCase()==='jack'&&Object.hasOwn(state.members,'jack')?state.mods.owner?.clock?.date:null;
 const d=date||day;return +d.slice(5,7)*100 + +d.slice(8,10);
};

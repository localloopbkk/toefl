const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PlaybackCounter,addTime,dayKey,totals,readDays,PREFIX}=require('./listening.js');
function setup(){
 const audio={currentTime:0,playbackRate:1,seeking:false,muted:false,volume:1};let clock=0,sum=0;
 const c=new PlaybackCounter(audio,(_,s)=>sum+=s,()=>clock,()=>clock);
 return {audio,c,advance(wall,media){clock+=wall*1000;audio.currentTime+=media;c.sample();},sum:()=>sum};
}
test('counts playback and replay, excludes pause and buffering',()=>{const x=setup();x.c.start();x.advance(10,10);x.c.stop();x.advance(30,0);x.c.start();x.advance(10,0);x.advance(5,5);assert.equal(x.sum(),15);x.audio.currentTime=0;x.c.seek();x.advance(5,5);assert.equal(x.sum(),20);});
test('seeks forward and backward do not add skipped time',()=>{const x=setup();x.c.start();x.advance(1,1);x.audio.seeking=true;x.advance(1,60);x.audio.seeking=false;x.c.seek();x.advance(1,1);x.audio.seeking=true;x.advance(1,-40);x.audio.seeking=false;x.c.seek();x.advance(1,1);assert.equal(x.sum(),3);});
test('unannounced discontinuities earn no credit',()=>{const x=setup();x.c.start();x.advance(1,50);x.advance(1,-20);assert.equal(x.sum(),0);});
test('counts elapsed listening seconds at 0.75x and 2x',()=>{for(const rate of [.75,2]){const x=setup();x.audio.playbackRate=rate;x.c.start();x.advance(10,10*rate);assert.equal(x.sum(),10);}});
test('background gap with partial buffering counts only media advancement',()=>{const x=setup();x.c.start();x.advance(100,3);assert.equal(x.sum(),3);});
test('muted audio earns no time',()=>{const x=setup();x.c.start();x.audio.muted=true;x.advance(10,10);assert.equal(x.sum(),0);});
test('local midnight splits seconds and Monday begins week',()=>{const end=new Date(2026,10,9,0,0,5).getTime();const days={};addTime(days,end,10);assert.equal(days['2026-11-08'],5);assert.equal(days['2026-11-09'],5);assert.deepEqual(totals(days,new Date(end)),{today:5,week:5,total:10,percent:10/720000*100});});
test('goal caps progress but preserves lifetime hours',()=>{assert.equal(totals({'2026-11-09':900000}).percent,100);assert.equal(totals({'2026-11-09':900000}).total,900000);});
test('records survive reload; independent writers merge; malformed data ignored',()=>{const data=new Map([[PREFIX+'a',JSON.stringify({days:{'2026-11-09':10}})],[PREFIX+'b',JSON.stringify({days:{'2026-11-09':20,'2026-11-08':5}})],[PREFIX+'bad','invalid'],['toefl-favorites','[]']]);const storage={get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)};assert.deepEqual(readDays(storage),{'2026-11-09':30,'2026-11-08':5});assert.deepEqual(readDays(storage),readDays(storage));});

(() => {
  const {PREFIX,addTime,readDays,totals,PlaybackCounter,dayKey}=window.Listening;
  const audio=document.querySelector('#audio');
  const ownDays={};
  const key=PREFIX+crypto.randomUUID();
  const status=document.querySelector('#listeningStatus');
  let storage;
  try { storage=window.localStorage; } catch (_) {}
  let savedAt=0;
  function render() {
    let days={};
    try { if(storage) days=readDays(storage); } catch (_) {}
    // Own in-memory record is authoritative, including when storage is unavailable.
    try {
      const saved=storage && JSON.parse(storage.getItem(key)||'null');
      for(const [day,s] of Object.entries(saved?.days||{})) days[day]=(days[day]||0)-s;
    } catch (_) {}
    for(const [day,s] of Object.entries(ownDays)) days[day]=(days[day]||0)+s;
    const values=totals(days);
    const duration=s=>`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m ${Math.floor(s%60)}s`;
    document.querySelector('#listeningToday').textContent=duration(values.today);
    document.querySelector('#listeningWeek').textContent=duration(values.week);
    document.querySelector('#listeningTotal').textContent=`${(values.total/3600).toFixed(2)} h`;
    document.querySelector('#listeningGoal').value=values.percent;
    document.querySelector('#listeningPercent').textContent=`${values.percent.toFixed(2)}% of 200 hours`;
    return days;
  }
  function save() {
    try {
      if(!storage) throw new Error('Storage unavailable');
      if(Object.keys(ownDays).length) storage.setItem(key,JSON.stringify({version:1,days:ownDays}));
      status.textContent='Saved in this browser · Week starts Monday';
    } catch (_) { status.textContent='Browser storage unavailable — export before leaving to keep your records.'; }
    savedAt=performance.now(); render();
  }
  const counter=new PlaybackCounter(audio,(end,seconds)=>{
    addTime(ownDays,end,seconds);
    if(performance.now()-savedAt>=1000) save();
  });
  audio.addEventListener('playing',()=>counter.start());
  for(const event of ['pause','waiting','ended','emptied','error']) audio.addEventListener(event,()=>{counter.stop();save();});
  audio.addEventListener('seeking',()=>counter.seek());
  audio.addEventListener('seeked',()=>counter.seek());
  audio.addEventListener('ratechange',()=>counter.seek());
  audio.addEventListener('timeupdate',()=>counter.sample());
  setInterval(()=>{counter.sample(); render();},1000);
  window.addEventListener('pagehide',()=>{counter.sample();save();});
  document.addEventListener('visibilitychange',()=>{counter.sample();save();});
  window.addEventListener('storage',render);
  // Flush before app-controlled seeks, rate changes, and source changes.
  window.flushListening=()=>{counter.sample();save();};
  document.querySelector('#exportListening').addEventListener('click',()=>{
    counter.sample();save();
    const days=render();
    const csv='date,listening_seconds,listening_hours\r\n'+Object.entries(days).sort(([a],[b])=>a.localeCompare(b)).map(([d,s])=>`${d},${s.toFixed(3)},${(s/3600).toFixed(6)}`).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`toefl-listening-${dayKey(new Date())}.csv`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  save();
})();

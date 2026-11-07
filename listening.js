(function (root) {
  'use strict';
  const PREFIX = 'toefl-listening-v1:';
  const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function addTime(days, end, seconds) {
    let start = end - seconds * 1000;
    while (start < end) {
      const date = new Date(start);
      const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1).getTime();
      const next = Math.min(end, midnight);
      const key = dayKey(date);
      days[key] = (days[key] || 0) + (next-start)/1000;
      start = next;
    }
  }
  function readDays(storage) {
    const days = {};
    for (let i=0; i<storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const record = JSON.parse(storage.getItem(key));
        for (const [day, seconds] of Object.entries(record.days || {})) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(seconds) && seconds >= 0)
            days[day] = (days[day] || 0) + seconds;
        }
      } catch (_) { /* A damaged record does not hide other records. */ }
    }
    return days;
  }
  function totals(days, now = new Date()) {
    const today = dayKey(now);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - (monday.getDay()+6)%7);
    const first = dayKey(monday);
    const total = Object.values(days).reduce((a,b)=>a+b,0);
    return {today: days[today] || 0, week: Object.entries(days).reduce((a,[day,s])=> a+(day>=first && day<=today?s:0),0), total, percent: Math.min(100,total/720000*100)};
  }
  class PlaybackCounter {
    constructor(audio, credit, clock = () => performance.now(), date = () => Date.now()) {
      this.audio=audio; this.credit=credit; this.clock=clock; this.date=date; this.active=false;
      this.reset();
    }
    reset() { this.media=this.audio.currentTime; this.wall=this.clock(); this.rate=this.audio.playbackRate; }
    sample() {
      const now=this.clock(), media=this.audio.currentTime;
      const delta=media-this.media, wall=(now-this.wall)/1000;
      // Discontinuities cannot earn time. The media delta also excludes stalled playback.
      if (this.active && !this.audio.seeking && !this.audio.muted && this.audio.volume>0 && delta>0 && wall>0 && delta<=wall*this.rate+0.15)
        this.credit(this.date(),Math.min(wall,delta/this.rate));
      this.media=media; this.wall=now; this.rate=this.audio.playbackRate;
    }
    start() { this.active=true; this.reset(); }
    stop() { this.sample(); this.active=false; }
    seek() { this.reset(); }
  }
  const api={PREFIX,dayKey,addTime,readDays,totals,PlaybackCounter};
  if (typeof module !== 'undefined') module.exports=api;
  else root.Listening=api;
})(typeof window !== 'undefined' ? window : globalThis);

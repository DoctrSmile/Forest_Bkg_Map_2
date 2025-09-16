(function(){
  try {
    function getMap(){
      const k = Object.keys(window).find(k => /^map_/.test(k));
      return window[k];
    }
    const MAP = getMap();
    if (!MAP) throw new Error("Map instance not found");

    function dateToYMDLocal(d){
      const y=d.getFullYear(), m=(d.getMonth()+1).toString().padStart(2,'0'), da=d.getDate().toString().padStart(2,'0');
      return y+"-"+m+"-"+da;
    }
    function todayKSTDate(){
      const now = new Date();
      const s = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
      const k = new Date(s);
      return new Date(k.getFullYear(), k.getMonth(), k.getDate());
    }
    function parseISODateOnly(iso){
      const d = new Date(iso); if (isNaN(d)) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    function statusFor(opens, refDate){
      if (!opens || !opens.length) return 'unknown';
      const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
      let hasToday=false, hasFuture=false;
      for (const iso of opens){
        const d = parseISODateOnly(iso);
        if (!d) continue;
        const t = d.getTime();
        if (t === ref) hasToday = true;
        else if (t > ref) hasFuture = true;
      }
      if (hasToday) return 'today';
      if (hasFuture) return 'future';
      return 'past';
    }
    function iconByStatus(st){
      const color = st === 'today' ? 'blue' : (st === 'future' ? 'green' : 'gray');
      return L.AwesomeMarkers.icon({ icon:'info-sign', markerColor: color, prefix:'glyphicon' });
    }

    // 모든 마커 수집
    const MARKERS = [];
    MAP.eachLayer(function(layer){
      if (layer && layer.getPopup && layer.getLatLng){
        const popup = layer.getPopup && layer.getPopup();
        if (!popup) return;
        const div = document.createElement('div');
        div.innerHTML = popup.getContent();
        const data = div.querySelector('.open-data');
        let opens = [];
        if (data){
          try { opens = JSON.parse((data.getAttribute('data-opens')||'[]').replace(/'/g, '"')); } catch(e){ opens = []; }
        }
        MARKERS.push({ marker: layer, opens });
      }
    });

    const refDateInput = document.getElementById('refDate');
    const onlyTodayChk = document.getElementById('onlyToday');
    const resetBtn = document.getElementById('resetBtn');

    function ensureRefDate(){
      if (!refDateInput) return;
      if (!refDateInput.value){
        const t = todayKSTDate();
        refDateInput.value = dateToYMDLocal(t);
      }
    }
    ensureRefDate();

    function currentRefDate(){
      if (!refDateInput || !refDateInput.value) return todayKSTDate();
      const parts = (refDateInput.value || '').split('-').map(x=>parseInt(x,10));
      if (parts.length < 3 || parts.some(isNaN)) return todayKSTDate();
      return new Date(parts[0], parts[1]-1, parts[2]);
    }

    function showMarker(m){ if (!MAP.hasLayer(m)) m.addTo(MAP); }
    function hideMarker(m){ if (MAP.hasLayer(m)) MAP.removeLayer(m); }

    function update(){
      const ref = currentRefDate();
      const onlyToday = !!(onlyTodayChk && onlyTodayChk.checked);
      for (const it of MARKERS){
        const st = statusFor(it.opens, ref);
        it.marker.setIcon(iconByStatus(st));
        if (onlyToday){
          if (st === 'today') showMarker(it.marker); else hideMarker(it.marker);
        } else {
          showMarker(it.marker);
        }
      }
    }

    refDateInput && refDateInput.addEventListener('change', update);
    onlyTodayChk && onlyTodayChk.addEventListener('change', update);
    resetBtn && resetBtn.addEventListener('click', function(){
      const t = todayKSTDate();
      refDateInput.value = dateToYMDLocal(t);
      update();
    });

    update();
  } catch(e){
    var box = document.getElementById('errorBox');
    if (box){ box.style.display = 'block'; box.textContent += "\n(" + (e && e.message ? e.message : e) + ")"; }
    console.error(e);
  }
})();

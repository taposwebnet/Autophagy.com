/* ═══════════════════════════════════════════════════════════
   ap-live.js — Autophagy লাইভ-মিডিয়া মডিউল (চূড়ান্ত v1.0)
   Firebase-সিগন্যালিং · মাল্টি-দর্শক · প্রতি-লাইভ-চ্যাট
   নির্ভরতা: test.js (S, me, toast, ic, esc, fmt, FBDB...)
   ═══════════════════════════════════════════════════════════ */
'use strict';
window.APLIVE={ver:'1.0',pcs:[],unsubs:[]};

/* ── সিগন্যাল-হেল্পার ── */
function aplSigWrite(id,obj){
  return new Promise(function(res){
    try{
      if(!apFBReady||typeof firebase==='undefined') return res(false);
      FBDB.collection('aliveSignals').doc(id).set(obj,{merge:true})
        .then(function(){res(true);})
        .catch(function(e){ console.warn('APLIVE write:',e.code||e); res(false); });
    }catch(e){ res(false); }
  });
}
function aplSigRead(id){
  return new Promise(function(res){
    try{
      if(!apFBReady||typeof firebase==='undefined') return res(null);
      FBDB.collection('aliveSignals').doc(id).get()
        .then(function(d){ res(d.exists?d.data():null); })
        .catch(function(e){ console.warn('APLIVE read:',e.code||e); res(null); });
    }catch(e){ res(null); }
  });
}
function aplSigClean(id){
  try{
    if(apFBReady&&typeof firebase!=='undefined'){
      FBDB.collection('aliveSignals').doc(id).delete().catch(function(){});
    }
  }catch(e){}
}

/* ── হোস্ট: মাল্টি-দর্শক সম্প্রচার ── */
function aplBroadStart(live,stream){
  try{
    aplClosePcs();
    var pc=new RTCPeerConnection({iceServers:window.AP_ICE});
    APLIVE.pcs.push(pc);
    stream.getTracks().forEach(function(t){ try{ pc.addTrack(t,stream); }catch(e){} });
    var hc=[];
    pc.onicecandidate=function(e){
      if(e.candidate){ hc.push(e.candidate.toJSON());
        aplSigWrite(live.id,{hCands:hc.slice()}); }
    };
    aplSigWrite(live.id,{hostOn:true,ts:Date.now(),host:live.host,title:live.title});
    pc.createOffer().then(function(o){ return pc.setLocalDescription(o); })
      .then(function(){ return aplSigWrite(live.id,{offer:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}); })
      .then(function(ok){
        try{
          var w=document.querySelector('.live-hero');
          if(w){
            if(document.getElementById('apOfferOk')) document.getElementById('apOfferOk').remove();
            if(ok){ w.insertAdjacentHTML('afterbegin','<div id="apOfferOk" style="background:#0B6E4F;color:#fff;padding:9px 12px;border-radius:8px;font-size:12.5px;font-weight:600;margin-bottom:10px">✅ সিগন্যাল প্রকাশিত — দর্শক সংযোগের অপেক্ষায়…</div>'); }
            else{ w.insertAdjacentHTML('afterbegin','<div id="apOfferOk" style="background:#C0195B;color:#fff;padding:9px 12px;border-radius:8px;font-size:12.5px;font-weight:600;margin-bottom:10px">🚨 সিগন্যাল প্রকাশ ব্যর্থ (Rules দেখো)</div>'); }
          }
        }catch(e){}
      })
      .catch(function(e){ console.warn('APLIVE offer:',e); });
    aplSigListen(live.id,function(d){
      try{
        if(d.answer&&!pc.remoteDescription){
          pc.setRemoteDescription(new RTCSessionDescription(d.answer));
        }
        if(d.vCands&&d.vCands.length){
          d.vCands.forEach(function(c){ try{ pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} });
        }
      }catch(e){}
    });
    pc.onconnectionstatechange=function(){
      try{
        if(pc.connectionState==='connected'){
          live.viewers=(live.viewers||0)+1;
          var v=document.getElementById('lvViews');
          if(v) v.textContent='👁 '+fmt(live.viewers);
          toast('📺 একজন দর্শক সংযুক্ত!','users');
        }
      }catch(e){}
    };
    toast('📡 সম্প্রচার-পথ খোলা — দর্শক এসো!','globe');
  }catch(e){ console.warn('APLIVE broad:',e); }
}
function aplSigListen(id,cb){
  try{
    if(!apFBReady||typeof firebase==='undefined') return;
    var u=FBDB.collection('aliveSignals').doc(id).onSnapshot(function(s){
      if(s.exists) cb(s.data());
    },function(){});
    APLIVE.unsubs.push(u);
  }catch(e){}
}
function aplClosePcs(){
  try{
    APLIVE.pcs.forEach(function(c){ try{c.close();}catch(e){} });
    APLIVE.pcs=[];
    APLIVE.unsubs.forEach(function(u){ try{u();}catch(e){} });
    APLIVE.unsubs=[];
  }catch(e){}
}

/* ── দর্শক: স্ট্রিম-গ্রহণ ── */
function aplWatch(liveId){
  try{
    aplClosePcs();
    var attempts=0;
    var pc=null;
    var connect=function(){
      try{
        if(!apLive||apLive.by!=='viewer') return;
        if(!apFBReady||typeof firebase==='undefined'){ return; }
        aplSigRead(liveId).then(function(sig){
          try{
            if(!apLive||apLive.by!=='viewer') return;
            if(!sig||!sig.offer||!sig.hostOn){
              attempts++;
              var st=document.getElementById('apVSt');
              if(st&&attempts<15){ st.textContent='📡 হোস্টের পথ খুলছে… ('+attempts+'/১৫)'; }
              if(attempts<15){ setTimeout(connect,2500); }
              else{ toast('📵 হোস্টের offer পাওয়া যায়নি','alert'); }
              return;
            }
            if(pc){ try{pc.close();}catch(e){} }
            pc=new RTCPeerConnection({iceServers:window.AP_ICE});
            APLIVE.pcs.push(pc);
            try{
              pc.addTransceiver('video',{direction:'recvonly'});
              pc.addTransceiver('audio',{direction:'recvonly'});
            }catch(e){}
            var vc=[];
            pc.onicecandidate=function(e){
              if(e.candidate){ vc.push(e.candidate.toJSON());
                aplSigWrite(liveId,{vCands:vc.slice()}); }
            };
            pc.ontrack=function(e){
              try{
                var remote=e.streams&&e.streams[0];
                var v=document.getElementById('lvVid');
                if(v&&remote){
                  v.srcObject=remote;
                  v.muted=false; v.volume=1;
                  v.play().then(function(){
                    toast('🔴 সংযুক্ত! দেখছো ও শুনছো 🎧','globe');
                    var st=document.getElementById('apVSt');
                    if(st) st.style.display='none';
                  }).catch(function(){
                    toast('🔊 শব্দ-চালু করতে ভিডিওতে চাপ দাও','vid');
                  });
                  v.onclick=function(){ try{ v.muted=false; v.play(); }catch(e){} };
                }
              }catch(e){}
            };
            pc.onconnectionstatechange=function(){
              try{
                if(pc.connectionState==='connected'){
                  toast('🔴 সরাসরি সংযুক্ত! 🎧','globe');
                  var st2=document.getElementById('apVSt');
                  if(st2) st2.style.display='none';
                }
              }catch(e){}
            };
            pc.setRemoteDescription(new RTCSessionDescription(sig.offer))
              .then(function(){
                (sig.hCands||[]).forEach(function(c){ try{ pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} });
                try{
                  var u2=FBDB.collection('aliveSignals').doc(liveId).onSnapshot(function(s){
                    try{ var d2=s.data(); if(!d2) return;
                      (d2.hCands||[]).forEach(function(c){ try{ pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} });
                    }catch(e){}
                  });
                  APLIVE.unsubs.push(u2);
                }catch(e){}
                return pc.createAnswer();
              })
              .then(function(a){ return pc.setLocalDescription(a); })
              .then(function(){
                return aplSigWrite(liveId,{answer:{type:pc.localDescription.type,sdp:pc.localDescription.sdp},vCands:vc.slice()});
              })
              .catch(function(e){ console.warn('APLIVE answer:',e); });
          }catch(e){ console.warn('APLIVE watch:',e); }
        });
      }catch(e){ console.warn('APLIVE connect:',e); }
    };
    connect();
  }catch(e){ console.warn('APLIVE watch-outer:',e); }
}

/* ── পরিষ্কার ── */
function aplCleanup(){
  try{
    aplClosePcs();
    if(window.apLiveChatUnsub){ window.apLiveChatUnsub(); window.apLiveChatUnsub=null; }
  }catch(e){}
}

/* ── হোস্ট-হুক: লাইভ-রুম খুললেই সম্প্রচার (চেইন-মুক্ত!) ── */
try{
  var _oR=renderLiveRoom;
  renderLiveRoom=function(){
    _oR();
    try{
      if(apLive&&apLive.by==='me'&&apLive.stream){
        if(window.apBroadFired!==apLive.id){
          window.apBroadFired=apLive.id;
          setTimeout(function(){ try{ aplBroadStart(apLive,apLive.stream); }catch(e){} },800);
        }
      }
      if(apLive&&apLive.by==='viewer'){ setTimeout(function(){ try{ aplWatch(apLive.id); }catch(e){} },600); }
      try{ aplChatStart(); }catch(e){}
    }catch(e){}
  };
}catch(e){}

/* ── লাইভ-শেষে পরিষ্কার ── */
try{
  var _oE=endLive;
  endLive=function(){
    try{
      if(apLive&&apLive.by==='me'){ aplSigClean(apLive.id); }
      aplCleanup(); window.apBroadFired=null;
    }catch(e){}
    return _oE.apply(this,arguments);
  };
}catch(e){}
try{
  var _oT=liveTerminate;
  liveTerminate=function(){
    try{
      if(apLive&&apLive.by==='me'){ aplSigClean(apLive.id); }
      aplCleanup(); window.apBroadFired=null;
    }catch(e){}
    return _oT.apply(this,arguments);
  };
}catch(e){}

/* ── লাইভ-চ্যাট (প্রতি-লাইভ আলাদা!) ── */
try{
  liveChatSend=function(){
    try{
      var inp=document.getElementById('lvChatIn'); if(!inp) return;
      var v=(inp.value||'').trim(); if(!v) return; inp.value='';
      if(!me()) return openAuth('login');
      if((typeof BAD_RE!=='undefined'&&BAD_RE.test(v))||(typeof linkBad==='function'&&linkBad(v))){ toast('⛔ নিষিদ্ধ বক্তব্য','alert'); return; }
      var u=me();
      if(apFBReady&&typeof firebase!=='undefined'){
        FBDB.collection('achat').add({
          n:u.defAnon?'Anonymous':u.name,ct:u.ct||'',a:!!u.defAnon,
          t:v,ts:Date.now(),live:(apLive&&apLive.id)||''
        }).catch(function(){});
      }else{
        var log=document.getElementById('lvChatLog');
        if(log){ log.insertAdjacentHTML('beforeend','<div class="bub me"><b>'+esc(u.name)+'</b><span>'+esc(v)+'</span></div>'); log.scrollTop=1e6; }
      }
    }catch(e){}
  };
}catch(e){}

/* ── চ্যাট-সিঙ্ক ── */
function aplChatStart(){
  try{
    aplChatStop();
    if(!apFBReady||typeof firebase==='undefined'||!apLive) return;
    var my=apLive.id;
    window.apLiveChatUnsub=FBDB.collection('achat').orderBy('ts','desc').limit(60).onSnapshot(function(s){
      try{
        var log=document.getElementById('lvChatLog'); if(!log) return;
        var u=me();
        var msgs=s.docs.map(function(d){ var x=d.data(); x._id=d.id; return x; })
          .filter(function(m){ return (m.live||'')===my; })
          .reverse();
        log.innerHTML='';
        msgs.forEach(function(m){
          var mine=u&&!m.a&&m.n===u.name;
          log.insertAdjacentHTML('beforeend','<div class="bub '+(mine?'me':'you')+'"><b>'+esc(m.n||'?')+'</b><span>'+esc(m.t||'')+'</span></div>');
        });
        log.scrollTop=1e6;
      }catch(e){}
    },function(){});
  }catch(e){}
}
function aplChatStop(){
  try{ if(window.apLiveChatUnsub){ window.apLiveChatUnsub(); window.apLiveChatUnsub=null; } }catch(e){}
}

/* ── পুরনো PeerJS-সিগন্যালিং বহিষ্কার (বাইপাস!) ── */
try{ apBroadStart=aplBroadStart; }catch(e){}
try{ apWatchReal=aplWatch; }catch(e){}
try{ apWatchRealFb=aplWatch; }catch(e){}

console.log('🎬 ap-live.js v1.0 — লাইভ-মডিউল সক্রিয় (সম্পূর্ণ-স্বয়ংসম্পূর্ণ!)');
/* ═══════════ END ap-live.js ═══════════ */


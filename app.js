(() => {
  'use strict';
  const files = window.ARCHIVE || [];
  const $ = (selector) => document.querySelector(selector);
  const fa = (n) => Number(n).toLocaleString('fa-IR');
  const categories = {edits:'فتوشاپ',wallpapers:'والپیپر'};
  const bookmarkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = (text) => text.toLowerCase().replace(/#/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[\s‌ـ–—-]+/g,' ').trim();
  let saved = new Set();
  try { const value = JSON.parse(localStorage.getItem('sg-saved') || '[]'); if (Array.isArray(value)) saved = new Set(value.filter(id=>files.some(f=>f.id===id))); } catch {}
  let filter = 'edits', query = '', sort = 'archive', current = null, visible = [], viewerList = [], opener = null;
  const photoTags = (file) => Array.isArray(file.tags) ? file.tags : [];
  const renderTags = (file) => photoTags(file).map(tag=>`<button class="photo-tag" data-tag="${escape(tag)}" data-category="${file.category}" aria-label="جست‌وجوی تگ ${escape(tag)}">#${escape(tag)}</button>`).join('');
  let toastTimer;
  const viewerImage = $('#viewer-image');
  const viewerStage = $('#viewer-stage');
  function fitImage() {
    if (!current || !$('#viewer').open || !viewerImage.complete || !viewerImage.naturalWidth) return;
    const paddingX = viewerStage.clientWidth < 600 ? 86 : 128;
    const availableWidth = Math.max(1, viewerStage.clientWidth - paddingX);
    const availableHeight = Math.max(1, viewerStage.clientHeight - 32);
    const scale = Math.min(1, availableWidth / viewerImage.naturalWidth, availableHeight / viewerImage.naturalHeight);
    viewerImage.style.width = `${Math.floor(viewerImage.naturalWidth * scale)}px`;
    viewerImage.style.height = `${Math.floor(viewerImage.naturalHeight * scale)}px`;
    viewerImage.hidden = false;
    $('#image-loading').hidden = true;
    $('#viewer-dimensions').textContent = `${viewerImage.naturalWidth} × ${viewerImage.naturalHeight} px`;
  }
  viewerImage.addEventListener('load', fitImage);
  viewerImage.addEventListener('error', () => {
    if (!current) return;
    viewerImage.hidden = true;
    $('#image-loading').hidden = false;
    $('#image-loading').textContent = 'عکس باز نشد. فایل بعدی را امتحان کن.';
  });
  new ResizeObserver(fitImage).observe(viewerStage);
  window.addEventListener('resize', fitImage);
  window.visualViewport?.addEventListener('resize', fitImage);
  function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000); }
  function updateCounts() {
    $('#total-count').textContent=fa(files.length); $('#heading-count').textContent=fa(visible.length); $('#saved-count').textContent=fa(saved.size);
    $('#archive-title').textContent=({edits:'فتوشاپ',wallpapers:'والپیپر',saved:'نشان‌شده‌ها'})[filter];
    document.querySelectorAll('[data-filter]:not([data-filter="saved"])').forEach(button=>{const key=button.dataset.filter;button.querySelector('span').textContent=fa(key==='all'?files.length:files.filter(f=>f.category===key).length);});
    document.querySelectorAll('.cover-evidence [data-open]').forEach(button=>{const file=files.find(file=>file.id===button.dataset.open);if(file){button.setAttribute('aria-label',`باز کردن ${file.title}`);button.querySelector('img').alt=file.title;}});
  }
  function render() {
    visible=files.filter(file=>(filter==='saved'?saved.has(file.id):file.category===filter)&&normalize(`${file.title} ${file.description} ${file.id} ${categories[file.category]} ${photoTags(file).join(' ')}`).includes(normalize(query)));
    if(sort==='reverse')visible.reverse(); if(sort==='title')visible.sort((a,b)=>a.title.localeCompare(b.title,'fa'));
    $('#gallery').innerHTML=visible.map((file,i)=>`
      <article class="file-card">
        <div class="folder-tab"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 13 5-5a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l8-8a2 2 0 0 1 3 3l-7 7"/></svg><span class="card-code" dir="ltr">${file.id}</span></div>
        <div class="folder-body">
          <div class="folder-meta"><span class="classification">${file.featured?'پروندهٔ ویژه':'محرمانه'}</span><span dir="ltr">DOCUMENT / ${file.id.slice(3)}</span></div>
          <button class="card-image" data-open="${file.id}" aria-label="باز کردن پروندهٔ ${escape(file.title)}"><img src="${file.thumb}" alt="${escape(file.title)}؛ ${escape(categories[file.category])}" width="${file.width}" height="${file.height}" loading="${i<6?'eager':'lazy'}" decoding="async"><span class="card-open" aria-hidden="true">↗</span></button>
          <div class="card-info"><div><h3 class="card-title"><a href="#file=${file.id}" data-open="${file.id}">${escape(file.title)}</a></h3><span class="card-category">${categories[file.category]}</span></div><button class="bookmark" data-save="${file.id}" aria-pressed="${saved.has(file.id)}" aria-label="${saved.has(file.id)?'حذف نشان':'نشان کردن'} ${escape(file.title)}">${bookmarkIcon}</button></div>
          <div class="card-tags" aria-label="تگ‌های عکس">${renderTags(file)}</div>
        </div>
      </article>`).join('');
    $('#empty').hidden=visible.length>0;
    $('#empty-description').textContent=filter==='saved'&&!query?'روی نشان کنار هر عکس بزن تا اینجا پیدایش کنی.':'یک عبارت دیگر را امتحان کن یا دسته‌بندی را تغییر بده.';
    $('#results-count').textContent=`نمایش ${fa(visible.length)} پرونده از ${fa(files.length)}`;
    document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    updateCounts();
  }
  function toggleSave(id) {
    const removing=saved.has(id); removing?saved.delete(id):saved.add(id);
    try { localStorage.setItem('sg-saved',JSON.stringify([...saved])); } catch { toast('مرورگر ذخیره‌سازی را بسته؛ نشان‌ها فقط تا بستن صفحه می‌مانند.'); }
    const focusedSave=document.activeElement?.dataset.save;
    render();
    if(focusedSave) document.querySelector(`[data-save="${focusedSave}"]`)?.focus({preventScroll:true});
    updateSave();
  }
  function updateSave(){if(!current)return;const marked=saved.has(current.id);$('#save-viewer').textContent=marked?'نشان‌شده ✓':'نشان کردن';$('#save-viewer').setAttribute('aria-pressed',String(marked));}
  function openFile(id,fromHash=false) {
    const file=files.find(f=>f.id===id);if(!file)return;
    if(!$('#viewer').open) {opener=document.activeElement; viewerList=visible.some(f=>f.id===id)?[...visible]:[...files];}
    current=file;
    $('#viewer-id').textContent=file.id;$('#viewer-title').textContent=file.title;$('#viewer-description').textContent=file.description;$('#viewer-category').textContent=categories[file.category];
    $('#viewer-tags').innerHTML=renderTags(file);
    viewerImage.hidden=true;
    $('#image-loading').hidden=false;$('#image-loading').textContent='در حال باز کردن فایل…';
    viewerImage.src=file.image;viewerImage.alt=`${file.title}؛ ${file.description}`;
    $('#download').href=file.image;$('#download').download=`${file.id}.webp`;
    $('#viewer-position').textContent=`${fa(viewerList.findIndex(f=>f.id===id)+1)} از ${fa(viewerList.length)}`;
    $('#prev').hidden=viewerList.length<2;$('#next').hidden=viewerList.length<2;
    updateSave();if(!$('#viewer').open)$('#viewer').showModal();
    requestAnimationFrame(fitImage);
    if(!fromHash)history.replaceState(null,'',`#file=${file.id}`);
    const next=viewerList[(viewerList.findIndex(f=>f.id===id)+1)%viewerList.length];if(next){const image=new Image();image.src=next.image;}
  }
  function move(step){if(!current)return;const index=viewerList.findIndex(f=>f.id===current.id);openFile(viewerList[(index+step+viewerList.length)%viewerList.length].id);}
  function closeViewer(){if($('#viewer').open)$('#viewer').close();}
  $('#viewer').addEventListener('close',()=>{current=null;if(location.hash.startsWith('#file='))history.replaceState(null,'',location.pathname+location.search+'#archive');if(opener?.isConnected)opener.focus({preventScroll:true});});
  document.addEventListener('click',event=>{
    const tag=event.target.closest('[data-tag]');if(tag){const value=tag.dataset.tag,category=tag.dataset.category;closeViewer();filter=category;query=value;$('#search').value=value;render();$('#archive').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    const open=event.target.closest('[data-open]');if(open){event.preventDefault();openFile(open.dataset.open);return;}
    const save=event.target.closest('[data-save]');if(save){toggleSave(save.dataset.save);return;}
    const category=event.target.closest('[data-filter]');if(category){filter=category.dataset.filter;render();if($('.collection').getBoundingClientRect().top < -140)$('.collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    if(event.target.closest('[data-about]'))$('#about').showModal();
  });
  $('#search').addEventListener('input',event=>{query=event.target.value;render();});
  $('#sort').addEventListener('change',event=>{sort=event.target.value;render();});
  $('#reset').addEventListener('click',()=>{filter='edits';query='';$('#search').value='';render();});
  $('#random-file').addEventListener('click',()=>{if(files.length)openFile(files[Math.floor(Math.random()*files.length)].id);});
  $('#close-viewer').addEventListener('click',closeViewer);$('#prev').addEventListener('click',()=>move(-1));$('#next').addEventListener('click',()=>move(1));
  $('#save-viewer').addEventListener('click',()=>{if(current)toggleSave(current.id);});
  $('#share').addEventListener('click',async()=>{if(!current)return;try{await navigator.clipboard.writeText(location.href);toast('لینک پرونده کپی شد. بفرست برای بچه‌ها!');}catch{window.prompt('این لینک را کپی کن:',location.href);}});
  $('#close-about').addEventListener('click',()=>$('#about').close());$('#about-back').addEventListener('click',()=>{$('#about').close();$('#archive').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,select')||event.ctrlKey||event.metaKey||event.altKey)return;
    if($('#viewer').open){if(event.key==='ArrowLeft'){event.preventDefault();move(1);}if(event.key==='ArrowRight'){event.preventDefault();move(-1);}}
    else if(event.key==='/'&&!$('#about').open){event.preventDefault();$('#search').focus();}
  });
  let touchStart=null;
  $('#viewer-stage').addEventListener('touchstart',event=>{if(event.touches.length===1)touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};else touchStart=null;},{passive:true});
  $('#viewer-stage').addEventListener('touchend',event=>{if(!touchStart)return;const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx>0?1:-1);touchStart=null;},{passive:true});
  $('#viewer-stage').addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
  function readHash(){const match=location.hash.match(/^#file=(SG-\d{3})$/);if(match)openFile(match[1],true);else if($('#viewer').open)closeViewer();}
  window.addEventListener('hashchange',readHash);
  render();readHash();
})();

const fs = require('fs');
const dir = 'public';
const files = ['index.html','plaza.html','theme-plaza.html','messages.html','profile.html','settings.html','note.html','gallery.html'];
const GALLERY = '<a href="/gallery" data-i18n="navGallery" class="nav-gallery">图床</a>';
for (const f of files) {
  const p = dir + '/' + f;
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('/gallery')) { console.log('skip (already has gallery): ' + f); continue; }
  // 在 私信 链接之后插入图床按钮（各种写法）
  let changed = false;
  const patterns = [
    /(<a href="\/messages"[^>]*>[^<]*<\/a>)(<a href="#" id="navFeedback")/,
  ];
  for (const re of patterns) {
    if (re.test(s)) { s = s.replace(re, '$1' + GALLERY + '$2'); changed = true; break; }
  }
  if (changed) { fs.writeFileSync(p, s); console.log('updated: ' + f); }
  else console.log('NO MATCH: ' + f);
}

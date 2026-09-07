// لاگ زنده‌ی بازدیدکننده‌ها → ntfy.sh
// هر بازدید یک پیام با جزئیات دستگاه می‌فرستد؛ یک‌بار در هر session.
// خاموش/روشن کردن برای خودت: آدرس سایت را با #nolog باز کن.
;(function () {
  'use strict'

  var TOPIC = 'mani-yas-visits-7q2xf9k4'
  var ENDPOINT = 'https://ntfy.sh/' + TOPIC

  // --- کلید خاموش/روشن برای خودِ صاحب سایت ---
  try {
    if (location.hash === '#nolog') {
      var off = localStorage.getItem('nolog') === '1'
      localStorage.setItem('nolog', off ? '0' : '1')
      alert('لاگ بازدید در این مرورگر ' + (off ? 'روشن' : 'خاموش') + ' شد.')
      return
    }
    if (localStorage.getItem('nolog') === '1') return
  } catch (e) {}

  // --- فیلترها ---
  if (/localhost$|^127\.|^192\.168\.|^0\.0\.0\.0$/.test(location.hostname)) return
  if (location.protocol === 'file:') return
  if (navigator.webdriver) return
  try { if (sessionStorage.getItem('vlogged') === '1') return } catch (e) {}

  var ua = navigator.userAgent

  function pick(pairs, fallback) {
    for (var i = 0; i < pairs.length; i++) if (pairs[i][0].test(ua)) return pairs[i][1]
    return fallback
  }

  var browser = pick([
    [/Edg\//, 'Edge'], [/OPR\/|Opera/, 'Opera'], [/SamsungBrowser/, 'Samsung Internet'],
    [/Firefox\//, 'Firefox'], [/CriOS/, 'Chrome iOS'],
    [/Chrome\//, 'Chrome'], [/Safari\//, 'Safari']
  ], 'Unknown')

  var os = pick([
    [/iPhone/, 'iPhone'], [/iPad/, 'iPad'], [/Android/, 'Android'],
    [/Windows NT/, 'Windows'], [/Mac OS X/, 'macOS'], [/Linux/, 'Linux']
  ], 'Unknown')

  var device = /iPhone|iPad|Android|Mobile/.test(ua)
    ? (/iPad|Tablet/.test(ua) ? 'Tablet' : 'Mobile')
    : 'Desktop'

  var deviceFa = { Mobile: 'موبایل', Tablet: 'تبلت', Desktop: 'دسکتاپ' }[device]

  var vm = ua.match(/(?:Edg|OPR|SamsungBrowser|Firefox|CriOS|Chrome|Version)\/([\d.]+)/)
  if (vm) browser += ' ' + vm[1].split('.')[0]

  function tehranTime() {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Tehran'
      }).format(new Date()) + ' (تهران)'
    } catch (e) { return new Date().toISOString() }
  }

  var refText = document.referrer || 'مستقیم (لینک یا بوکمارک)'

  var visits = 1
  try {
    visits = (parseInt(localStorage.getItem('nvisits') || '0', 10) || 0) + 1
    localStorage.setItem('nvisits', String(visits))
  } catch (e) {}

  // عنوان نوتیفیکیشن باید ASCII باشد (محدودیت هدر HTTP در ntfy)
  function ascii(s) { return String(s).replace(/[^\x20-\x7E]/g, '').trim() || '?' }

  function send(geo) {
    var L = []
    L.push('🕒 ' + tehranTime())
    L.push('📄 صفحه: ' + location.pathname + (location.search || ''))
    L.push('📱 دستگاه: ' + deviceFa + ' — ' + os)
    L.push('🌐 مرورگر: ' + browser)
    L.push('🖥 نمایشگر: ' + screen.width + '×' + screen.height +
           '  |  پنجره: ' + window.innerWidth + '×' + window.innerHeight)
    L.push('🗣 زبان: ' + (navigator.language || '?'))
    try { L.push('⏰ منطقه‌ی زمانی: ' + Intl.DateTimeFormat().resolvedOptions().timeZone) } catch (e) {}
    if (geo) {
      L.push('📍 مکان: ' + [geo.city, geo.region, geo.country_name].filter(Boolean).join('، '))
      L.push('🔌 اینترنت: ' + (geo.org || '?'))
      L.push('🆔 IP: ' + (geo.ip || '?'))
    } else {
      L.push('📍 مکان: نامشخص (سرویس موقعیت در دسترس نبود)')
    }
    L.push('🔁 بازدید شماره‌ی ' + visits + ' از این مرورگر')
    L.push('↩️ از: ' + refText)
    if (navigator.hardwareConcurrency) L.push('⚙️ هسته‌های CPU: ' + navigator.hardwareConcurrency)
    if (navigator.deviceMemory) L.push('🧠 RAM: ~' + navigator.deviceMemory + 'GB')

    var title = (visits > 1 ? 'Repeat visit' : 'New visit') + ' - ' + device + ' / ' + os
    if (geo && geo.city) title += ' / ' + ascii(geo.city)

    try { sessionStorage.setItem('vlogged', '1') } catch (e) {}

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Title': ascii(title),
        'Tags': visits > 1 ? 'repeat' : 'eyes'
      },
      body: L.join('\n'),
      keepalive: true
    }).catch(function () {})
  }

  // موقعیت جغرافیایی؛ اگر در دسترس نبود بدون آن می‌فرستیم
  var done = false
  var t = setTimeout(function () { if (!done) { done = true; send(null) } }, 2500)
  fetch('https://ipapi.co/json/')
    .then(function (r) { return r.ok ? r.json() : null })
    .then(function (g) { if (!done) { done = true; clearTimeout(t); send(g) } })
    .catch(function () { if (!done) { done = true; clearTimeout(t); send(null) } })
})();

/* PHOSPHOR — CRT boot sequence + interactive terminal */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const boot = $('#boot'), ascii = $('#ascii'), lines = $('#lines'),
        promptLine = $('#promptLine'), echo = $('#cmdEcho'), input = $('#cmd'), terminal = $('#terminal');

  const BOOT = [
    'PHOSPHOR OS 2.6.0 (tty0)',
    'Copyright (c) 2026 Phosphor Systems. All rights reserved.',
    'initializing core ................ ok',
    'mounting /dev/glass .............. ok',
    'loading phosphor.ko .............. ok',
    'calibrating scanlines ............ ok',
    'warming cathode .................. ok',
    'starting session for operator .... ok',
  ];
  const BANNER = 'PHOSPHOR';

  const print = (html, cls = 'out') => {
    const div = document.createElement('div');
    div.className = 'row ' + cls; div.innerHTML = html; lines.appendChild(div); return div;
  };

  const COMMANDS = {
    help: () => `available commands:
  <b>about</b>      what phosphor is
  <b>programs</b>   list installed software
  <b>neofetch</b>   system information
  <b>whoami</b>     current user
  <b>guide</b>      how this site was built
  <b>clear</b>      wipe the screen`,
    about: () => `PHOSPHOR is an operating system for people who miss the future that
never shipped — a single, green, glowing room where the only thing
asking for your attention is the blinking cursor.`,
    programs: () => `compose     a writing room with no toolbar        14K
signal      messages that arrive once, then vanish  22K
atlas       a map of everything you've read         61K
metronome   time, made visible and quiet             8K
phosphor-fm a radio that only plays at night        33K`,
    ls: () => COMMANDS.programs(),
    whoami: () => `operator@phosphor — welcome back. it has been 12 days.`,
    neofetch: () => `      ◈◈◈◈◈       os      PHOSPHOR OS 2.6.0
    ◈◈    ◈◈     host    localhost (tty0)
   ◈◈  ◈◈  ◈    kernel  phosphor.ko
   ◈◈  ◈◈  ◈    uptime  ∞
    ◈◈    ◈◈     shell   psh 4.1
      ◈◈◈◈◈       theme   green phosphor on black glass`,
    date: () => new Date().toString(),
    guide: () => { print('opening /guide …', 'dim'); setTimeout(() => location.href = './guide/', 650); return ''; },
    clear: () => { lines.innerHTML = ''; return ''; },
    echo: (args) => args.join(' '),
    sudo: () => `operator is not in the sudoers file. this incident will be remembered fondly.`,
  };

  let history = [], hIdx = 0;
  function run(raw) {
    const cmd = raw.trim();
    print(`<span class="ps1">phosphor@localhost:~$</span> <span class="cmd-echo">${cmd.replace(/</g,'&lt;')}</span>`, 'row');
    if (!cmd) return;
    history.push(cmd); hIdx = history.length;
    const [name, ...args] = cmd.split(/\s+/);
    const fn = COMMANDS[name.toLowerCase()];
    if (fn) { const out = fn(args); if (out) print(out); }
    else print(`psh: command not found: ${name.replace(/</g,'&lt;')} — type <b>help</b>`, 'dim');
    terminal.scrollTop = terminal.scrollHeight;
  }

  function enableInput() {
    promptLine.hidden = false;
    const focus = () => { try { input.focus({ preventScroll: true }); } catch(e){} };
    terminal.addEventListener('click', focus);
    input.addEventListener('input', () => { echo.textContent = input.value; });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { run(input.value); input.value = ''; echo.textContent = ''; }
      else if (e.key === 'ArrowUp') { if (hIdx > 0) { hIdx--; input.value = history[hIdx] || ''; echo.textContent = input.value; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hIdx < history.length) { hIdx++; input.value = history[hIdx] || ''; echo.textContent = input.value; } e.preventDefault(); }
    });
    print('session started. type <b>help</b> for a list of commands.', 'dim');
    focus();
  }

  function showBanner() {
    ascii.textContent = BANNER;
    ascii.classList.add('lit');
    print('an operating system for people who miss the future.', 'dim');
    setTimeout(enableInput, reduce ? 0 : 380);
  }

  function typeBoot() {
    if (reduce) { boot.textContent = BOOT.join('\n'); showBanner(); return; }
    let i = 0;
    (function next() {
      if (i >= BOOT.length) { setTimeout(showBanner, 220); return; }
      boot.textContent += (i ? '\n' : '') + BOOT[i];
      i++;
      terminal.scrollTop = terminal.scrollHeight;
      setTimeout(next, 130 + Math.random() * 90);
    })();
  }
  // start after fonts settle a touch
  (reduce ? typeBoot() : setTimeout(typeBoot, 350));

  /* reveals */
  const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  window.addEventListener('load', () => {
    if (!window.gsap) { revealAll(); return; }
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal').forEach(el =>
      ScrollTrigger.create({ trigger: el, start: 'top 90%', onEnter: () => el.classList.add('is-in') }));
  });
  setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);
})();

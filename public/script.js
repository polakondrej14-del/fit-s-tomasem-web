/* Fit s Tomášem – interakce */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  root.classList.add('js');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Rok v patičce ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Přilepená hlavička ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobilní menu ---------- */
  const nav = $('#main-nav');
  const toggle = $('.nav-toggle');
  const mobileQuery = window.matchMedia('(max-width: 960px)');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) {
      const first = $('a', nav);
      if (first) setTimeout(() => first.focus(), 50);
    }
  }

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  // Udrží fokus uvnitř otevřeného menu (menu + tlačítko)
  document.addEventListener('focusin', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (!nav.contains(e.target) && e.target !== toggle) toggle.focus();
  });
  mobileQuery.addEventListener('change', () => setMenu(false));

  /* ---------- Zvýraznění aktivní položky menu ---------- */
  if (hasIO) {
    const links = $$('.main-nav ul a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        const link = map.get(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => sectionObserver.observe(s));
  }

  /* ---------- Animace při scrollu ---------- */
  const reveals = $$('.reveal');
  if (!hasIO || reduceMotion) {
    reveals.forEach((el) => el.classList.remove('reveal'));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        obs.unobserve(el);
        // po doběhnutí animace vrátíme prvku jeho běžné hover efekty
        setTimeout(() => el.classList.remove('reveal', 'from-left', 'is-visible'), 1300);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Počítadla ---------- */
  const counters = $$('[data-count]');
  const formatNum = (value, decimals) =>
    value.toLocaleString('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = decimals ? target * eased : Math.round(target * eased);
      el.textContent = formatNum(val, decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (hasIO && !reduceMotion) {
    counters.forEach((el) => { el.textContent = formatNum(0, parseInt(el.dataset.decimals || '0', 10)); });
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------- Akordeon ---------- */
  $$('.acc-btn').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
      } else {
        panel.classList.remove('is-open');
        const done = () => { if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true; };
        if (reduceMotion) done(); else setTimeout(done, 360);
      }
    });
  });

  /* ---------- Předvyplnění balíčku v přihlášce ---------- */
  const packageSelect = $('#f-package');
  const formCard = $('.form-card');

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-package]');
    if (!trigger || !trigger.dataset.package) return;
    showForm();
    packageSelect.value = trigger.dataset.package;
    formCard.classList.remove('is-highlighted');
    void formCard.offsetWidth;
    formCard.classList.add('is-highlighted');
    setTimeout(() => formCard.classList.remove('is-highlighted'), 2200);
  });

  /* ---------- Kvíz ---------- */
  const quiz = $('#quiz');
  if (quiz) {
    const steps = $$('.quiz-step', quiz);
    const nextBtn = $('.quiz-next', quiz);
    const backBtn = $('.quiz-back', quiz);
    const bar = $('.quiz-progress-bar', quiz);
    const label = $('.quiz-step-label', quiz);
    const result = $('.quiz-result', quiz);
    const navRow = $('.quiz-nav', quiz);
    let step = 0;

    const packages = {
      'jednorazovy': { name: 'Jednorázový trénink', price: '690 Kč' },
      'balicek-10': { name: 'Balíček 10 tréninků', price: '5 900 Kč · platnost 3 měsíce' },
      'promena-12': { name: 'Proměna 12 týdnů', price: '9 900 Kč · 24 tréninků + jídelníček' },
      'online': { name: 'Online koučink', price: '1 490 Kč měsíčně' }
    };
    const goalText = {
      hubnuti: 'Na hubnutí je klíčová pravidelnost a jídelníček, který zvládneš dlouhodobě.',
      sila: 'Sílu nejrychleji nabereš s dobrou technikou a postupně rostoucí zátěží.',
      kondice: 'Kondici postavíme kombinací silového tréninku a chytře dávkovaného cardia.',
      navrat: 'Po pauze nebo zranění je nejdůležitější začít opatrně a pod dohledem.'
    };

    function recommend(goal, freq, form) {
      if (form === 'online') {
        let text = goalText[goal] + ' Online koučink ti dá plán v aplikaci, videa s technikou a každý týden kontrolu, ať trénuješ ' +
          (freq === '1' ? 'jednou týdně, nebo častěji, až se rozjedeš.' : freq === '2' ? 'dvakrát týdně, kdy se ti to hodí.' : 'třikrát týdně a víc podle svého rozvrhu.');
        if (goal === 'navrat') text += ' U návratu po zranění doporučuju začít jednou vstupní diagnostikou ve studiu.';
        return { pkg: 'online', text };
      }
      if (freq === '1') {
        return {
          pkg: 'balicek-10',
          text: goalText[goal] + ' Při tréninku jednou týdně ti balíček 10 tréninků vydrží přesně na 3 měsíce platnosti – a ušetříš 1 000 Kč.' +
            (goal === 'navrat' ? ' Tempo přizpůsobíme tomu, jak se tvoje tělo zotavuje.' : ' Na volné dny dostaneš jednoduchý plán domů.')
        };
      }
      if (freq === '2') {
        return {
          pkg: 'promena-12',
          text: goalText[goal] + ' Dva tréninky týdně jsou ideální rytmus – Proměna obsahuje přesně 24 tréninků na 12 týdnů, jídelníček i měsíční měření.'
        };
      }
      return {
        pkg: 'promena-12',
        text: goalText[goal] + ' Když můžeš trénovat 3× týdně, v Proměně spolu odtrénujeme 2 tréninky a třetí zvládneš sám podle plánu, který ti připravím.'
      };
    }

    const stepValue = (i) => {
      const checked = $('input:checked', steps[i]);
      return checked ? checked.value : null;
    };

    function render() {
      steps.forEach((s, i) => {
        s.hidden = i !== step;
        s.classList.toggle('is-active', i === step);
      });
      label.textContent = 'Otázka ' + (step + 1) + ' ze ' + steps.length;
      bar.style.width = ((step + 1) / steps.length) * 100 + '%';
      backBtn.hidden = step === 0;
      nextBtn.disabled = !stepValue(step);
      nextBtn.textContent = step === steps.length - 1 ? 'Zobrazit doporučení' : 'Další';
    }

    function showResult() {
      const r = recommend(stepValue(0), stepValue(1), stepValue(2));
      const p = packages[r.pkg];
      $('.quiz-result-title', quiz).textContent = p.name;
      $('.quiz-result-price', quiz).textContent = p.price;
      $('.quiz-result-text', quiz).textContent = r.text;
      $('.quiz-result-cta', quiz).dataset.package = r.pkg;
      steps.forEach((s) => { s.hidden = true; });
      navRow.hidden = true;
      label.textContent = 'Hotovo!';
      bar.style.width = '100%';
      result.hidden = false;
      result.focus({ preventScroll: true });
    }

    quiz.addEventListener('change', (e) => {
      if (e.target.matches('input[type="radio"]')) nextBtn.disabled = false;
    });
    // Enter na zvolené odpovědi posune kvíz dál
    quiz.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('.quiz-step input') && stepValue(step)) {
        e.preventDefault();
        nextBtn.click();
      }
    });
    nextBtn.addEventListener('click', () => {
      if (!stepValue(step)) return;
      if (step < steps.length - 1) {
        step++;
        render();
        const first = $('input:checked', steps[step]) || $('input', steps[step]);
        first.focus();
      } else {
        showResult();
      }
    });
    backBtn.addEventListener('click', () => {
      if (step === 0) return;
      step--;
      render();
      ($('input:checked', steps[step]) || $('input', steps[step])).focus();
    });
    $('.quiz-restart', quiz).addEventListener('click', () => {
      $$('input', quiz).forEach((i) => { i.checked = false; });
      step = 0;
      result.hidden = true;
      navRow.hidden = false;
      render();
      $('input', steps[0]).focus();
    });
    render();
  }

  /* ---------- Formulář ---------- */
  const form = $('#signup-form');
  const success = $('.form-success');

  function showForm() {
    if (!form.hidden) return;
    success.hidden = true;
    form.hidden = false;
  }

  if (form) {
    const fields = {
      jmeno: $('#f-name'),
      email: $('#f-email'),
      telefon: $('#f-phone'),
      cil: $('#f-goal'),
      souhlas: $('#f-consent')
    };
    const formaGroup = $('.choice-group', form);
    const formaErr = $('#f-form-err');
    let submitted = false;

    const rules = {
      jmeno: (v) => v.trim().length >= 2 ? '' : 'Napiš prosím své jméno.',
      email: (v) => {
        if (!v.trim()) return 'Vyplň prosím e-mail.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Tenhle e-mail nevypadá správně – zkontroluj ho, prosím.';
      },
      telefon: (v) => {
        if (!v.trim()) return 'Vyplň prosím telefon, ať ti můžu zavolat.';
        const digits = v.replace(/\D/g, '');
        return /^\+?[\d\s()-]+$/.test(v.trim()) && digits.length >= 9 && digits.length <= 15 ? '' : 'Zadej telefon ve tvaru např. +420 777 123 456.';
      },
      cil: (v) => v ? '' : 'Vyber prosím svůj hlavní cíl.',
      souhlas: (_, el) => el.checked ? '' : 'Bez souhlasu tě bohužel nemůžu kontaktovat.'
    };

    function setError(el, msg) {
      const err = document.getElementById(el.getAttribute('aria-describedby'));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
    }

    function validateField(name) {
      const el = fields[name];
      const msg = rules[name](el.value, el);
      setError(el, msg);
      return !msg;
    }

    function validateForma() {
      const ok = !!$('input[name="forma"]:checked', form);
      formaErr.textContent = ok ? '' : 'Vyber, jestli chceš trénovat osobně, nebo online.';
      formaGroup.classList.toggle('has-error', !ok);
      $$('input[name="forma"]', form).forEach((r) => r.setAttribute('aria-invalid', ok ? 'false' : 'true'));
      return ok;
    }

    Object.keys(fields).forEach((name) => {
      const el = fields[name];
      const evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, () => { if (submitted || el.getAttribute('aria-invalid') === 'true') validateField(name); });
      el.addEventListener('blur', () => { if (el.value || submitted) validateField(name); });
    });
    $$('input[name="forma"]', form).forEach((r) => r.addEventListener('change', () => { if (submitted) validateForma(); }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = true;
      const results = Object.keys(fields).map((n) => [n, validateField(n)]);
      const formaOk = validateForma();
      const firstBad = results.find(([, ok]) => !ok);
      if (firstBad || !formaOk) {
        // fokus na první chybné pole v pořadí formuláře
        const order = ['jmeno', 'email', 'telefon', 'cil', 'forma', 'souhlas'];
        for (const n of order) {
          if (n === 'forma') { if (!formaOk) { $('input[name="forma"]', form).focus(); break; } continue; }
          if (fields[n].getAttribute('aria-invalid') === 'true') { fields[n].focus(); break; }
        }
        return;
      }
      showSuccess();
    });

    const optText = (sel) => sel.options[sel.selectedIndex].text;

    function showSuccess() {
      const data = new FormData(form);
      const times = data.getAll('cas');
      const rows = [
        ['Jméno', data.get('jmeno').trim()],
        ['E-mail', data.get('email').trim()],
        ['Telefon', data.get('telefon').trim()],
        ['Hlavní cíl', optText(fields.cil)],
        ['Balíček', optText(packageSelect)],
        ['Forma', data.get('forma') === 'online' ? 'Online' : 'Osobně'],
        ['Preferované časy', times.length ? times.join(', ') : 'bez preference'],
        ['Zkušenost', optText($('#f-exp'))]
      ];
      const msg = (data.get('zprava') || '').trim();
      if (msg) rows.push(['Zpráva', msg]);

      const dl = $('.summary', success);
      dl.innerHTML = '';
      rows.forEach(([k, v]) => {
        const div = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = k;
        dd.textContent = v;
        div.append(dt, dd);
        dl.append(div);
      });
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
      const top = formCard.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    $('.form-reset', success).addEventListener('click', () => {
      form.reset();
      submitted = false;
      Object.values(fields).forEach((el) => setError(el, ''));
      formaErr.textContent = '';
      formaGroup.classList.remove('has-error');
      showForm();
      fields.jmeno.focus();
    });
  }

  /* ---------- Plovoucí tlačítko ---------- */
  const floating = $('.floating-cta');
  const signup = $('#prihlaska');
  const heroActions = $('.hero-actions');
  if (floating && signup && hasIO) {
    // skryté, když je vidět přihláška nebo tlačítka v hero (zbytečně by je překrývalo)
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      });
      floating.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.05 });
    io.observe(signup);
    if (heroActions) io.observe(heroActions);
  }

  /* ---------- Posun recenzí ---------- */
  const reviews = $('.reviews');
  if (reviews) {
    $$('.slider-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = $('.review', reviews);
        const step = card ? card.getBoundingClientRect().width + 20 : reviews.clientWidth;
        reviews.scrollBy({ left: step * parseInt(btn.dataset.dir, 10), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }
})();

// Плавное поведение для якорей с учетом высоты sticky-header.
const header = document.querySelector(".header");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
const body = document.body;
const exportAnalyticsButton = document.getElementById("export-analytics");
const AB_STORAGE_KEY = "yh_ab_variant";
const ANALYTICS_STORAGE_KEY = "yh_ab_events";

function readEvents() {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function trackEvent(eventName, details = {}) {
  const events = readEvents();
  const payload = {
    event: eventName,
    variant: body.getAttribute("data-variant") || "a",
    ts: new Date().toISOString(),
    details,
  };
  events.push(payload);
  localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  // Debug-лог для локальной проверки событий.
  console.info("[AB analytics]", payload);
}

function downloadAnalytics() {
  const data = {
    exported_at: new Date().toISOString(),
    variant: localStorage.getItem(AB_STORAGE_KEY) || "a",
    events: readEvents(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateSuffix = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `yh-ab-analytics-${dateSuffix}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// A/B-тест: переключение визуальной версии через query-параметр.
const params = new URLSearchParams(window.location.search);
const requestedVariant = params.get("variant");
const savedVariant = localStorage.getItem(AB_STORAGE_KEY);
const randomVariant = Math.random() < 0.5 ? "a" : "b";
const activeVariant =
  requestedVariant === "a" || requestedVariant === "b"
    ? requestedVariant
    : savedVariant === "a" || savedVariant === "b"
      ? savedVariant
      : randomVariant;

if (activeVariant === "b") {
  body.classList.add("variant-b");
}
body.setAttribute("data-variant", activeVariant);
localStorage.setItem(AB_STORAGE_KEY, activeVariant);
trackEvent("session_start", { source: requestedVariant ? "url_param" : "sticky_or_random" });

if (exportAnalyticsButton) {
  exportAnalyticsButton.addEventListener("click", () => {
    downloadAnalytics();
    trackEvent("analytics_exported");
  });
}

anchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    const headerOffset = header ? header.offsetHeight : 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 8;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });

    trackEvent("anchor_click", { target: targetId });
  });
});

// Мягкая анимация появления блоков при прокрутке.
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element) => revealObserver.observe(element));

// Отслеживание кликов по CTA-кнопкам, ведущим в Telegram.
const telegramButtons = document.querySelectorAll('a[href*="t.me/Khasinaeva_Yuliya"]');
telegramButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const label = (button.textContent || "").trim() || "cta";
    trackEvent("telegram_cta_click", { label });
  });
});

// Мини-диагностика: считаем ответы по категориям и возвращаем точку сбоя.
const quizForm = document.getElementById("quiz-form");
const quizResult = document.getElementById("quiz-result");

const resultMap = {
  personality: {
    title: "Твой сбой — личность",
    text: "Система не держится без внутренней устойчивости. Следующий шаг: зафиксировать личные опоры и убрать внутренние утечки ресурса.",
  },
  decisions: {
    title: "Твой сбой — решения",
    text: "Рост тормозится из-за неуправляемого выбора. Следующий шаг: внедрить структуру принятия решений и усилить стратегическую ясность.",
  },
  money: {
    title: "Твой сбой — деньги",
    text: "Финансы не поддерживают масштаб. Следующий шаг: пересобрать денежную логику и связать ее с системными действиями.",
  },
  business: {
    title: "Твой сбой — дело",
    text: "Перегруз и ручной режим мешают росту. Следующий шаг: выстроить операционную систему, которая снимает нагрузку с тебя.",
  },
  scale: {
    title: "Твой сбой — масштаб",
    text: "Потенциал роста есть, но нет каркаса масштабирования. Следующий шаг: собрать архитектуру роста и закрепить новую роль.",
  },
};

if (quizForm && quizResult) {
  quizForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(quizForm);
    const scores = {
      personality: 0,
      decisions: 0,
      money: 0,
      business: 0,
      scale: 0,
    };

    for (const value of formData.values()) {
      if (scores[value] !== undefined) {
        scores[value] += 1;
      }
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topKey = sorted[0][0];
    const result = resultMap[topKey];

    quizResult.innerHTML = `
      <h3>${result.title}</h3>
      <p>${result.text}</p>
      <div class="actions">
        <a class="btn btn--primary" href="https://t.me/Khasinaeva_Yuliya" target="_blank" rel="noopener noreferrer">Получить карту</a>
        <a class="btn btn--ghost" href="https://t.me/Khasinaeva_Yuliya" target="_blank" rel="noopener noreferrer">Мини-разбор</a>
        <a class="btn btn--ghost" href="https://t.me/Khasinaeva_Yuliya" target="_blank" rel="noopener noreferrer">Диагностика</a>
      </div>
    `;

    quizResult.classList.add("is-visible");
    quizResult.scrollIntoView({ behavior: "smooth", block: "center" });
    trackEvent("quiz_completed", { top_category: topKey, scores });
  });
}

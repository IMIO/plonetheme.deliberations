import "./styles/theme.scss";
import "./styles/theme.scss";
// import "bootstrap";

const heightWidthRatio = 0.33;

const createWatermark = (el, width, height, repeat) => {
  const watermark = document.createElement("div");
  watermark.classList.add("watermark");
  const wSize = height + width;
  watermark.style.height = wSize + "px";
  watermark.style.width = wSize + "px";
  watermark.style.left = -wSize / 2 + width / 2 + "px";
  watermark.style.top = -wSize / 2 + height / 2 + "px";
  watermark.dataset.text = (el.dataset.watermark + " – ").repeat(repeat);
  el.appendChild(watermark);
};

const autoWatermark = (el) => {
  const lengthMultiplier = Math.round(el.dataset.watermark.length);
  const repeat = Math.round(
    el.offsetHeight * heightWidthRatio * lengthMultiplier
  );
  if (el.dataset.watermark) {
    createWatermark(el, el.offsetWidth, el.offsetHeight, repeat);
  }
};

const cleanWatermarks = () => {
  document.querySelectorAll(".watermark").forEach(function (el) {
    el.parentNode.removeChild(el);
  });
};

const applyWatermarks = () => {
  document.querySelectorAll(".watermarked").forEach(function (el) {
    autoWatermark(el);
  });
};

// Flag <html> as early as possible — at top level, NOT in DOMContentLoaded.
// The theme bundle is a synchronous <head> script, so this runs before <body>
// (and the toolbar) is parsed/painted: the off-canvas CSS is in effect at first
// paint, so the toolbar never flashes open-then-closed on each page load. If
// the JS fails to load entirely, the flag is absent and the SCSS leaves the
// toolbar visible (never trapped off-screen). Harmless on pages with no toolbar.
document.documentElement.classList.add("pm-fab-ready");

// On mobile/tablet (<992px) the editor toolbar is shown as a floating left
// icon-rail that a FAB toggles. We inject the FAB + scrim here (vanilla JS —
// Bootstrap JS is not bundled) only when the toolbar is actually present.
const initToolbarFab = () => {
  const editZone = document.getElementById("edit-zone");
  // The toolbar viewlet only renders #edit-zone for logged-in users with a
  // visible toolbar; anonymous visitors get nothing injected.
  if (!editZone || document.querySelector(".pm-fab")) return;

  const scrim = document.createElement("div");
  scrim.className = "pm-toolbar-scrim";
  scrim.setAttribute("aria-hidden", "true");
  document.body.appendChild(scrim);

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "pm-fab";
  fab.setAttribute("aria-label", "Ouvrir la barre d'outils");
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "edit-zone");
  const icon = document.createElement("i");
  icon.className = "bi bi-list";
  icon.setAttribute("aria-hidden", "true");
  fab.appendChild(icon);
  document.body.appendChild(fab);

  const open = () => {
    document.body.classList.add("pm-toolbar-open");
    fab.setAttribute("aria-expanded", "true");
    fab.setAttribute("aria-label", "Fermer la barre d'outils");
    icon.className = "bi bi-x-lg";
  };
  const close = () => {
    document.body.classList.remove("pm-toolbar-open");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-label", "Ouvrir la barre d'outils");
    icon.className = "bi bi-list";
  };
  const toggle = () =>
    document.body.classList.contains("pm-toolbar-open") ? close() : open();

  fab.addEventListener("click", toggle);
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      document.body.classList.contains("pm-toolbar-open")
    ) {
      close();
    }
  });
};

document.addEventListener("DOMContentLoaded", function (event) {
  // const popoverTriggerList = document.querySelectorAll(
  //   '[data-bs-toggle="popover"]'
  // );
  // console.log(popoverTriggerList);
  // [...popoverTriggerList].map(
  //   (popoverTriggerEl) => new Popover(popoverTriggerEl)
  // );
  applyWatermarks();
  initToolbarFab();
  if (typeof Faceted != "undefined") {
    jQuery(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_SUCCESS, function () {
      setTimeout(() => {
        cleanWatermarks();
        applyWatermarks();
      }, 100);
    });
  }
});

document.addEventListener("ItemsLayoutChanged", function (event) {
  cleanWatermarks();
  applyWatermarks();
});

// if (module.hot) {
//   module.hot.accept();
// }

/**
 * Mobile bottom tab bar — "Barre d'onglets fixe".
 *
 * On mobile/tablet (<992px) the off-canvas hamburger menu is replaced by a
 * persistent bottom tab bar within thumb reach. We don't ship our own nav data:
 * we read the destinations Plone already renders into #portal-globalnav once at
 * mount, then render a small Preact component for the (only) bit of state that
 * actually changes — whether the "Plus" overflow panel is open.
 *
 * Up to MAX_TABS primary sections become tabs; any remaining sections plus the
 * external "Return to the website" link fold into the "Plus" popover. The bar is
 * hidden on desktop by CSS (styles/mobile-tabs.scss), so mounting it
 * unconditionally is harmless.
 */
import { render } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

const MAX_TABS = 3;

// bootstrap-icons glyph per known section id; custom folders get the default.
const ICONS = {
  decisions: "bi-card-checklist",
  publications: "bi-megaphone",
  "a-propos": "bi-info-circle",
  // The "Paramètres" tab is the `institution_settings` portal action
  // (profiles/default/actions.xml), so that's the <li> class; "manage-settings"
  // (the @@manage-settings view it links to) is kept as a defensive alias.
  institution_settings: "bi-gear",
  "manage-settings": "bi-gear",
  agenda: "bi-calendar-event",
  seances: "bi-calendar-event",
  "website-url": "bi-box-arrow-up-right",
};
const DEFAULT_ICON = "bi-folder";

// Plone's global-sections viewlet renders each tab as
//   <li class="<id> [has_subtree] nav-item">…</li>
// (the object id is the FIRST class — that's why `.nav-item.website-url`
// works as a selector). pat-navigationmarker later appends current/inPath.
// So the section id is the first class that isn't one of these structural ones.
const STRUCTURAL_CLASSES = new Set([
  "nav-item",
  "has_subtree",
  "dropdown",
  "current",
  "inPath",
  "navTreeItemInPath",
  "selected",
]);

// Read the destinations Plone rendered into #portal-globalnav (once, at mount).
const readDestinations = () => {
  const currentPath = window.location.pathname.replace(/\/+$/, "");
  return Array.from(document.querySelectorAll("#portal-globalnav > li")).map(
    (li) => {
      const link = li.querySelector("a");
      const href = link ? link.getAttribute("href") : "#";
      const label = (link ? link.textContent : li.textContent).trim();
      const id =
        (li.className || "")
          .trim()
          .split(/\s+/)
          .find((c) => c && !STRUCTURAL_CLASSES.has(c)) || "";
      const isExternal = li.classList.contains("website-url");
      // Active state: trust pat-navigationmarker's classes if already applied,
      // else fall back to URL-path matching (the pattern may not have run yet at
      // DOMContentLoaded, so the URL test is the reliable signal).
      let isCurrent =
        li.classList.contains("current") || li.classList.contains("inPath");
      if (!isCurrent && href && !isExternal) {
        try {
          const tabPath = new URL(
            href,
            window.location.origin
          ).pathname.replace(/\/+$/, "");
          isCurrent =
            !!tabPath &&
            (currentPath === tabPath || currentPath.startsWith(tabPath + "/"));
        } catch (e) {
          /* malformed href — ignore */
        }
      }
      return { href, label, isExternal, isCurrent, icon: ICONS[id] || DEFAULT_ICON };
    }
  );
};

// Split destinations into the primary tab strip and the "Plus" overflow. The
// external link always lives in the overflow; with <=4 destinations total we
// still show everything as tabs (no "Plus").
const splitDestinations = (destinations) => {
  if (destinations.length <= MAX_TABS + 1) {
    return { tabs: destinations, overflow: [] };
  }
  const sections = destinations.filter((d) => !d.isExternal);
  const externals = destinations.filter((d) => d.isExternal);
  return {
    tabs: sections.slice(0, MAX_TABS),
    overflow: sections.slice(MAX_TABS).concat(externals),
  };
};

const Tab = ({ dest }) => (
  <a
    class={
      "db-tab" +
      (dest.isExternal ? " db-tab--ext" : "") +
      (dest.isCurrent ? " is-active" : "")
    }
    href={dest.href}
    aria-current={dest.isCurrent ? "page" : undefined}
  >
    <i class={"bi " + dest.icon + " db-tab__icon"} aria-hidden="true" />
    <span class="db-tab__label">{dest.label}</span>
  </a>
);

function MobileTabbar({ destinations }) {
  const { tabs, overflow } = splitDestinations(destinations);
  const hasOverflow = overflow.length > 0;
  const moreActive = overflow.some((d) => d.isCurrent);

  const [open, setOpen] = useState(false);
  const moreBtnRef = useRef(null);
  const firstItemRef = useRef(null);

  const close = (refocus) => {
    setOpen(false);
    if (refocus && moreBtnRef.current) moreBtnRef.current.focus();
  };

  // Reflect the panel state on <body> (the CSS uses it to reveal scrim + panel)
  // and wire Escape-to-close. Focus moves into the panel on open.
  useEffect(() => {
    document.body.classList.toggle("db-more-open", open);
    if (open && firstItemRef.current) firstItemRef.current.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && open) close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The editor toolbar and this popover are mutually exclusive bottom overlays:
  // opening the toolbar (its FAB dispatches "pm-toolbar-open") closes the
  // popover so it isn't left floating above the toolbar's dark scrim.
  useEffect(() => {
    const closeOnToolbar = () => setOpen(false);
    document.addEventListener("pm-toolbar-open", closeOnToolbar);
    return () => document.removeEventListener("pm-toolbar-open", closeOnToolbar);
  }, []);

  return (
    <>
      {hasOverflow && (
        <>
          <div
            class="db-more-scrim"
            aria-hidden="true"
            onClick={() => close(false)}
          />
          <div id="db-more-panel" class="db-more" role="menu">
            {overflow.map((d, i) => (
              <a
                ref={i === 0 ? firstItemRef : null}
                class={
                  "db-more__link" +
                  (d.isExternal ? " db-more__link--ext" : "") +
                  (d.isCurrent ? " is-active" : "")
                }
                href={d.href}
                role="menuitem"
                aria-current={d.isCurrent ? "page" : undefined}
                onClick={() => close(false)}
              >
                <i class={"bi " + d.icon} aria-hidden="true" />
                <span>{d.label}</span>
              </a>
            ))}
          </div>
        </>
      )}

      <nav class="db-bottombar" aria-label="Navigation principale">
        {tabs.map((d) => (
          <Tab dest={d} />
        ))}
        {hasOverflow && (
          <button
            type="button"
            ref={moreBtnRef}
            class={"db-tab db-tab--more" + (moreActive ? " is-active" : "")}
            aria-haspopup="true"
            aria-expanded={open ? "true" : "false"}
            aria-controls="db-more-panel"
            onClick={() => setOpen((v) => !v)}
          >
            <i class="bi bi-three-dots db-tab__icon" aria-hidden="true" />
            <span class="db-tab__label">Plus</span>
          </button>
        )}
      </nav>
    </>
  );
}

export const initMobileTabbar = () => {
  if (document.querySelector(".db-bottombar-root")) return; // idempotent
  const destinations = readDestinations();
  if (destinations.length === 0) return; // portal root / bare pages: nothing.

  const root = document.createElement("div");
  root.className = "db-bottombar-root";
  document.body.appendChild(root);
  render(<MobileTabbar destinations={destinations} />, root);

  // Flag <html> so the editor FAB can be raised above the bar (see base.scss).
  document.documentElement.classList.add("db-tabbar-ready");
};

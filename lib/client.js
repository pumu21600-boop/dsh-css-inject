/**
 * dsh-css-inject client half:
 *  - "自定义 CSS" settings section: textarea + save, undo/redo toolbar,
 *    and a de-emphasized clear button tucked at the bottom-right.
 *  - "自定义背景" settings section (below it): upload an image or video as
 *    the page background with a 1-100 opacity slider.
 *  - "悬停 CSS 检查器" (hover CSS inspector) switch at the top of the Custom
 *    CSS section: while on, hovering any element shows its selector, computed
 *    styles, matched CSS rules and inline style, with copy buttons; click an
 *    element to pin the panel. Esc unpins.
 *  - "下拉框美化" (select beautifier) switch below it: native <select> popups
 *    are OS-rendered and unstylable, so while on they are replaced by a themed
 *    custom popup whose background follows --dsh-select-popup-bg (transparent
 *    supported).
 * Persistence is host-owned, never browser storage: the CSS text, the two
 * switches, the inspector panel position and the background descriptor live in
 * the host settings namespace `css-inject` (settings.yaml), and the background
 * media bytes live under $DSH_HOME/storages/dsh-css-inject/ — both reached
 * through the same-origin endpoints /dsh-css-inject/config and
 * /dsh-css-inject/bg. Nothing is bound to the page origin, so a port or host
 * change no longer loses the user's setup.
 */
window.__ModuleLoader__.load({
	id: "dsh-css-inject",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const jsxRuntime = require("react/jsx-runtime");
		const { jsx, jsxs } = jsxRuntime;

		// Section UI styles (tagged so the client-modules style bookkeeping owns them).
		const css = `
.uCss_section{flex-direction:column;gap:12px;width:100%;display:flex}
.uCss_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}
.uCss_area{box-sizing:border-box;width:100%;min-height:260px;resize:vertical;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-input-major);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:10px 12px;font-family:var(--ds-font-family-code);font-size:12px;line-height:18px;outline:none;tab-size:2}
.uCss_area:focus{border-color:var(--dsw-static-neutral-bluish-400)}
.uCss_actions{align-items:center;gap:8px;display:flex}
.uCss_primary{box-sizing:border-box;height:36px;font:inherit;cursor:pointer;color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-button-primary-fill);border:none;border-radius:18px;padding:0 18px;font-size:14px;line-height:22px}
.uCss_primary:hover{filter:brightness(1.08)}
.uCss_ghost{box-sizing:border-box;height:36px;font:inherit;cursor:pointer;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;padding:0 16px;font-size:14px;line-height:22px}
.uCss_ghost:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.uCss_ghost:disabled{opacity:.45;cursor:default}
.uCss_footer{margin-top:4px;justify-content:flex-end;align-items:center;gap:10px;display:flex}
.uCss_clear{box-sizing:border-box;height:28px;font:inherit;cursor:pointer;color:var(--dsw-alias-label-tertiary);background:transparent;border:1px solid transparent;border-radius:14px;padding:0 10px;font-size:12px;line-height:18px}
.uCss_clear:hover{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-border-l2)}
.uCss_status{color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px}
.uCss_status[data-error="true"]{color:var(--dsw-alias-state-error-primary)}
.uBg_section{flex-direction:column;gap:12px;width:100%;display:flex}
.uBg_row{align-items:center;gap:12px;display:flex}
.uBg_slider{flex:1;accent-color:#4d6bfe;accent-color:var(--dsw-static-neutral-bluish-400)}
.uBg_slider:disabled{opacity:.45}
.uBg_value{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;width:40px;text-align:right;font-size:13px;line-height:22px}
.uBg_file{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dsh-bg-video{position:fixed;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
/* ---- hover CSS inspector ---- */
.uCss_inspRow{align-items:center;gap:10px;display:flex;padding:10px 12px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px}
.uCss_switch{box-sizing:border-box;width:40px;height:22px;flex:none;cursor:pointer;background:var(--dsw-alias-interactive-bg-hover);border:1px solid var(--dsw-alias-border-l2);border-radius:11px;padding:2px;position:relative;transition:background .15s}
.uCss_switch_on{background:var(--dsw-static-neutral-bluish-400);border-color:transparent}
.uCss_knob{display:block;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .15s}
.uCss_switch_on .uCss_knob{transform:translateX(18px)}
.uCss_inspText{flex-direction:column;gap:2px;min-width:0;display:flex}
.uCss_inspTitle{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;font-weight:500}
.uCss_inspDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
#dsh-inspector-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none}
#dsh-inspector-outline{position:fixed;display:none;z-index:2147483000;pointer-events:none;box-sizing:border-box;border:1.5px solid #4d6bfe;background:rgba(77,107,254,.10)}
#dsh-inspector-badge{position:fixed;right:12px;bottom:12px;z-index:2147483002;display:none;pointer-events:none;color:#eaf0ff;background:rgba(15,20,32,.92);border:1px solid #3a4a7a;border-radius:999px;padding:6px 14px;font:12px/1.6 -apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35)}
#dsh-inspector-badge[data-on="1"]{display:block}
#dsh-inspector-panel{position:fixed;top:12px;right:12px;display:none;z-index:2147483001;pointer-events:auto;box-sizing:border-box;width:380px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;overscroll-behavior:contain;color:#dce3f5;background:rgba(15,20,32,.97);border:1px solid #2b3654;border-radius:10px;box-shadow:0 14px 44px rgba(0,0,0,.5);font:12px/1.55 -apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;padding:10px 12px}
#dsh-inspector-panel::-webkit-scrollbar{width:8px}
#dsh-inspector-panel::-webkit-scrollbar-thumb{background:#2b3654;border-radius:4px}
.dshInsp_head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:move;user-select:none}
.dshInsp_tag{font:600 13px/1.5 ui-monospace,Consolas,Monaco,monospace;color:#8fb1ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshInsp_headBtns{display:flex;gap:6px;flex:none}
.dshInsp_btn{flex:none;cursor:pointer;color:#9fb0d8;background:transparent;border:1px solid #33406b;border-radius:7px;padding:5px 10px;font:inherit;font-size:12px;line-height:18px}
.dshInsp_btn:hover{color:#fff;border-color:#4d6bfe;background:rgba(77,107,254,.18)}
.dshInsp_btn_on{color:#fff;background:rgba(77,107,254,.3);border-color:#4d6bfe}
.dshInsp_hint{color:#8fa2c8;padding:16px 6px;text-align:center;font-size:12px}
.dshInsp_sel{display:flex;align-items:center;gap:6px;margin:8px 0}
.dshInsp_sel code{flex:1;min-width:0;color:#e8d27a;background:rgba(255,255,255,.05);border-radius:5px;padding:3px 6px;font:11px/1.6 ui-monospace,Consolas,Monaco,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshInsp_sect{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;color:#7d8bb0;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.dshInsp_grp{margin-bottom:2px}
.dshInsp_grpTitle{color:#9aa8cc;margin:4px 0 2px;font-size:11px}
.dshInsp_row{display:flex;gap:8px;padding:1px 0;font:11px/1.7 ui-monospace,Consolas,Monaco,monospace}
.dshInsp_k{flex:none;width:118px;color:#8f9bbf;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshInsp_v{flex:1;color:#dfe6f8;word-break:break-all}
.dshInsp_dim{opacity:.45}
.dshInsp_rules{display:flex;flex-direction:column;gap:4px}
.dshInsp_rule{white-space:pre-wrap;word-break:break-all;color:#c9d4ef;background:rgba(255,255,255,.045);border-left:2px solid #4d6bfe;border-radius:0 5px 5px 0;padding:4px 6px;font:11px/1.6 ui-monospace,Consolas,Monaco,monospace}
.dshInsp_none{color:#77839f;font-size:11px}
.dshInsp_inlineWrap{display:none}
.dshInsp_inline{white-space:pre-wrap;word-break:break-all;color:#e8d27a;background:rgba(255,255,255,.045);border-radius:5px;padding:4px 6px;font:11px/1.6 ui-monospace,Consolas,Monaco,monospace}
.dshInsp_actions{display:flex;gap:6px;margin-top:10px}
.dshInsp_actions .dshInsp_btn{flex:1;padding:7px 4px;text-align:center}
.dshInsp_foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:6px;border-top:1px solid #223052;color:#77839f;font-size:11px}
.dshInsp_off{color:#e0757f}
.dshInsp_off:hover{color:#ff9aa5;border-color:#e0757f;background:rgba(224,117,127,.12)}
/* ---- select beautifier (replaces the native white popup) ---- */
.dshSelect{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238f9bbf' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 10px center!important;background-size:14px!important;background-color:var(--dsh-select-bg,var(--dsw-specific-input-major))!important;padding-right:30px!important;cursor:pointer}
.dshSelect:focus{outline:1px solid var(--dsw-static-neutral-bluish-400,#4d6bfe)!important}
#dsh-select-popup{position:fixed;z-index:2147483003;display:none;box-sizing:border-box;min-width:160px;max-height:280px;overflow:auto;overscroll-behavior:contain;background:var(--dsh-select-popup-bg,var(--dsw-alias-bg-overlay,#1a2030));border:1px solid var(--dsw-alias-border-l2,#2b3654);border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,.45);padding:4px;font:13px/1.6 -apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif}
#dsh-select-popup::-webkit-scrollbar{width:8px}
#dsh-select-popup::-webkit-scrollbar-thumb{background:#2b3654;border-radius:4px}
#dsh-select-popup .dshSelectOpt{padding:7px 12px;border-radius:7px;color:var(--dsw-alias-label-primary,#e6ebf7);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dsh-select-popup .dshSelectOpt:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
#dsh-select-popup .dshSelectOpt.hl{background:rgba(77,107,254,.22);color:#fff}
#dsh-select-popup .dshSelectOpt.sel{background:var(--dsw-specific-sidebar-nav-item-active,rgba(77,107,254,.28));color:#fff}
#dsh-select-popup .dshSelectOpt[disabled]{opacity:.4;cursor:default}`;
		const tagId = "dsh-css-inject/section.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-css-inject";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		const NS = "css-inject";
		const STYLE_ID = "dsh-user-css";
		const BG_STYLE_ID = "dsh-user-bg";
		const BG_VIDEO_ID = "dsh-bg-video";
		const CONFIG_URL = "/dsh-css-inject/config";
		const BG_URL = "/dsh-css-inject/bg";

		// ---- host-owned persisted state ----
		/** In-memory mirror of the host's `css-inject` settings namespace. */
		let cfg = {
			css: "",
			inspector: false,
			selectBeautify: false,
			inspectorLeft: "",
			inspectorTop: "",
			bgKind: "",
			bgName: "",
			bgFile: "",
			bgOpacity: 60
		};
		/** Cache-buster for the served background file (bumped on every upload). */
		let bgRev = 0;
		const bgUrl = () => (cfg.bgFile === "" ? null : BG_URL + "?rev=" + bgRev);
		const cfgSubs = /* @__PURE__ */ new Set();
		function emitCfg() {
			for (const fn of [...cfgSubs]) fn();
		}
		/** Merge a partial patch into the mirror, then persist it on the host. */
		function patchCfg(patch) {
			cfg = { ...cfg, ...patch };
			emitCfg();
			scheduleSave();
		}
		let saveTimer = null;
		function scheduleSave() {
			if (saveTimer !== null) clearTimeout(saveTimer);
			saveTimer = setTimeout(() => {
				saveTimer = null;
				try {
					fetch(CONFIG_URL, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify(cfg)
					}).catch(() => {});
				} catch {}
			}, 150);
		}
		/** Read the persisted CSS (never throws). */
		function readSaved() {
			return typeof cfg.css === "string" ? cfg.css : "";
		}
		/**
		 * Apply CSS text to a single owned <style> tag; empty input removes it.
		 */
		function applyCss(cssText) {
			const existing = document.getElementById(STYLE_ID);
			if (typeof cssText !== "string" || cssText.trim() === "") {
				existing?.remove();
				return;
			}
			if (existing === null) {
				const tag = document.createElement("style");
				tag.id = STYLE_ID;
				tag.dataset.plugin = "dsh-css-inject";
				document.head.appendChild(tag);
				tag.textContent = cssText;
				return;
			}
			existing.textContent = cssText;
		}

		// ---- background application layer ----
		function ensureBgStyle() {
			let el = document.getElementById(BG_STYLE_ID);
			if (el === null) {
				el = document.createElement("style");
				el.id = BG_STYLE_ID;
				el.dataset.plugin = "dsh-css-inject";
				document.head.appendChild(el);
			}
			return el;
		}
		/**
		 * Theme canvas color that sits behind the translucent background media.
		 * The app paints its base background only on body; once the override
		 * makes it transparent, the default white page canvas shows through the
		 * semi-transparent image and gives it a milky cast. Re-paint the root
		 * canvas with the theme base so the opacity slider blends the media
		 * against the backdrop the theme actually uses. Captured before the
		 * transparent override is written; a later computed value of
		 * "transparent" means our override is active, so the last known theme
		 * base is kept (theme switches re-capture on their own).
		 */
		let canvasBase = null;
		function readCanvasBase() {
			try {
				const v = getComputedStyle(document.body).getPropertyValue("--dsw-alias-bg-base").trim();
				if (v !== "" && v !== "transparent") canvasBase = v;
			} catch {}
			return canvasBase ?? "rgb(21, 21, 23)";
		}
		/** Apply the media as the page background (null/kind-null removes it). */
		function applyBackground(media, opacity) {
			const style = ensureBgStyle();
			const existingVideo = document.getElementById(BG_VIDEO_ID);
			if (media === null || media.kind === null || media.url === null) {
				existingVideo?.remove();
				style.textContent = "";
				return;
			}
			const o = (typeof opacity === "number" ? opacity : 60) / 100;
			const base = readCanvasBase();
			if (media.kind === "video") {
				let v = existingVideo;
				if (v === null) {
					v = document.createElement("video");
					v.id = BG_VIDEO_ID;
					v.autoplay = true;
					v.muted = true;
					v.loop = true;
					v.playsInline = true;
					v.setAttribute("aria-hidden", "true");
					document.body.insertBefore(v, document.body.firstChild);
				}
				v.src = media.url;
				v.style.opacity = String(o);
				style.textContent = `html{background-color:${base}!important}body::before{background-image:none!important;opacity:0!important}body{--dsw-alias-bg-base:transparent!important;--dsw-specific-sidebar-fill:transparent!important}`;
				return;
			}
			existingVideo?.remove();
			style.textContent = `html{background-color:${base}!important}body::before{content:""!important;position:fixed!important;inset:0!important;z-index:0!important;pointer-events:none!important;background:url(${JSON.stringify(media.url)}) center/cover no-repeat!important;opacity:${o}!important}body{--dsw-alias-bg-base:transparent!important;--dsw-specific-sidebar-fill:transparent!important}`;
		}
		/** Shared background state consumed by the settings section (useSyncExternalStore). */
		const bgStore = (() => {
			let state = { kind: null, url: null, name: null, opacity: 60 };
			const subs = /* @__PURE__ */ new Set();
			return {
				getSnapshot: () => state,
				subscribe: (fn) => {
					subs.add(fn);
					return () => {
						subs.delete(fn);
					};
				},
				update: (next) => {
					state = next;
					for (const fn of [...subs]) fn();
				}
			};
		})();
		/** Restore the persisted background once at boot (async, idempotent). */
		let bgRestoreStarted = false;
		function restoreBackground() {
			if (bgRestoreStarted) return;
			bgRestoreStarted = true;
			try {
				const kind = cfg.bgKind === "video" ? "video" : cfg.bgKind === "image" ? "image" : null;
				const url = bgUrl();
				if (kind === null || url === null) return;
				const opacity = typeof cfg.bgOpacity === "number" ? cfg.bgOpacity : 60;
				bgStore.update({ kind, url, name: typeof cfg.bgName === "string" && cfg.bgName !== "" ? cfg.bgName : null, opacity });
				applyBackground({ kind, url }, opacity);
			} catch {}
		}

		// ---- hover CSS inspector (design aid) ----
		const INSP_ROOT_ID = "dsh-inspector-root";
		const INSP_OUTLINE_ID = "dsh-inspector-outline";
		const INSP_PANEL_ID = "dsh-inspector-panel";
		const INSP_BADGE_ID = "dsh-inspector-badge";
		function readInspFlag() {
			return cfg.inspector === true;
		}
		function writeInspFlag(on) {
			patchCfg({ inspector: on === true });
		}
		/** True for computed values that just restate the UA default (skipped when copying). */
		function isTrivial(key, v) {
			v = String(v ?? "").trim();
			if (v === "") return true;
			switch (key) {
				case "color": case "display": case "position": case "font-family": case "font-size":
					return false;
				case "width": case "height":
					return v === "auto" || v === "0" || v === "0px";
				case "margin": case "padding":
					return /^(0px\s*)+$/.test(v);
				case "border":
					return /^0px\s/.test(v);
				case "border-radius":
					return v === "0px";
				case "opacity":
					return v === "1";
				case "z-index":
					return v === "auto" || v === "0";
				case "overflow":
					return v === "visible";
				case "background-color":
					return v === "transparent" || v === "rgba(0, 0, 0, 0)";
				case "background-image":
					return v === "none";
				case "box-shadow": case "transform": case "backdrop-filter":
					return v === "none";
				case "transition":
					return /^all 0s/.test(v);
				case "font-weight":
					return v === "400" || v === "normal";
				case "line-height":
					return v === "normal";
				case "letter-spacing":
					return v === "normal";
				case "text-align":
					return v === "start" || v === "left";
				case "text-decoration":
					return v.startsWith("none");
				case "white-space":
					return v === "normal";
				case "cursor":
					return v === "auto";
				case "gap":
					return v === "normal" || v === "0px";
				case "flex":
					return v === "0 1 auto";
				case "flex-direction":
					return v === "row";
				case "align-items":
					return v === "normal" || v === "stretch";
				case "justify-content":
					return v === "normal" || v === "flex-start";
				default:
					return false;
			}
		}
		/**
		 * The inspector singleton. Plain DOM — no React — so it keeps working
		 * outside the settings modal. Toggle via the settings switch; persisted
		 * by the host (`css-inject` settings namespace).
		 */
		const insp = (() => {
			let enabled = false;
			let pinned = null;
			let current = null;
			let root = null;
			let outline = null;
			let panel = null;
			let x = 0;
			let y = 0;
			let raf = 0;
			let inited = false;

			const PROPS = [
				{ g: "布局", items: ["display", "position", "width", "height", "box-sizing", "overflow", "z-index", "flex", "flex-direction", "align-items", "justify-content", "gap"] },
				{ g: "间距 / 边框", items: ["margin", "padding", "border", "border-radius"] },
				{ g: "文字", items: ["color", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "text-decoration", "white-space"] },
				{ g: "视觉", items: ["background-color", "background-image", "box-shadow", "backdrop-filter", "opacity", "transform", "transition", "cursor"] }
			];

			function escapeCss(s) {
				if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
				return String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
			}
			/** Short tag#id.class tag for the panel header. */
			function describe(el) {
				let s = el.tagName.toLowerCase();
				if (el.id) s += "#" + el.id;
				const cls = Array.from(el.classList || []).slice(0, 3).map((c) => "." + escapeCss(c)).join("");
				s += cls;
				if (el.classList && el.classList.length > 3) s += "…";
				return s;
			}
			/** Unique-ish selector path (id wins, then classes, then nth-of-type). */
			function buildSelector(el) {
				const parts = [];
				let node = el;
				while (node && node.nodeType === 1 && parts.length < 8) {
					let part = node.tagName.toLowerCase();
					if (node.id) {
						part += "#" + escapeCss(node.id);
						parts.unshift(part);
						break;
					}
					const cls = Array.from(node.classList || []).slice(0, 2).map((c) => "." + escapeCss(c)).join("");
					if (cls) part += cls;
					const parent = node.parentElement;
					if (parent) {
						const same = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
						if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
					}
					parts.unshift(part);
					node = parent;
				}
				return parts.join(" > ");
			}
			/** Same-origin rules that match the element (capped; skips our own). */
			function collectRules(el) {
				const out = [];
				for (const sheet of document.styleSheets) {
					let rules;
					try { rules = sheet.cssRules; } catch { continue; }
					if (!rules) continue;
					for (const rule of rules) {
						if (rule.type !== 1) continue;
						const sel = rule.selectorText;
						if (!sel || sel.includes("#" + INSP_ROOT_ID) || sel.includes("#" + INSP_OUTLINE_ID) || sel.includes("#" + INSP_PANEL_ID)) continue;
						try {
							if (el.matches(sel)) out.push({ selector: sel, css: rule.cssText });
						} catch {}
						if (out.length >= 12) break;
					}
					if (out.length >= 12) break;
				}
				return out;
			}
			function targetInfo(el) {
				const cs = window.getComputedStyle(el);
				const groups = PROPS.map(({ g, items }) => ({
					g,
					rows: items.map((key) => {
						let v = "";
						try { v = cs.getPropertyValue(key).trim(); } catch {}
						return { key, v, trivial: isTrivial(key, v) };
					})
				}));
				return {
					el,
					groups,
					rules: collectRules(el),
					inline: el.getAttribute("style") || "",
					selector: buildSelector(el),
					tag: describe(el)
				};
			}
			function cssSnippet(info) {
				const lines = [];
				for (const grp of info.groups) {
					for (const row of grp.rows) {
						if (row.trivial) continue;
						lines.push(`${row.key}:${row.v};`);
					}
				}
				return `/* ${info.selector} */\n${lines.join("\n")}`;
			}
			function rulesText(info) {
				if (info.rules.length === 0) return `/* ${info.selector} */\n/* 无匹配规则 */`;
				return info.rules.map((r) => r.css).join("\n");
			}
			function copyText(text, btn) {
				const done = () => {
					if (!btn) return;
					const old = btn.textContent;
					btn.textContent = "✓ 已复制";
					setTimeout(() => { btn.textContent = old; }, 900);
				};
				if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
					navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
				} else {
					fallbackCopy(text, done);
				}
			}
			function fallbackCopy(text, done) {
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				try { document.execCommand("copy"); } catch {}
				ta.remove();
				done();
			}
			function ensure() {
				if (root !== null) return;
				const existing = document.getElementById(INSP_ROOT_ID);
				if (existing !== null) {
					root = existing;
					outline = document.getElementById(INSP_OUTLINE_ID);
					panel = document.getElementById(INSP_PANEL_ID);
					if (panel !== null && !panel.__dshInspBound) {
						panel.addEventListener("mousedown", (e) => e.stopPropagation());
						panel.addEventListener("click", onPanelClick);
						panel.__dshInspBound = true;
					}
					const headEl = panel?.querySelector(".dshInsp_head");
					if (headEl && !headEl.__dshInspDragBound) {
						headEl.addEventListener("mousedown", startDrag);
						headEl.__dshInspDragBound = true;
					}
					return;
				}
				root = document.createElement("div");
				root.id = INSP_ROOT_ID;
				outline = document.createElement("div");
				outline.id = INSP_OUTLINE_ID;
				panel = document.createElement("div");
				panel.id = INSP_PANEL_ID;
				panel.innerHTML = [
					'<div class="dshInsp_head"><div class="dshInsp_tag"></div><div class="dshInsp_headBtns"><button type="button" class="dshInsp_btn dshInsp_collapse" data-action="collapse">收起</button><button type="button" class="dshInsp_btn dshInsp_pin" data-action="pin">固定</button></div></div>',
					'<div class="dshInsp_hint" hidden></div>',
					'<div class="dshInsp_body">',
					'<div class="dshInsp_sel"><code></code></div>',
					'<div class="dshInsp_sect">计算样式</div>',
					'<div class="dshInsp_groups"></div>',
					'<div class="dshInsp_sect">匹配的 CSS 规则</div>',
					'<div class="dshInsp_rules"></div>',
					'<div class="dshInsp_inlineWrap"><div class="dshInsp_sect">行内样式</div><div class="dshInsp_inline"></div></div>',
					'<div class="dshInsp_actions"><button type="button" class="dshInsp_btn" data-action="copy-sel">复制选择器</button><button type="button" class="dshInsp_btn" data-action="copy-css">复制 CSS</button><button type="button" class="dshInsp_btn" data-action="copy-rules">复制规则</button></div>',
					'<div class="dshInsp_foot"><span>点击元素固定 · Esc 取消固定 · 拖动标题栏移动面板</span><button type="button" class="dshInsp_btn dshInsp_off" data-action="off">关闭检查器</button></div>',
					'</div>'
				].join("");
				panel.addEventListener("mousedown", (e) => e.stopPropagation());
				panel.addEventListener("click", onPanelClick);
				panel.__dshInspBound = true;
				const headEl = panel.querySelector(".dshInsp_head");
				headEl.addEventListener("mousedown", startDrag);
				try {
					if (typeof cfg.inspectorLeft === "string" && cfg.inspectorLeft !== "") {
						panel.style.left = cfg.inspectorLeft;
						panel.style.top = cfg.inspectorTop;
						panel.style.right = "auto";
					}
				} catch {}
				const badge = document.createElement("div");
				badge.id = INSP_BADGE_ID;
				badge.textContent = "CSS 检查器已开启";
				root.append(outline, panel, badge);
				document.documentElement.appendChild(root);
			}
			function showBadge(on) {
				const b = document.getElementById(INSP_BADGE_ID);
				if (b !== null) b.dataset.on = on ? "1" : "0";
			}
			function placeOutline(el) {
				if (outline === null) return;
				const r = el.getBoundingClientRect();
				outline.style.display = "block";
				outline.style.left = r.left + "px";
				outline.style.top = r.top + "px";
				outline.style.width = r.width + "px";
				outline.style.height = r.height + "px";
			}
			/** Drag the panel by its header; position is remembered. */
			let dragState = null;
			let collapsed = false;
			function startDrag(ev) {
				if (panel === null || ev.target.closest("button")) return;
				const rect = panel.getBoundingClientRect();
				dragState = { startX: ev.clientX, startY: ev.clientY, origLeft: rect.left, origTop: rect.top };
				document.addEventListener("mousemove", onDragMove);
				document.addEventListener("mouseup", endDrag);
				ev.preventDefault();
			}
			function onDragMove(ev) {
				if (dragState === null || panel === null) return;
				const left = Math.max(8, Math.min(dragState.origLeft + (ev.clientX - dragState.startX), window.innerWidth - panel.offsetWidth - 8));
				const top = Math.max(8, Math.min(dragState.origTop + (ev.clientY - dragState.startY), window.innerHeight - 48));
				panel.style.left = left + "px";
				panel.style.top = top + "px";
				panel.style.right = "auto";
			}
			function endDrag() {
				if (dragState !== null && panel !== null) {
					try {
						patchCfg({ inspectorLeft: panel.style.left, inspectorTop: panel.style.top });
					} catch {}
				}
				dragState = null;
				document.removeEventListener("mousemove", onDragMove);
				document.removeEventListener("mouseup", endDrag);
			}
			/** Show a message in the panel (used before the first hover). */
			function showHint(text) {
				if (panel === null) return;
				panel.style.display = "block";
				const hint = panel.querySelector(".dshInsp_hint");
				const body = panel.querySelector(".dshInsp_body");
				hint.textContent = text;
				hint.hidden = false;
				body.style.display = "none";
			}
			/** Collapse / expand the panel body (header stays). */
			function toggleCollapse() {
				if (panel === null) return;
				collapsed = !collapsed;
				const body = panel.querySelector(".dshInsp_body");
				const btn = panel.querySelector(".dshInsp_collapse");
				body.style.display = collapsed ? "none" : "";
				btn.textContent = collapsed ? "展开" : "收起";
			}
			function render(info) {
				if (panel === null) return;
				panel.style.display = "block";
				panel.querySelector(".dshInsp_hint").hidden = true;
				panel.querySelector(".dshInsp_body").style.display = "";
				const tagEl = panel.querySelector(".dshInsp_tag");
				tagEl.textContent = info.tag;
				tagEl.title = info.selector;
				const pinBtn = panel.querySelector(".dshInsp_pin");
				pinBtn.textContent = pinned ? "取消固定" : "固定";
				pinBtn.classList.toggle("dshInsp_btn_on", pinned !== null);
				panel.querySelector(".dshInsp_sel code").textContent = info.selector;
				const groupsEl = panel.querySelector(".dshInsp_groups");
				groupsEl.innerHTML = "";
				for (const grp of info.groups) {
					const gEl = document.createElement("div");
					gEl.className = "dshInsp_grp";
					const title = document.createElement("div");
					title.className = "dshInsp_grpTitle";
					title.textContent = grp.g;
					gEl.appendChild(title);
					for (const row of grp.rows) {
						const rEl = document.createElement("div");
						rEl.className = "dshInsp_row" + (row.trivial ? " dshInsp_dim" : "");
						const k = document.createElement("span");
						k.className = "dshInsp_k";
						k.textContent = row.key;
						const v = document.createElement("span");
						v.className = "dshInsp_v";
						v.textContent = row.v || "—";
						rEl.append(k, v);
						gEl.appendChild(rEl);
					}
					groupsEl.appendChild(gEl);
				}
				const rulesEl = panel.querySelector(".dshInsp_rules");
				rulesEl.innerHTML = "";
				if (info.rules.length === 0) {
					const p = document.createElement("div");
					p.className = "dshInsp_none";
					p.textContent = "（无匹配的 CSS 规则）";
					rulesEl.appendChild(p);
				} else {
					for (const r of info.rules) {
						const d = document.createElement("div");
						d.className = "dshInsp_rule";
						d.textContent = r.css;
						d.title = r.selector;
						rulesEl.appendChild(d);
					}
				}
				const inlWrap = panel.querySelector(".dshInsp_inlineWrap");
				const inl = panel.querySelector(".dshInsp_inline");
				inlWrap.style.display = info.inline ? "" : "none";
				inl.textContent = info.inline;
			}
			function pick(cx, cy) {
				const t = document.elementFromPoint(cx, cy);
				const target = t && typeof t.closest === "function" && t.closest("#" + INSP_ROOT_ID) ? null : t;
				if (!target || target.nodeType !== 1) return;
				if (target === current) {
					placeOutline(current);
					return;
				}
				current = target;
				render(targetInfo(target));
				placeOutline(target);
			}
			function onMove(ev) {
				if (!enabled) return;
				x = ev.clientX;
				y = ev.clientY;
				if (pinned !== null) return;
				if (raf) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					pick(x, y);
				});
			}
			function onClick(ev) {
				if (!enabled) return;
				const t = ev.target;
				if (t && typeof t.closest === "function" && t.closest("#" + INSP_ROOT_ID)) return;
				const target = document.elementFromPoint(ev.clientX, ev.clientY);
				if (!target || target.nodeType !== 1 || (typeof target.closest === "function" && target.closest("#" + INSP_ROOT_ID))) return;
				pinned = target === pinned ? null : target;
				current = target;
				render(targetInfo(target));
				placeOutline(target);
			}
			function onKey(ev) {
				if (!enabled) return;
				if (ev.key === "Escape" && pinned !== null) {
					pinned = null;
					if (current !== null) render(targetInfo(current));
				}
			}
			function onScroll() {
				if (!enabled || raf) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					if (pinned !== null) {
						if (current !== null) placeOutline(current);
					} else {
						pick(x, y);
					}
				});
			}
			function onPanelClick(ev) {
				const btn = ev.target.closest("button[data-action]");
				if (!btn) return;
				const action = btn.dataset.action;
				const info = current !== null ? targetInfo(current) : null;
				if (action === "collapse") {
					toggleCollapse();
				} else if (action === "pin") {
					pinned = pinned !== null ? null : current;
					if (current !== null) {
						render(targetInfo(current));
						placeOutline(current);
					}
				} else if (action === "copy-sel" && info) {
					copyText(info.selector, btn);
				} else if (action === "copy-css" && info) {
					copyText(cssSnippet(info), btn);
				} else if (action === "copy-rules" && info) {
					copyText(rulesText(info), btn);
				} else if (action === "off") {
					setEnabled(false);
				}
			}
			function setEnabled(on) {
				enabled = !!on;
				if (enabled) {
					ensure();
					showBadge(true);
					pinned = null;
					current = null;
					collapsed = false;
					const cBtn = panel?.querySelector(".dshInsp_collapse");
					if (cBtn !== null && cBtn !== void 0) cBtn.textContent = "收起";
					showHint("已开启：移动鼠标到任意元素，即可查看它的 CSS 设定信息");
				} else {
					if (root !== null) root.remove();
					root = outline = panel = null;
					pinned = null;
					current = null;
					dragState = null;
				}
				writeInspFlag(enabled);
			}
			function init() {
				if (inited) return;
				inited = true;
				document.addEventListener("mousemove", onMove, { passive: true });
				document.addEventListener("click", onClick, true);
				document.addEventListener("keydown", onKey, true);
				window.addEventListener("resize", onScroll, { passive: true });
				document.addEventListener("scroll", onScroll, { capture: true, passive: true });
				if (readInspFlag()) setEnabled(true);
			}
			return { init, setEnabled, isOn: () => enabled };
		})();

		// ---- native <select> beautifier (replaces the OS white popup) ----
		// Native select popups are rendered by the browser/OS, not the page, so
		// CSS can never touch them (and the inspector cannot see them). When on,
		// every <select> gets a themed custom popup instead; the popup background
		// follows --dsh-select-popup-bg (set it to transparent in custom CSS).
		const SEL_POPUP_ID = "dsh-select-popup";
		function readSelFlag() {
			return cfg.selectBeautify === true;
		}
		function writeSelFlag(on) {
			patchCfg({ selectBeautify: on === true });
		}
		const selBeautify = (() => {
			let on = false;
			let popup = null;
			let activeSelect = null;
			let observer = null;
			let inited = false;
			let highlight = -1;

			function onMousedown(ev) {
				ev.preventDefault(); // keeps the native popup from opening
			}
			function onClick(ev) {
				ev.stopPropagation();
				const sel = ev.currentTarget;
				if (activeSelect === sel) {
					close(); // clicking the open select toggles it shut
				} else {
					open(sel);
				}
			}
			function onKeydown(ev) {
				const sel = ev.currentTarget;
				if (activeSelect === sel) {
					const k = ev.key;
					if (k === "ArrowDown" || k === "ArrowUp") {
						ev.preventDefault();
						moveHighlight(k === "ArrowDown" ? 1 : -1);
					} else if (k === "Enter") {
						ev.preventDefault();
						if (highlight >= 0) choose(highlight);
					} else if (k === "Escape") {
						ev.preventDefault();
						close();
					}
					return;
				}
				if (ev.key === "ArrowDown" || ev.key === "ArrowUp" || ev.key === "Enter" || ev.key === " ") {
					ev.preventDefault();
					open(sel);
				}
			}
			function buildPopup() {
				if (popup === null) {
					popup = document.createElement("div");
					popup.id = SEL_POPUP_ID;
					popup.addEventListener("click", (e) => {
						const opt = e.target && typeof e.target.closest === "function" ? e.target.closest(".dshSelectOpt") : null;
						if (!opt) return;
						choose(Number(opt.dataset.idx));
					});
					document.documentElement.appendChild(popup);
				}
				return popup;
			}
			function choose(idx) {
				const sel = activeSelect;
				if (sel === null || !sel.options || !sel.options[idx] || sel.options[idx].disabled) return;
				sel.value = sel.options[idx].value;
				sel.dispatchEvent(new Event("change", { bubbles: true }));
				sel.dispatchEvent(new Event("input", { bubbles: true }));
				close();
			}
			function open(sel) {
				const opts = Array.from(sel.options || []);
				if (opts.length === 0) return;
				const p = buildPopup();
				activeSelect = sel;
				highlight = sel.selectedIndex;
				p.innerHTML = "";
				opts.forEach((o, i) => {
					const d = document.createElement("div");
					d.className = "dshSelectOpt" + (o.selected ? " sel" : "") + (i === highlight ? " hl" : "");
					d.textContent = o.text;
					d.dataset.idx = String(i);
					if (o.disabled) d.setAttribute("disabled", "1");
					p.appendChild(d);
				});
				const r = sel.getBoundingClientRect();
				p.style.left = r.left + "px";
				p.style.top = r.bottom + 4 + "px";
				p.style.display = "block";
				const ph = p.offsetHeight;
				const pw = p.offsetWidth;
				if (r.bottom + 4 + ph > window.innerHeight - 8) p.style.top = Math.max(8, r.top - ph - 4) + "px";
				if (r.left + pw > window.innerWidth - 8) p.style.left = Math.max(8, window.innerWidth - pw - 8) + "px";
			}
			function moveHighlight(dir) {
				const sel = activeSelect;
				if (sel === null || popup === null) return;
				const opts = Array.from(sel.options || []);
				if (opts.length === 0) return;
				let i = highlight;
				for (let step = 0; step < opts.length; step++) {
					i = (i + dir + opts.length) % opts.length;
					if (!opts[i].disabled) break;
				}
				highlight = i;
				popup.querySelectorAll(".dshSelectOpt").forEach((d, idx) => {
					d.classList.toggle("hl", idx === highlight);
				});
				scrollHighlightIntoView();
			}
			function scrollHighlightIntoView() {
				if (popup === null || highlight < 0) return;
				const el = popup.querySelector('.dshSelectOpt[data-idx="' + highlight + '"]');
				if (el) el.scrollIntoView({ block: "nearest" });
			}
			function close() {
				if (popup !== null) popup.style.display = "none";
				activeSelect = null;
				highlight = -1;
			}
			function onDocClick(ev) {
				if (activeSelect === null) return;
				const t = ev.target;
				if (t && typeof t.closest === "function") {
					if (t.closest("#" + SEL_POPUP_ID)) return; // popup option clicks
					if (t.closest("select")) return; // a select's own handler toggles/switches
				}
				close();
			}
			function onDocScroll(ev) {
				if (activeSelect === null) return;
				const t = ev.target;
				// window/document/body scrolls are app-level (e.g. focus side-effects):
				// never close for those. Only a real scrollable container that holds
				// the select (like the settings modal) closes the popup.
				if (!t || t === document || t === window || t === document.body || t === document.documentElement) return;
				if (typeof t.closest === "function" && t.closest("#" + SEL_POPUP_ID)) return; // scrolling inside the popup is allowed
				if (t.nodeType === 1 && t.contains(activeSelect)) close();
			}
			function decorate(sel) {
				if (sel.dataset.dshSelect === "1") return;
				if (sel.multiple || sel.size > 1 || sel.disabled) return;
				if (!on) {
					sel.dataset.dshSelect = "0";
					return;
				}
				sel.dataset.dshSelect = "1";
				sel.classList.add("dshSelect");
				sel.addEventListener("mousedown", onMousedown);
				sel.addEventListener("click", onClick);
				sel.addEventListener("keydown", onKeydown);
			}
			function undecorate(sel) {
				if (sel.dataset.dshSelect !== "1") return;
				sel.classList.remove("dshSelect");
				sel.removeEventListener("mousedown", onMousedown);
				sel.removeEventListener("click", onClick);
				sel.removeEventListener("keydown", onKeydown);
				sel.dataset.dshSelect = "0";
			}
			function scan() {
				if (activeSelect !== null && !activeSelect.isConnected) close();
				document.querySelectorAll("select").forEach(decorate);
			}
			function setEnabled(next) {
				on = !!next;
				writeSelFlag(on);
				if (on) {
					if (observer === null) {
						observer = new MutationObserver(() => scan());
						observer.observe(document.documentElement, { childList: true, subtree: true });
					}
					scan();
				} else {
					close();
					document.querySelectorAll("select").forEach(undecorate);
					if (observer !== null) {
						observer.disconnect();
						observer = null;
					}
				}
			}
			function init() {
				if (inited) return;
				inited = true;
				document.addEventListener("click", onDocClick, true);
				document.addEventListener("scroll", onDocScroll, { capture: true, passive: true });
				window.addEventListener("resize", onDocScroll, { passive: true });
				if (readSelFlag()) setEnabled(true);
			}
			return { init, setEnabled, isOn: () => on };
		})();

		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"nav": "自定义 CSS",
			"hint": "在这里粘贴自定义 CSS，保存后立即应用到整个界面（无需刷新页面）。",
			"placeholder": "/* 示例：把背景图透明度改为 40% */\nbody::before { opacity: 0.4; }\n\n/* 示例：用稳定选择器（[data-*] 属性）改会话滚动区 */\n[data-conversation-scroll] { scrollbar-width: thin; }",
			"save": "保存并应用",
			"undo": "撤销",
			"redo": "重做",
			"clear": "清空",
			"saved": "已保存并生效",
			"cleared": "已清空",
			"error": "保存失败",
			"bg.nav": "自定义背景",
			"bg.hint": "上传一张图片或一段视频作为整个界面的背景，用滑块调整不透明度（1–100），改动即时生效。",
			"bg.upload": "上传图片 / 视频",
			"bg.remove": "移除背景",
			"bg.none": "未设置自定义背景（当前显示内置背景）",
			"bg.saved": "背景已更新",
			"bg.error": "背景设置失败",
			"insp.title": "悬停 CSS 检查器（设计辅助）",
			"insp.on": "已开启：鼠标移到任意元素即显示该元素的 CSS 设定信息；点击元素可固定面板。",
			"insp.off": "已关闭：开启后，把鼠标移到界面的任意位置，就会显示那个位置对应元素的 CSS 代码设定信息，方便你设计 UI。",
			"sel.title": "下拉框美化（去掉原生白色弹层）",
			"sel.on": "已开启：模型/服务商等原生下拉框改用贴合主题的深色自定义弹层；弹层背景由 --dsh-select-popup-bg 控制（设为 transparent 即透明）。",
			"sel.off": "已关闭：开启后，原生下拉框不再弹出系统白色弹层，而是深色主题列表，可配合自定义 CSS 调成透明。"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"nav": "Custom CSS",
			"hint": "Paste custom CSS here. Saved CSS is applied to the whole UI immediately (no refresh needed).",
			"placeholder": "/* e.g. wallpaper opacity to 40% */\nbody::before { opacity: 0.4; }",
			"save": "Save & Apply",
			"undo": "Undo",
			"redo": "Redo",
			"clear": "Clear",
			"saved": "Saved & applied",
			"cleared": "Cleared",
			"error": "Save failed",
			"bg.nav": "Custom Background",
			"bg.hint": "Upload an image or video as the page background and tune its opacity (1-100) with the slider. Changes apply instantly.",
			"bg.upload": "Upload image / video",
			"bg.remove": "Remove background",
			"bg.none": "No custom background (built-in background shown)",
			"bg.saved": "Background updated",
			"bg.error": "Background update failed",
			"insp.title": "Hover CSS Inspector (design aid)",
			"insp.on": "On: hovering any element shows its CSS info; click an element to pin the panel.",
			"insp.off": "Off: once enabled, hovering anywhere in the UI shows the CSS settings of the element under the cursor — handy for designing UI.",
			"sel.title": "Select beautifier (replace native white popup)",
			"sel.on": "On: native selects use a themed dark popup; its background follows --dsh-select-popup-bg (transparent works).",
			"sel.off": "Off: once enabled, native selects no longer open the OS white popup — they get a themed list you can tune via custom CSS."
		};

		/** Shared settings switch row: label + description + on/off toggle. */
		function SwitchRow({ t, on, onToggle, titleKey, descKey }) {
			return jsxs("div", {
				className: "uCss_inspRow",
				children: [
					jsx("button", {
						type: "button",
						role: "switch",
						"aria-checked": on ? "true" : "false",
						className: "uCss_switch" + (on ? " uCss_switch_on" : ""),
						onClick: onToggle,
						children: jsx("span", { className: "uCss_knob" })
					}),
					jsxs("div", {
						className: "uCss_inspText",
						children: [
							jsx("div", { className: "uCss_inspTitle", children: t(titleKey) }),
							jsx("div", { className: "uCss_inspDesc", children: t(descKey) })
						]
					})
				]
			});
		}
		/**
		 * Inspector on/off switch shown at the top of the Custom CSS section.
		 * State lives in the `insp` singleton (host-persisted) so it keeps
		 * working after the settings panel closes.
		 * @param props - composed slot props (locale `t`).
		 */
		function InspectorToggle({ t }) {
			const [on, setOn] = react.useState(() => insp.isOn());
			const toggle = () => {
				const next = !insp.isOn();
				insp.setEnabled(next);
				setOn(next);
			};
			return jsx(SwitchRow, {
				t,
				on,
				onToggle: toggle,
				titleKey: "insp.title",
				descKey: on ? "insp.on" : "insp.off"
			});
		}
		/**
		 * Select-beautifier on/off switch: replaces native (OS-rendered, white)
		 * select popups with themed custom ones.
		 * @param props - composed slot props (locale `t`).
		 */
		function SelectToggle({ t }) {
			const [on, setOn] = react.useState(() => selBeautify.isOn());
			const toggle = () => {
				const next = !selBeautify.isOn();
				selBeautify.setEnabled(next);
				setOn(next);
			};
			return jsx(SwitchRow, {
				t,
				on,
				onToggle: toggle,
				titleKey: "sel.title",
				descKey: on ? "sel.on" : "sel.off"
			});
		}

		/**
		 * Custom CSS section: textarea with save, undo/redo toolbar, and a
		 * de-emphasized clear button in the bottom-right footer.
		 * @param props - composed slot props (locale `t` from the registration).
		 */
		function CssSection({ t }) {
			const [hist, setHist] = react.useState(() => ({ stack: [readSaved()], idx: 0 }));
			const [status, setStatus] = react.useState("idle");
			const value = hist.stack[hist.idx];
			const canUndo = hist.idx > 0;
			const canRedo = hist.idx < hist.stack.length - 1;
			/* A hydrate that lands after this section mounted still fills an
			   untouched editor; edits are never overwritten. */
			react.useEffect(() => {
				const sync = () => {
					const persisted = readSaved();
					setHist((h) => {
						const pristine = h.stack.length === 1 && h.idx === 0;
						return pristine && h.stack[0] !== persisted ? { stack: [persisted], idx: 0 } : h;
					});
				};
				sync();
				cfgSubs.add(sync);
				return () => {
					cfgSubs.delete(sync);
				};
			}, []);
			const edit = (next) => {
				setStatus("idle");
				setHist((h) => {
					const stack = h.stack.slice(0, h.idx + 1);
					stack.push(next);
					if (stack.length > 100) stack.shift();
					return { stack, idx: Math.min(h.idx + 1, 99) };
				});
			};
			const undo = () => {
				setHist((h) => ({ stack: h.stack, idx: Math.max(0, h.idx - 1) }));
			};
			const redo = () => {
				setHist((h) => ({ stack: h.stack, idx: Math.min(h.stack.length - 1, h.idx + 1) }));
			};
			const save = () => {
				try {
					applyCss(value);
					patchCfg({ css: value });
					setStatus("saved");
				} catch {
					setStatus("error");
				}
			};
			const clear = () => {
				setHist({ stack: [""], idx: 0 });
				try {
					applyCss("");
					patchCfg({ css: "" });
					setStatus("cleared");
				} catch {
					setStatus("error");
				}
			};
			return jsxs("div", {
				className: "uCss_section",
				children: [
					jsx(InspectorToggle, { t }),
					jsx(SelectToggle, { t }),
					jsx("p", { className: "uCss_hint", children: t("hint") }),
					jsx("textarea", {
						className: "uCss_area",
						value,
						spellCheck: false,
						placeholder: t("placeholder"),
						onChange: (event) => {
							edit(event.target.value);
						}
					}),
					jsxs("div", {
						className: "uCss_actions",
						children: [
							jsx("button", { type: "button", className: "uCss_primary", onClick: save, children: t("save") }),
							jsx("button", { type: "button", className: "uCss_ghost", onClick: undo, disabled: !canUndo, children: t("undo") }),
							jsx("button", { type: "button", className: "uCss_ghost", onClick: redo, disabled: !canRedo, children: t("redo") }),
							status !== "idle" && jsx("span", {
								className: "uCss_status",
								"data-error": status === "error" ? "true" : void 0,
								children: t(status)
							})
						]
					}),
					jsx("div", {
						className: "uCss_footer",
						children: jsx("button", { type: "button", className: "uCss_clear", onClick: clear, children: t("clear") })
					})
				]
			});
		}

		/**
		 * Custom background section: upload (image/video) + opacity slider
		 * (1-100, live) + a muted remove action in the footer.
		 * @param props - composed slot props (locale `t` from the registration).
		 */
		function BackgroundSection({ t }) {
			const snap = react.useSyncExternalStore(bgStore.subscribe, bgStore.getSnapshot);
			const { kind, name, opacity } = snap;
			const [status, setStatus] = react.useState("idle");
			const inputRef = react.useRef(null);
			const onPick = async (event) => {
				const file = event.target.files?.[0];
				event.target.value = "";
				if (file === void 0) return;
				const nextKind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
				if (nextKind === null) {
					setStatus("error");
					return;
				}
				try {
					/* The host stores the bytes and serves them back; the page keeps
					   no blob URL, so nothing depends on this origin. */
					const qs = "?kind=" + nextKind + "&name=" + encodeURIComponent(file.name);
					const r = await fetch(BG_URL + qs, {
						method: "POST",
						headers: { "content-type": file.type || "application/octet-stream" },
						body: file
					});
					if (!r.ok) throw new Error("upload failed");
					const cfgNext = await r.json();
					bgRev += 1;
					cfg = { ...cfg, ...cfgNext };
					emitCfg();
					const url = bgUrl();
					const opacity = typeof cfg.bgOpacity === "number" ? cfg.bgOpacity : 60;
					applyBackground({ kind: nextKind, url }, opacity);
					bgStore.update({ kind: nextKind, url, name: file.name, opacity });
					setStatus("saved");
				} catch {
					setStatus("error");
				}
			};
			const onOpacity = (event) => {
				const next = Number(event.target.value);
				const current = bgStore.getSnapshot();
				bgStore.update({ ...current, opacity: next });
				applyBackground(current.kind === null || current.url === null ? null : { kind: current.kind, url: current.url }, next);
				patchCfg({ bgOpacity: next });
			};
			const remove = async () => {
				const current = bgStore.getSnapshot();
				applyBackground(null, current.opacity);
				bgStore.update({ kind: null, url: null, name: null, opacity: current.opacity });
				try {
					const r = await fetch(BG_URL, { method: "DELETE" });
					if (!r.ok) throw new Error("delete failed");
					const cfgNext = await r.json();
					cfg = { ...cfg, ...cfgNext };
					emitCfg();
					setStatus("cleared");
				} catch {
					setStatus("error");
				}
			};
			return jsxs("div", {
				className: "uBg_section",
				children: [
					jsx("p", { className: "uCss_hint", children: t("bg.hint") }),
					jsxs("div", {
						className: "uBg_row",
						children: [
							jsx("input", {
								ref: inputRef,
								type: "file",
								accept: "image/*,video/*",
								style: { display: "none" },
								onChange: onPick
							}),
							jsx("button", {
								type: "button",
								className: "uCss_ghost",
								onClick: () => inputRef.current?.click(),
								children: t("bg.upload")
							}),
							jsx("span", { className: "uBg_file", children: name ?? t("bg.none") })
						]
					}),
					jsxs("div", {
						className: "uBg_row",
						children: [
							jsx("input", {
								type: "range",
								className: "uBg_slider",
								min: "1",
								max: "100",
								value: opacity,
								disabled: kind === null,
								onChange: onOpacity
							}),
							jsx("span", { className: "uBg_value", children: opacity + "%" })
						]
					}),
					jsxs("div", {
						className: "uCss_footer",
						children: [
							kind !== null && jsx("button", { type: "button", className: "uCss_clear", onClick: remove, children: t("bg.remove") }),
							status !== "idle" && jsx("span", {
								className: "uCss_status",
								"data-error": status === "error" ? "true" : void 0,
								children: t(status === "saved" ? "bg.saved" : status === "cleared" ? "cleared" : "bg.error")
							})
						]
					})
				]
			});
		}

		/** Required cordis services (client runner fiber inject). */
		const inject = ["slots", "locale"];
		/**
		 * Register the dictionaries, apply persisted CSS + background at boot,
		 * and add the settings sections once their slot is on the ledger.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-css-inject: dictionaries");
			const t = ctx.locale.bind(NS);
			/* Everything is host-persisted now: fetch the snapshot once, then apply
			   CSS / background / the two switches from it. */
			(async () => {
				try {
					const r = await fetch(CONFIG_URL, { headers: { accept: "application/json" } });
					if (r.ok) cfg = { ...cfg, ...(await r.json()) };
				} catch {}
				applyCss(readSaved());
				restoreBackground();
				insp.init();
				selBeautify.init();
			})();
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "user-css",
				order: 100,
				label: () => t("nav"),
				locale: NS
			}, CssSection));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "user-background",
				order: 101,
				label: () => t("bg.nav"),
				locale: NS
			}, BackgroundSection));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

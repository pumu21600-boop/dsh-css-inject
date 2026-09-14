/**
 * dsh-css-inject host half.
 *
 * Owns everything the client half used to keep in browser storage:
 *  - settings namespace `css-inject`: the custom CSS text, the inspector /
 *    select-beautify switches, the inspector panel position and the background
 *    descriptor (kind / display name / stored file name / opacity). Persisted
 *    by the official host settings provider into settings.yaml, so it survives
 *    a port or host change.
 *  - the background media bytes themselves under
 *    `$DSH_HOME/storages/dsh-css-inject/`, served back over
 *    `GET /dsh-css-inject/bg` with the right content type (settings.yaml cannot
 *    carry binary data, and a browser-side blob store is origin-bound).
 *
 * Same-origin endpoints for the client half:
 *   GET    /dsh-css-inject/config  → the whole namespace
 *   POST   /dsh-css-inject/config  → merge + persist a partial patch
 *   GET    /dsh-css-inject/bg      → the stored background media
 *   POST   /dsh-css-inject/bg      → upload raw bytes (?name=<original name>&kind=image|video)
 *   DELETE /dsh-css-inject/bg      → drop the stored media
 */
import sm from "@deepseek-ai/schemastery";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { homedir } from "node:os";

const SETTINGS_NS = "css-inject";

/** Extension → content type for stored background media. */
const MIME_BY_EXT = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".avif": "image/avif",
	".bmp": "image/bmp",
	".mp4": "video/mp4",
	".m4v": "video/x-m4v",
	".webm": "video/webm",
	".ogv": "video/ogg",
	".mov": "video/quicktime"
};

const settingsSchema = sm.object({
	css: sm.string().default(""),
	inspector: sm.boolean().default(false),
	selectBeautify: sm.boolean().default(false),
	inspectorLeft: sm.string().default(""),
	inspectorTop: sm.string().default(""),
	bgKind: sm.string().default(""),
	bgName: sm.string().default(""),
	bgFile: sm.string().default(""),
	bgOpacity: sm.number().min(1).max(100).default(60)
});

/** Flatten any stored/client payload onto the schema's shape. */
function normalizeConfig(raw) {
	const src = raw && typeof raw === "object" ? raw : {};
	const str = (v) => (typeof v === "string" ? v : "");
	const opacity = Number(src.bgOpacity);
	return {
		css: str(src.css),
		inspector: src.inspector === true,
		selectBeautify: src.selectBeautify === true,
		inspectorLeft: str(src.inspectorLeft),
		inspectorTop: str(src.inspectorTop),
		bgKind: src.bgKind === "video" || src.bgKind === "image" ? src.bgKind : "",
		bgName: str(src.bgName),
		bgFile: str(src.bgFile),
		bgOpacity: Number.isFinite(opacity) ? Math.min(100, Math.max(1, Math.round(opacity))) : 60
	};
}

function dshHome() {
	return process.env.DSH_HOME || join(homedir(), ".dsh");
}

function mediaDir() {
	return join(dshHome(), "storages", "dsh-css-inject");
}

/** Path of the one stored background file, or undefined when none is stored. */
function storedMediaPath() {
	const dir = mediaDir();
	if (!existsSync(dir)) return void 0;
	try {
		const hit = readdirSync(dir).find((entry) => entry.startsWith("bg."));
		return hit === void 0 ? void 0 : join(dir, hit);
	} catch {
		return void 0;
	}
}

function removeStoredMedia() {
	const dir = mediaDir();
	if (!existsSync(dir)) return;
	try {
		for (const entry of readdirSync(dir)) if (entry.startsWith("bg.")) rmSync(join(dir, entry), { force: true });
	} catch {
		/* a locked file is not fatal: the descriptor is cleared either way */
	}
}

/** Keep only the basename, normalize the extension, and cap its length. */
function storedFileName(originalName, fallbackExt) {
	const base = typeof originalName === "string" ? originalName.replace(/^.*[\\/]/, "") : "";
	const ext = (extname(base) || fallbackExt || ".bin").toLowerCase().slice(0, 12);
	return `bg${ext}`;
}

function sendJson(res, status, payload) {
	res.writeHead(status, { "content-type": "application/json" });
	res.end(JSON.stringify(payload));
}

function readRawBody(req, limitBytes = 64 * 1024 * 1024) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let total = 0;
		req.on("data", (chunk) => {
			total += chunk.length;
			if (total > limitBytes) {
				reject(new Error("payload too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

async function readJsonBody(req) {
	const buf = await readRawBody(req, 8 * 1024 * 1024);
	const raw = buf.toString("utf8");
	return raw ? JSON.parse(raw) : {};
}

export const inject = ["settings"];

export function apply(ctx) {
	const scope = ctx.settings.register(SETTINGS_NS, settingsSchema);
	const readConfig = () => normalizeConfig(scope.get());

	ctx.inject(["webServer"], (injected) => {
		injected.webServer.register({
			kind: "prefix",
			path: "/dsh-css-inject",
			handler: async (req, res) => {
				const url = new URL(req.url, "http://localhost");
				const action = url.pathname.split("/").filter(Boolean).pop() || "";

				if (action === "config") {
					if (req.method === "GET") {
						sendJson(res, 200, { ok: true, ...readConfig() });
						return;
					}
					if (req.method !== "POST") {
						sendJson(res, 405, { ok: false, reason: "method" });
						return;
					}
					try {
						const patch = await readJsonBody(req);
						await scope.update(normalizeConfig({ ...readConfig(), ...patch }));
						sendJson(res, 200, { ok: true, ...readConfig() });
					} catch (err) {
						sendJson(res, 400, { ok: false, reason: String((err && err.message) || err) });
					}
					return;
				}

				if (action === "bg") {
					if (req.method === "GET") {
						const file = storedMediaPath();
						if (file === void 0) {
							sendJson(res, 404, { ok: false, reason: "no-background" });
							return;
						}
						try {
							const body = readFileSync(file);
							res.writeHead(200, {
								"content-type": MIME_BY_EXT[extname(file).toLowerCase()] ?? "application/octet-stream",
								"content-length": String(body.length),
								"cache-control": "no-cache"
							});
							res.end(body);
						} catch (err) {
							sendJson(res, 500, { ok: false, reason: String((err && err.message) || err) });
						}
						return;
					}
					if (req.method === "POST") {
						try {
							const body = await readRawBody(req);
							if (body.length === 0) throw new Error("empty upload");
							const original = url.searchParams.get("name") ?? "";
							const kind = url.searchParams.get("kind") === "video" ? "video" : "image";
							const name = storedFileName(original, kind === "video" ? ".mp4" : ".png");
							mkdirSync(mediaDir(), { recursive: true });
							removeStoredMedia();
							writeFileSync(join(mediaDir(), name), body);
							await scope.update(normalizeConfig({
								...readConfig(),
								bgKind: kind,
								bgName: original || name,
								bgFile: name
							}));
							sendJson(res, 200, { ok: true, ...readConfig() });
						} catch (err) {
							sendJson(res, 400, { ok: false, reason: String((err && err.message) || err) });
						}
						return;
					}
					if (req.method === "DELETE") {
						removeStoredMedia();
						await scope.update(normalizeConfig({ ...readConfig(), bgKind: "", bgName: "", bgFile: "" }));
						sendJson(res, 200, { ok: true, ...readConfig() });
						return;
					}
					sendJson(res, 405, { ok: false, reason: "method" });
					return;
				}

				sendJson(res, 404, { ok: false, reason: "not-found" });
			}
		});
	});
}

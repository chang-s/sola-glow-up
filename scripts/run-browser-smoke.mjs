import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const host = "127.0.0.1";
const port = "4173";
const baseUrl = `http://${host}:${port}`;

function runNodeScript(scriptPath, args, options = {}) {
	return spawn(process.execPath, [scriptPath, ...args], {
		stdio: "inherit",
		windowsHide: true,
		...options
	});
}

async function waitForServer() {
	const deadline = Date.now() + 60_000;
	let lastError;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(baseUrl);
			if (response.ok) return;
		} catch (error) {
			lastError = error;
		}

		await delay(500);
	}

	throw new Error(`Timed out waiting for ${baseUrl}: ${lastError}`);
}

async function main() {
	const server = runNodeScript("node_modules/vite/bin/vite.js", [
		"preview",
		"--host",
		host,
		"--port",
		port,
		"--strictPort"
	]);

	try {
		await waitForServer();

		const testRun = runNodeScript("node_modules/@playwright/test/cli.js", [
			"test",
			"--reporter=line"
		]);

		const exitCode = await new Promise((resolve) => {
			testRun.on("exit", (code) => resolve(code ?? 1));
		});

		if (exitCode !== 0) {
			process.exitCode = exitCode;
		}
	} finally {
		server.kill("SIGTERM");
		await delay(500);
		if (!server.killed) {
			server.kill("SIGKILL");
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

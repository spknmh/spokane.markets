#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function runNpm(args, stdio = "pipe") {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    return spawnSync(process.execPath, [npmExecPath, ...args], {
      encoding: "utf8",
      stdio,
    });
  }

  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  return spawnSync(cmd, args, { encoding: "utf8", stdio });
}

function getOutdated() {
  const result = runNpm(["outdated", "--json"], "pipe");
  const stdout = (result.stdout || "").trim();
  const stderr = (result.stderr || "").trim();
  const raw = stdout || stderr;

  // npm outdated returns:
  // - exit 0 with empty output when fully up-to-date
  // - exit 1 with JSON output when outdated deps exist
  // - other non-zero with stderr on actual errors
  if (!raw && result.status === 0) return {};
  if (!raw && result.status !== 0) {
    throw new Error((stderr || "Failed to run npm outdated").trim());
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Could not parse npm outdated output: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function getDependencyKindMap() {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const depKinds = new Map();

  for (const name of Object.keys(pkg.dependencies || {})) depKinds.set(name, "prod");
  for (const name of Object.keys(pkg.devDependencies || {})) depKinds.set(name, "dev");

  return depKinds;
}

function getMajor(version) {
  const match = String(version || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function classifyUpdates(outdated, kindMap) {
  const all = Object.entries(outdated).map(([name, meta]) => {
    const current = meta.current ?? "";
    const wanted = meta.wanted ?? "";
    const latest = meta.latest ?? "";
    const kind = kindMap.get(name) ?? "prod";
    const majorBump = getMajor(latest) > getMajor(current);
    return { name, current, wanted, latest, kind, majorBump };
  });

  const safe = all.filter((u) => !u.majorBump);
  const major = all.filter((u) => u.majorBump);

  // Major upgrades for these packages are intentionally manual.
  // They frequently require coordinated config/framework changes.
  const manualMajorPackages = new Set([
    "eslint",
    "eslint-config-next",
    "next",
    "react",
    "react-dom",
    "typescript",
    "prisma",
    "@prisma/client",
    "@prisma/adapter-pg",
  ]);

  const manualMajor = major.filter((u) => manualMajorPackages.has(u.name));
  const majorAuto = major.filter((u) => !manualMajorPackages.has(u.name));
  return { all, safe, major, majorAuto, manualMajor };
}

function printGroup(title, updates) {
  if (updates.length === 0) return;
  console.log(`\n${title}`);
  for (const u of updates) {
    const scope = u.kind === "dev" ? "dev" : "prod";
    console.log(`- ${u.name} (${scope}): ${u.current} -> wanted ${u.wanted}, latest ${u.latest}`);
  }
}

async function askYesNo(rl, prompt, defaultNo = true) {
  const answer = (await rl.question(`${prompt} `)).trim().toLowerCase();
  if (!answer) return !defaultNo;
  return answer === "y" || answer === "yes";
}

function updateToLatest(majorUpdates) {
  const prod = majorUpdates.filter((u) => u.kind === "prod").map((u) => `${u.name}@latest`);
  const dev = majorUpdates.filter((u) => u.kind === "dev").map((u) => `${u.name}@latest`);

  if (prod.length > 0) {
    const prodRes = runNpm(["install", ...prod], "inherit");
    if (prodRes.status !== 0) process.exit(prodRes.status ?? 1);
  }

  if (dev.length > 0) {
    const devRes = runNpm(["install", "-D", ...dev], "inherit");
    if (devRes.status !== 0) process.exit(devRes.status ?? 1);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const autoSafe = args.has("--yes-safe");
  const autoMajor = args.has("--yes-major");

  const kindMap = getDependencyKindMap();
  const outdated = getOutdated();
  const { all, safe, major, majorAuto, manualMajor } = classifyUpdates(
    outdated,
    kindMap
  );

  if (all.length === 0) {
    console.log("All dependencies are up to date.");
    return;
  }

  console.log(`Found ${all.length} outdated package(s).`);
  printGroup("Safe updates (same major):", safe);
  printGroup("Major updates (may contain breaking changes):", major);
  printGroup(
    "Major updates that are manual-only (not auto-applied):",
    manualMajor
  );

  const rl = createInterface({ input, output });
  try {
    let applySafe = autoSafe;
    if (!autoSafe && safe.length > 0) {
      applySafe = await askYesNo(
        rl,
        "\nApply safe updates now using `npm update`? [y/N]",
        true
      );
    }

    if (applySafe) {
      const safeRes = runNpm(["update"], "inherit");
      if (safeRes.status !== 0) process.exit(safeRes.status ?? 1);
      console.log("\nApplied safe updates.");
    }

    let applyMajor = autoMajor;
    if (!autoMajor && majorAuto.length > 0) {
      applyMajor = await askYesNo(
        rl,
        "Apply auto-eligible major updates to @latest now? [y/N]",
        true
      );
    }

    if (applyMajor && majorAuto.length > 0) {
      updateToLatest(majorAuto);
      console.log("\nApplied major updates to latest.");
    }

    if (manualMajor.length > 0) {
      console.log(
        "\nSkipped manual-only major updates. Upgrade these intentionally after review."
      );
    }
  } finally {
    rl.close();
  }

  const after = classifyUpdates(getOutdated(), kindMap);
  if (after.all.length === 0) {
    console.log("\nDone. No remaining outdated packages.");
  } else {
    console.log(`\nDone. ${after.all.length} package(s) still outdated.`);
    printGroup("Remaining:", after.all);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

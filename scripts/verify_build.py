#!/usr/bin/env python3
"""
OpenMediaForge verifier.

- Required docs present
- Forbidden vendor string not present in application source
- Job/receipt surfaces avoid raw secret-like fields
- Obvious hardcoded provider API bases not present in src/
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "docs/PRODUCT_SPEC.md",
    "docs/ARCHITECTURE.md",
    "docs/PROVIDER_ADAPTER_SPEC.md",
    "docs/BYOK_KEYRAIL_SPEC.md",
    "docs/DATA_MODEL.md",
    "docs/MVP_ROADMAP.md",
    "docs/SECURITY.md",
    "docs/PROJECT_PACKET_SPEC.md",
    "docs/REFERENCE_EXECUTION_SPEC.md",
]

REQUIRED_ROUTE_FILES = [
    "src/app/page.tsx",
    "src/app/studio/page.tsx",
    "src/app/studio/image/page.tsx",
    "src/app/studio/video/page.tsx",
    "src/app/studio/edit/page.tsx",
    "src/app/studio/lipsync/page.tsx",
    "src/app/studio/storyboard/page.tsx",
    "src/app/studio/workflows/page.tsx",
    "src/app/projects/page.tsx",
    "src/app/projects/[id]/page.tsx",
    "src/app/assets/page.tsx",
    "src/app/queue/page.tsx",
    "src/app/receipts/page.tsx",
    "src/app/providers/page.tsx",
    "src/app/keys/page.tsx",
    "src/app/settings/page.tsx",
]

DOMAIN_TYPE_FILES = [
    "src/lib/assetMap/assetMapTypes.ts",
    "src/lib/referenceBudget/referenceBudgetTypes.ts",
]

FALLBACK_REQUIRED = [
    "docs/01_PRODUCT_SPEC.md",
    "docs/04_ARCHITECTURE.md",
    "docs/06_PROVIDER_ADAPTER_SPEC.md",
    "docs/07_BYOK_KEYRAIL_SPEC.md",
]

FORBIDDEN_STRINGS = [
    "muapi",
]

SECRET_FIELD_PATTERNS = [
    r"apiKey",
    r"accessToken",
    r"bearerToken",
    r"secret\s*:",
    r"password\s*:",
]

SOURCE_EXTS = {".ts", ".tsx", ".js", ".jsx"}
EXCLUDE_DIRS = {"node_modules", ".next", "dist", "build", ".git"}

IMPLEMENTATION_FILES = [
    "src/lib/providers/registry.ts",
    "src/lib/providers/mockProvider.ts",
    "src/lib/models/sampleManifests.ts",
    "src/lib/jobs/jobRunner.ts",
    "src/lib/jobs/receipt.ts",
    "src/lib/keyrail/keyrail.ts",
    "src/lib/validation/referenceValidation.ts",
    "src/lib/export/projectPacket.ts",
]

API_BASE_PATTERN = re.compile(r"https://api\.[a-z0-9.-]+", re.IGNORECASE)


def iter_vendor_scan_files():
    roots = [ROOT / "src", ROOT / "contracts", ROOT / "scripts"]
    for base in roots:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if any(part in EXCLUDE_DIRS for part in path.parts):
                continue
            if path.suffix not in SOURCE_EXTS:
                continue
            yield path


def fail(msg: str):
    print(f"[FAIL] {msg}")
    return False


def ok(msg: str):
    print(f"[OK] {msg}")
    return True


def check_required_docs():
    missing = [p for p in REQUIRED if not (ROOT / p).exists()]
    if missing:
        fallback_missing = [p for p in FALLBACK_REQUIRED if not (ROOT / p).exists()]
        if fallback_missing:
            return fail(f"Missing required docs: {missing}; fallback missing: {fallback_missing}")
    return ok("required docs exist")


def check_required_impl_files():
    missing = [p for p in IMPLEMENTATION_FILES if not (ROOT / p).exists()]
    if missing:
        return fail("missing implementation files: " + ", ".join(missing))
    return ok("core implementation files exist")


def check_forbidden_strings():
    hits = []
    for path in iter_vendor_scan_files():
        rel = path.relative_to(ROOT)
        text = path.read_text(errors="ignore").lower()
        if rel.parts[:1] == ("scripts",) and rel.name not in {"verify_runtime.ts"}:
            continue
        for s in FORBIDDEN_STRINGS:
            if s.lower() in text:
                if str(rel) == "scripts/verify_build.py":
                    continue
                hits.append((str(rel), s))
    if hits:
        return fail("forbidden strings found: " + ", ".join(f"{p}:{s}" for p, s in hits[:20]))
    return ok("no forbidden vendor hardcoding found")


def check_hardcoded_api_bases():
    hits = []
    src = ROOT / "src"
    if not src.exists():
        return ok("no src tree yet")
    for path in src.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in SOURCE_EXTS:
            continue
        if any(part in EXCLUDE_DIRS for part in path.parts):
            continue
        text = path.read_text(errors="ignore")
        for match in API_BASE_PATTERN.findall(text):
            hits.append((str(path.relative_to(ROOT)), match))
    if hits:
        return fail("hardcoded provider API bases: " + ", ".join(f"{p}:{m}" for p, m in hits[:20]))
    return ok("no hardcoded https://api.* bases in src")


def check_secret_fields_in_contracts():
    candidates = list((ROOT / "contracts").glob("*.ts")) if (ROOT / "contracts").exists() else []
    lib_root = ROOT / "src" / "lib"
    if lib_root.exists():
        candidates += list(lib_root.rglob("*job*.*"))
        candidates += list(lib_root.rglob("*receipt*.*"))
    hits = []
    for path in candidates:
        if not path.is_file():
            continue
        text = path.read_text(errors="ignore")
        for pat in SECRET_FIELD_PATTERNS:
            if re.search(pat, text):
                if "keyrail" in str(path).lower():
                    continue
                hits.append((str(path.relative_to(ROOT)), pat))
    if hits:
        return fail("raw secret-like fields found in job/receipt area: " + ", ".join(f"{p}:{pat}" for p, pat in hits[:20]))
    return ok("no raw secret fields found in job/receipt contracts")


def check_required_routes():
    missing = [p for p in REQUIRED_ROUTE_FILES if not (ROOT / p).exists()]
    if missing:
        return fail("missing route files: " + ", ".join(missing))
    return ok("required App Router pages exist")


def check_domain_types_and_contracts():
    missing = [p for p in DOMAIN_TYPE_FILES if not (ROOT / p).exists()]
    if missing:
        return fail("missing domain type modules: " + ", ".join(missing))
    dm = ROOT / "contracts" / "data-model.contract.ts"
    if not dm.exists():
        return fail("contracts/data-model.contract.ts missing")
    text = dm.read_text(errors="ignore")
    if "AssetRole" not in text:
        return fail("AssetRole missing from data-model.contract.ts")
    if "ReferenceBudgetWarningKind" not in text:
        return fail("ReferenceBudgetWarningKind missing from data-model.contract.ts")
    return ok("Asset Map + Reference Budget markers present")


def check_reference_execution_contracts():
    pa = (ROOT / "contracts" / "provider-adapter.contract.ts").read_text(
        errors="ignore"
    )
    dm = (ROOT / "contracts" / "data-model.contract.ts").read_text(errors="ignore")
    if "referenceSelections" not in pa:
        return fail("provider-adapter.contract.ts missing referenceSelections on GenerationRequest")
    if "referenceSelections" not in dm:
        return fail("data-model.contract.ts missing referenceSelections on job/receipt types")
    rv = ROOT / "src" / "lib" / "validation" / "referenceValidation.ts"
    if not rv.exists():
        return fail("referenceValidation module missing")
    pkt = ROOT / "src" / "lib" / "export" / "projectPacket.ts"
    if not pkt.exists():
        return fail("projectPacket export module missing")
    return ok("reference execution + packet modules present")


def main():
    checks = [
        check_required_docs(),
        check_required_impl_files(),
        check_required_routes(),
        check_domain_types_and_contracts(),
        check_reference_execution_contracts(),
        check_forbidden_strings(),
        check_hardcoded_api_bases(),
        check_secret_fields_in_contracts(),
    ]
    if not all(checks):
        sys.exit(1)
    print("[OK] OpenMediaForge verify (python gate) passed")


if __name__ == "__main__":
    main()

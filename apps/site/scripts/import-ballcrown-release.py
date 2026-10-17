#!/usr/bin/env python3
"""Import the approved immutable BALLCROWN v22 game25 M00-M07 main campaign.

The source ZIP and receipt are pinned before any runtime extraction. Only the
receipt's runtimeFiles are copied. Unity's two large raw files are replaced by
immutable chunks, which the Pages Function concatenates at their original URLs.
The index and all other runtime files remain byte-for-byte identical.

Example (run from any directory):
  python3 apps/site/scripts/import-ballcrown-release.py \
    --archive /path/to/ballcrown-0.22.0-game25-m07-verified.zip \
    --receipt /path/to/m07-game25-publication-receipt.json \
    --report /path/to/ballcrown-import-verification.json

An existing output must already exactly match this import. Unexpected or edited
files are never overwritten. --verify-only checks the deployed source tree.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import sys
import tempfile
from typing import Any
import zipfile


ARCHIVE_SHA256 = "da76220983194f2bc96022840ecf6cb7ec4826c148d8b98186cfbbfdd6f12544"
ARCHIVE_BYTES = 72_597_159
RECEIPT_SHA256 = "89bdb021612ba6199e7dc277d786fd5efaa290ee18d2ea5a4951a546066bbf77"
INDEX_SHA256 = "aebe9d3fc8808e30a331295da7d705a50ebd471fb2bc36dcc60caf482bf8f6d9"
WASM_SHA256 = "6b3fe878bfb1247dee2f6ac4465c17adb2de921f13f05921c45b07211c7ff11b"
DATA_SHA256 = "77ff5a90880c076df5976b392f07d916f1ca66ef26c98c33694955273f994eb4"
FRAMEWORK_SHA256 = "5385a1dd92b9ef88aa8fab55f1eb228a875b88d74c89f3f7fe8926423965d686"
LOADER_SHA256 = "40f321610139030b588daf3adf3f7350ad29ee2e7bb0091059db3f1b3ad1d22f"
NATIVE_VERSION = "0.22.0"
RELEASE_REVISION = "049-v22-m06-m07-game25-mobile"
CHUNK_BYTES = 8 * 1024 * 1024
RUNTIME_FILE_COUNT = 99
# The sealed ZIP also contains these three producer documents. They are hashed
# before extraction and never published as runtime assets. The pinned receipt
# is publication-only, derived from GAME25-FILES.json and the verified handoff.
ARCHIVE_METADATA = {
    "GAME25-FILES.json": {
        "bytes": 14_929,
        "sha256": "f6b21bf87fa3031d351297e0a73b50b6f082f799524ce12b07fa67c6c1f4f61b",
    },
    "GAME25-README_RU.txt": {
        "bytes": 1_668,
        "sha256": "d9cb7196783cf71d441fed3a2e9e7d097999db126159a2b0b226f3b27c6228a4",
    },
    "GAME25-VERIFICATION.json": {
        "bytes": 8_023,
        "sha256": "2a26203e94681f8277162cd5a445b350c4992f22b2c12c9ae98024da45f510ea",
    },
}
PUBLIC_BASE = "/games/ballcrown/play/"
TRANSPORT_PATH = "Build/transport.json"
VIRTUAL_TYPES = {
    "Build/BuildWeb.data": "application/octet-stream",
    "Build/BuildWeb.wasm": "application/wasm",
}


def fail(message: str) -> None:
    raise ValueError(message)


def digest_file(path: Path) -> tuple[int, str]:
    size, digest = 0, hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            size += len(block)
            digest.update(block)
    return size, digest.hexdigest()


def check_file(path: Path, expected_size: int, expected_sha: str) -> None:
    if path.is_symlink() or not path.is_file():
        fail(f"Expected a regular file: {path}")
    actual = digest_file(path)
    if actual != (expected_size, expected_sha):
        fail(f"Size/SHA256 mismatch: {path} (actual {actual})")


def destination_path(path: Path) -> Path:
    """Reject redirected destinations before mkdir, temporary files, or writes.

    Use canonical paths for OS aliases such as macOS /tmp (/private/tmp).
    Never resolve a caller-supplied symlink into a silently different tree.
    """
    absolute = path.absolute()
    if ".." in absolute.parts:
        fail(f"Destination must not contain parent traversal: {absolute}")
    for ancestor in (absolute, *absolute.parents):
        if ancestor.is_symlink():
            fail(f"Destination contains a symlink; use a canonical path: {ancestor}")
        if ancestor != absolute and ancestor.exists() and not ancestor.is_dir():
            fail(f"Destination parent is not a directory: {ancestor}")
    return absolute


def validate_report_destination(report: Path, output: Path,
                                archive: Path, receipt: Path) -> None:
    if report == output or output in report.parents:
        fail("Verification report must be outside the public runtime")
    for source in (archive, receipt):
        if report == source or (report.exists() and os.path.samefile(report, source)):
            fail("Verification report must not alias the immutable source")
    if not report.exists():
        return
    if not report.is_file() or report.stat().st_size > 1024 * 1024:
        fail("Existing report is not a recognized verification report")
    try:
        prior = json.loads(report.read_bytes())
    except (ValueError, OSError) as error:
        fail(f"Refusing to overwrite an unrelated report destination: {error}")
    if not isinstance(prior, dict):
        fail("Refusing to overwrite an unrelated report destination")
    prior_archive = prior.get("sourceArchive")
    prior_receipt = prior.get("sourceReceipt")
    if not (
        prior.get("schemaVersion") == 1
        and prior.get("status") == "PASS"
        and prior.get("action") in ("imported", "verified-existing")
        and prior.get("output") == str(output)
        and isinstance(prior_archive, dict) and prior_archive.get("sha256") == ARCHIVE_SHA256
        and isinstance(prior_receipt, dict) and prior_receipt.get("sha256") == RECEIPT_SHA256
        and prior.get("nativeRuntimeFilesVerified") == RUNTIME_FILE_COUNT
        and prior.get("nativeIndexSHA256") == INDEX_SHA256
    ):
        fail("Refusing to overwrite an unrelated report destination")


def write_report(report: Path, data: dict[str, Any]) -> None:
    report.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(prefix=".ballcrown-report-", dir=report.parent,
                                         delete=False) as destination:
            temporary = Path(destination.name)
            destination.write(json_bytes(data))
        # Atomic replacement avoids truncating another file through a hardlink
        # or a symlink created between initial validation and final delivery.
        os.replace(temporary, report)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def safe_relative(value: Any) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        fail(f"Invalid runtime path: {value!r}")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {".", ".."} for part in value.split("/")):
        fail(f"Unsafe runtime path: {value!r}")
    if path.as_posix() != value or value.endswith("/"):
        fail(f"Non-canonical runtime path: {value!r}")
    return value


def receipt_runtime(receipt: dict[str, Any]) -> list[dict[str, Any]]:
    runtime = receipt.get("runtimeFiles", [])
    if len(runtime) != RUNTIME_FILE_COUNT:
        fail(f"Expected {RUNTIME_FILE_COUNT} runtime files")
    seen = set()
    for item in runtime:
        path = safe_relative(item.get("path"))
        if path in seen:
            fail(f"Duplicate runtime path: {path}")
        seen.add(path)
        if not isinstance(item.get("bytes"), int) or item["bytes"] < 0:
            fail(f"Invalid runtime size: {path}")
        sha = item.get("sha256", "")
        if len(sha) != 64 or any(char not in "0123456789abcdef" for char in sha):
            fail(f"Invalid runtime SHA256: {path}")
    if not {"index.html", "NOTICE.txt", "Licenses/Box2D-Upstream-Notice.txt",
            "Licenses/Inter-OFL.txt", *VIRTUAL_TYPES}.issubset(seen):
        fail("Missing mandatory runtime, NOTICE, or license entry")
    by_path = {item["path"]: item for item in runtime}
    if not (
        receipt.get("manifestVersion") == 1
        and receipt.get("version") == NATIVE_VERSION
        and receipt.get("revision") == RELEASE_REVISION
        and "buildRevision" not in receipt
        and receipt.get("nativeBuild", {}).get("version") == NATIVE_VERSION
        and receipt.get("nativeBuild", {}).get("revision") == RELEASE_REVISION
    ):
        fail("Receipt version/revisions differ from the approved M00-M07 game25 package")
    pinned_native = {
        "indexSHA256": ("index.html", INDEX_SHA256),
        "wasmSHA256": ("Build/BuildWeb.wasm", WASM_SHA256),
        "dataSHA256": ("Build/BuildWeb.data", DATA_SHA256),
        "frameworkSHA256": ("Build/BuildWeb.framework.js", FRAMEWORK_SHA256),
        "loaderSHA256": ("Build/BuildWeb.loader.js", LOADER_SHA256),
    }
    for field, (path, expected_sha) in pinned_native.items():
        if path not in by_path or by_path[path]["sha256"] != expected_sha:
            fail(f"Receipt native hash differs from the approved build: {path}")
        if receipt.get("nativeBuild", {}).get(field) != expected_sha:
            fail(f"Receipt native metadata hash differs from the approved build: {field}")
    web_archive = receipt.get("immutableSource", {})
    if web_archive.get("sha256") != ARCHIVE_SHA256:
        fail("Receipt archive hash is not the approved immutable archive")
    if web_archive.get("bytes") != ARCHIVE_BYTES:
        fail("Receipt archive size is not the approved immutable archive")
    if web_archive.get("entries") != RUNTIME_FILE_COUNT + len(ARCHIVE_METADATA):
        fail("Receipt archive entry count differs from the approved runtime and metadata")
    if (web_archive.get("runtimeEntries") != RUNTIME_FILE_COUNT
            or web_archive.get("metadataEntries") != len(ARCHIVE_METADATA)):
        fail("Receipt runtime/metadata entry counts differ from the approved archive")
    return runtime


def validate_archive(archive: zipfile.ZipFile, runtime: list[dict[str, Any]]) -> int:
    entries = archive.infolist()
    names = [entry.filename for entry in entries]
    if len(set(names)) != len(names):
        fail("ZIP contains duplicate member names")
    members = {entry.filename: entry for entry in entries}
    runtime_names = {item["path"] for item in runtime}
    if set(names) != runtime_names | set(ARCHIVE_METADATA):
        fail("ZIP entries differ from the approved 99 runtime files and three metadata files")
    for entry in entries:
        safe_relative(entry.filename)
        file_type = stat.S_IFMT(entry.external_attr >> 16)
        if entry.is_dir() or file_type not in (0, stat.S_IFREG):
            fail(f"ZIP entry is not a regular file: {entry.filename}")
    for path, expected in ARCHIVE_METADATA.items():
        member = members[path]
        if member.file_size != expected["bytes"]:
            fail(f"ZIP metadata size mismatch: {path}")
        data = archive.read(member)
        if hashlib.sha256(data).hexdigest() != expected["sha256"]:
            fail(f"ZIP metadata SHA256 mismatch: {path}")
    embedded_runtime = json.loads(archive.read("GAME25-FILES.json"))
    expected_runtime = {item["path"]: {"bytes": item["bytes"], "sha256": item["sha256"]}
                        for item in runtime}
    if embedded_runtime != expected_runtime:
        fail("Embedded runtime manifest differs from the approved publication receipt")
    # First validate every listed runtime member. No runtime is extracted until
    # all pinned runtime size and SHA256 checks have passed.
    for item in runtime:
        member = members.get(item["path"])
        if member is None or member.is_dir() or member.file_size != item["bytes"]:
            fail(f"Missing or incorrectly sized ZIP runtime: {item['path']}")
        file_type = stat.S_IFMT(member.external_attr >> 16)
        if file_type not in (0, stat.S_IFREG):
            fail(f"ZIP runtime is not a regular file: {item['path']}")
        digest, size = hashlib.sha256(), 0
        with archive.open(member) as source:
            for block in iter(lambda: source.read(1024 * 1024), b""):
                size += len(block)
                digest.update(block)
        if (size, digest.hexdigest()) != (item["bytes"], item["sha256"]):
            fail(f"ZIP runtime SHA256 mismatch: {item['path']}")
    return sum(not member.is_dir() and member.filename not in runtime_names for member in entries)


def json_bytes(value: dict[str, Any]) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def package_runtime(archive: zipfile.ZipFile, receipt: dict[str, Any],
                    runtime: list[dict[str, Any]], staging: Path) -> dict[str, Any]:
    virtual_files = []
    for item in runtime:
        path = item["path"]
        if path in VIRTUAL_TYPES:
            chunks = []
            offset = 0
            with archive.open(path) as source:
                while block := source.read(CHUNK_BYTES):
                    chunk_path = f"Build/chunks/{PurePosixPath(path).name}.{item['sha256']}.{len(chunks):03}.bin"
                    target = staging / chunk_path
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(block)
                    chunks.append({"path": chunk_path, "offset": offset, "bytes": len(block),
                                   "sha256": hashlib.sha256(block).hexdigest()})
                    offset += len(block)
            virtual_files.append({**item, "contentType": VIRTUAL_TYPES[path], "chunks": chunks})
        else:
            target = staging / path
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(path) as source, target.open("wb") as destination:
                shutil.copyfileobj(source, destination, 1024 * 1024)
    versions = re.findall(r"\bproductVersion\s*:\s*(['\"])([^'\"]+)\1", (staging / "index.html").read_text())
    if len(versions) != 1 or versions[0][1] != NATIVE_VERSION:
        fail("Sealed index productVersion differs from the preserved native version")
    transport = {
        "schemaVersion": 1,
        "version": versions[0][1],
        "revision": receipt["revision"],
        "sourceArchiveSHA256": ARCHIVE_SHA256,
        "sourceReceiptSHA256": RECEIPT_SHA256,
        "chunkBytes": CHUNK_BYTES,
        "publicBase": PUBLIC_BASE,
        "virtualFiles": virtual_files,
        "runtimeFiles": runtime,
    }
    (staging / TRANSPORT_PATH).write_bytes(json_bytes(transport))
    return transport


def validate_package(output: Path, runtime: list[dict[str, Any]],
                     transport: dict[str, Any]) -> dict[str, Any]:
    if output.is_symlink() or not output.is_dir():
        fail(f"Output is not a regular directory: {output}")
    expected_paths = {item["path"] for item in runtime if item["path"] not in VIRTUAL_TYPES}
    expected_paths.add(TRANSPORT_PATH)
    virtual_by_path = {item["path"]: item for item in transport["virtualFiles"]}
    reconstructed = []
    for item in runtime:
        path = item["path"]
        if path not in VIRTUAL_TYPES:
            check_file(output / path, item["bytes"], item["sha256"])
            continue
        if (output / path).exists():
            fail(f"Oversized original must not be a public asset: {path}")
        virtual = virtual_by_path[path]
        digest, total_bytes = hashlib.sha256(), 0
        for chunk in virtual["chunks"]:
            chunk_path = safe_relative(chunk["path"])
            expected_paths.add(chunk_path)
            if chunk["offset"] != total_bytes or chunk["bytes"] > CHUNK_BYTES:
                fail(f"Invalid chunk size/order: {chunk_path}")
            check_file(output / chunk_path, chunk["bytes"], chunk["sha256"])
            with (output / chunk_path).open("rb") as source:
                for block in iter(lambda: source.read(1024 * 1024), b""):
                    digest.update(block)
                    total_bytes += len(block)
        if (total_bytes, digest.hexdigest()) != (item["bytes"], item["sha256"]):
            fail(f"Reconstructed native runtime mismatch: {path}")
        reconstructed.append({"path": path, "bytes": total_bytes, "sha256": digest.hexdigest(),
                              "chunks": len(virtual["chunks"])})
    manifest_bytes = json_bytes(transport)
    check_file(output / TRANSPORT_PATH, len(manifest_bytes), hashlib.sha256(manifest_bytes).hexdigest())
    actual_paths = set()
    assets = []
    for path in output.rglob("*"):
        if path.is_symlink():
            fail(f"Unexpected output symlink: {path}")
        if path.is_file():
            relative = path.relative_to(output).as_posix()
            actual_paths.add(relative)
            assets.append((relative, path.stat().st_size))
    if actual_paths != expected_paths:
        fail(f"Unexpected/missing output assets: {sorted(actual_paths ^ expected_paths)}")
    max_path, max_bytes = max(assets, key=lambda item: item[1])
    if max_bytes > CHUNK_BYTES:
        fail(f"Public asset exceeds the import cap: {max_path}")
    return {
        "nativeRuntimeFilesVerified": len(runtime),
        "exactRuntimeFilesCopied": len(runtime) - len(VIRTUAL_TYPES),
        "nativeRuntimeBytesVerified": sum(item["bytes"] for item in runtime),
        "nativeIndexSHA256": INDEX_SHA256,
        "virtualNativeFilesVerified": reconstructed,
        "publicChunkCount": sum(len(item["chunks"]) for item in transport["virtualFiles"]),
        "publicAssetCount": len(assets),
        "publicBytes": sum(size for _, size in assets),
        "maxPublicAsset": {"path": max_path, "bytes": max_bytes},
        "transportSHA256": hashlib.sha256(manifest_bytes).hexdigest(),
        "excludedOriginalLargeAssets": sorted(VIRTUAL_TYPES),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parents[1] / "public/games/ballcrown/play")
    parser.add_argument("--report", type=Path, required=True,
                        help="Verification report destination (keep outside public)")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    archive_path, receipt_path = args.archive.resolve(), args.receipt.resolve()
    output, report_path = destination_path(args.output), destination_path(args.report)
    check_file(archive_path, ARCHIVE_BYTES, ARCHIVE_SHA256)
    if receipt_path.is_symlink() or not receipt_path.is_file() or digest_file(receipt_path)[1] != RECEIPT_SHA256:
        fail("Receipt SHA256 differs from the approved immutable receipt")
    validate_report_destination(report_path, output, archive_path, receipt_path)
    receipt = json.loads(receipt_path.read_bytes())
    runtime = receipt_runtime(receipt)
    with zipfile.ZipFile(archive_path) as archive:
        excluded_count = validate_archive(archive, runtime)
        if (excluded_count != len(ARCHIVE_METADATA)
                or len(archive.infolist()) != RUNTIME_FILE_COUNT + len(ARCHIVE_METADATA)):
            fail("Approved M00-M07 archive must contain exactly 99 runtime and three metadata entries")
        # Package to an owned temporary directory; no output is exposed until
        # the whole source and reconstructed runtime have passed verification.
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix=".ballcrown-import-", dir=output.parent) as temp:
            staging = Path(temp) / "play"
            staging.mkdir()
            transport = package_runtime(archive, receipt, runtime, staging)
            validate_package(staging, runtime, transport)
            if output.exists() or output.is_symlink():
                validation = validate_package(output, runtime, transport)
                action = "verified-existing"
            elif args.verify_only:
                fail(f"--verify-only output does not exist: {output}")
            else:
                os.replace(staging, output)
                validation = validate_package(output, runtime, transport)
                action = "imported"
    report = {
        "schemaVersion": 1,
        "status": "PASS",
        "action": action,
        "version": transport["version"],
        "revision": transport["revision"],
        "sourceArchive": {"path": str(archive_path), "bytes": ARCHIVE_BYTES, "sha256": ARCHIVE_SHA256},
        "sourceReceipt": {"path": str(receipt_path), "sha256": RECEIPT_SHA256},
        "output": str(output),
        "excludedArchiveFileCount": excluded_count,
        **validation,
    }
    write_report(report_path, report)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, zipfile.BadZipFile, KeyError, json.JSONDecodeError) as error:
        print(f"BALLCROWN import failed: {error}", file=sys.stderr)
        sys.exit(1)

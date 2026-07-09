import json
from pathlib import Path

import pytest
from pydantic import TypeAdapter, ValidationError

from ai_contracts import (
    CONTRACT_MODELS,
    CONTRACT_TYPED_DICTS,
    PluginDescriptor,
    PluginResult,
    RagDocument,
    idempotency_fingerprint,
)

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = ROOT / "fixtures" / "ai-contracts"


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def registry() -> dict:
    return json.loads((ROOT / "port-registry.yaml").read_text())


def contract_name(slot: str, port: str, direction: str, suffix: str) -> str:
    return f"{slot.title().replace('-', '').replace('_', '')}{port[:1].upper()}{port[1:]}{direction.title()}{suffix}"


def test_valid_shared_fixtures() -> None:
    assert PluginDescriptor.model_validate(load_fixture("plugin-descriptor-loader.json")).kind == "rag.loader"
    assert CONTRACT_MODELS["LoaderLoadRequestInputEvent"].model_validate(load_fixture("loader-load-request-event.json")).type == "loader.loadRequest.input.v1"
    assert CONTRACT_MODELS["LoaderRawDocumentOutputEvent"].model_validate(load_fixture("loader-raw-document-output-event.json")).data.status == "success"
    assert TypeAdapter(PluginResult).validate_python(load_fixture("output-error-event.json")["data"]).status == "error"
    assert RagDocument.model_validate(load_fixture("rag-document.json")).documentId == "doc-001"


def test_invalid_discriminator_and_result_status() -> None:
    descriptor = load_fixture("plugin-descriptor-loader.json")
    descriptor["kind"] = "rag.teleporter"
    with pytest.raises(ValidationError):
        PluginDescriptor.model_validate(descriptor)

    with pytest.raises(ValidationError):
        TypeAdapter(PluginResult).validate_python({"status": "ok", "output": {}})


def test_event_contracts_exist_for_every_registry_port() -> None:
    for slot in registry()["slots"]:
        for direction, ports in (("input", slot["inputs"]), ("output", slot["outputs"])):
            for port in ports:
                for suffix in ("Payload", "Message", "Event"):
                    name = contract_name(slot["slot"], port["port"], direction, suffix)
                    assert name in CONTRACT_MODELS
                    assert name in CONTRACT_TYPED_DICTS


def test_missing_required_event_metadata_is_invalid() -> None:
    event = load_fixture("loader-load-request-event.json")
    del event["rag_pluginname"]
    with pytest.raises(ValidationError):
        CONTRACT_MODELS["LoaderLoadRequestInputEvent"].model_validate(event)


def test_idempotency_fingerprint_matches_typescript_contract() -> None:
    assert idempotency_fingerprint(
        {
            "name": "filesystem-loader",
            "version": "1.0.0",
            "configDigest": "sha256:config",
            "inputDigest": "sha256:input",
            "idempotencyKey": "project-a:load:001",
        }
    ) == "filesystem-loader:1.0.0:sha256:config:sha256:input:project-a:load:001"


def test_no_retired_scaffold_markers_in_fixtures() -> None:
    text = "\n".join(path.read_text() for path in FIXTURES.glob("*.json"))
    assert "memory://" not in text
    assert "deterministic.fake.embedding" not in text
    assert "mock" not in text.lower()
    assert "fake" not in text.lower()

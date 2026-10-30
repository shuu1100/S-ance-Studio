def test_root_probe(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["service"] == "Séance Studio Backend"
    assert data["data"]["offline_strict"] is True


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["database_connected"] is True
    assert "status" in data["data"]
    assert "ollama_connected" in data["data"]
    assert "configured_text_model" in data["data"]
    assert "text_model_available" in data["data"]
    assert "vision_model" in data["data"]
    assert "vision_model_available" in data["data"]
    assert "message" in data["data"]


def test_ai_status_endpoint(client):
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "connected" in data["data"]
    assert "active_model" in data["data"]
    assert "vision_model" in data["data"]
    assert "vision_model_available" in data["data"]
    assert data["data"]["auto_download_allowed"] is False


import base64


def test_visual_evidence_endpoint(client):
    # Valid small PNG payload
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    payload = {
        "image_base64": base64.b64encode(fake_png).decode("utf-8"),
        "mime_type": "image/png",
        "prompt": "Describe markings",
    }
    response = client.post("/api/v1/ai/visual-evidence", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "observation" in res_data["data"]
    assert "disclaimer" in res_data["data"]
    assert "do not alter authoritative" in res_data["data"]["disclaimer"]



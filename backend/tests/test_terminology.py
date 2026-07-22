from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.services.terminology import terminology_service
from app.schemas.terminology import DomainCreate, CategoryCreate, SourceCreate, TermCreate, DefinitionCreate, SynonymCreate, ExampleCreate


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "healthy"


def test_create_domain_category_source(client: TestClient):
    # Test Domain Creation
    response = client.post("/api/v1/terminology/domains", json={"name": "Computing", "description": "Information Technology"})
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "Computing"
    assert "id" in response.json()

    # Test Domain Duplicate Prevention
    response_dup = client.post("/api/v1/terminology/domains", json={"name": "Computing"})
    assert response_dup.status_code == status.HTTP_400_BAD_REQUEST

    # Test Category Creation
    response_cat = client.post("/api/v1/terminology/categories", json={"name": "Programming", "description": "Coding languages and paradigms"})
    assert response_cat.status_code == status.HTTP_201_CREATED
    assert response_cat.json()["name"] == "Programming"

    # Test Source Creation
    response_src = client.post("/api/v1/terminology/sources", json={"name": "Karka", "url": "https://glossary.example.org"})
    assert response_src.status_code == status.HTTP_201_CREATED
    assert response_src.json()["name"] == "Karka"


def test_create_term_with_relations(client: TestClient, db: Session):
    # Setup domain, category, source in db first
    domain = terminology_service.create_domain(db, obj_in=DomainCreate(name="Computing"))
    category = terminology_service.create_category(db, obj_in=CategoryCreate(name="Software"))
    source = terminology_service.create_source(db, obj_in=SourceCreate(name="Gov Glossary"))

    # Prepare Term payload with sub-structures (definitions, synonyms, examples)
    payload = {
        "english_term": "Compiler",
        "tamil_term": "Compiler",
        "pure_tamil_term": "நிரல்மொழிமாற்றி",
        "ipa_tamil": "n̪iɾɐlmoɻimɑːrːi",
        "domain_id": domain.id,
        "category_id": category.id,
        "source_id": source.id,
        "confidence_score": 0.95,
        "is_verified": True,
        "definitions": [
            {
                "tamil_definition": "உயர்நிலை நிரலை கணினி இயக்கும் வகையில் மாற்றுவது.",
                "english_definition": "Translates high-level source code to machine code.",
                "author": "Editor-1",
                "version": 1
            }
        ],
        "examples": [
            {
                "tamil_example": "ஜிசிசி ஒரு புகழ்பெற்ற கம்பைலர் ஆகும்.",
                "english_example": "GCC is a well-known compiler."
            }
        ],
        "synonyms": [
            {
                "synonym_term": "தொகுப்பி",
                "language": "ta"
            }
        ]
    }

    response = client.post("/api/v1/terminology/terms", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["english_term"] == "Compiler"
    assert data["pure_tamil_term"] == "நிரல்மொழிமாற்றி"
    assert len(data["definitions"]) == 1
    assert data["definitions"][0]["tamil_definition"] == "உயர்நிலை நிரலை கணினி இயக்கும் வகையில் மாற்றுவது."
    assert len(data["examples"]) == 1
    assert data["examples"][0]["tamil_example"] == "ஜிசிசி ஒரு புகழ்பெற்ற கம்பைலர் ஆகும்."
    assert len(data["synonyms"]) == 1
    assert data["synonyms"][0]["synonym_term"] == "தொகுப்பி"


def test_search_and_filter_terms(client: TestClient, db: Session):
    # Setup some basic terms
    term_data_1 = TermCreate(
        english_term="Compiler",
        tamil_term="Compiler",
        pure_tamil_term="தொகுப்பி",
        confidence_score=0.9
    )
    term_data_2 = TermCreate(
        english_term="Interpreter",
        tamil_term="Interpreter",
        pure_tamil_term="வரையறுப்பி",
        confidence_score=0.85
    )
    terminology_service.create_term(db, obj_in=term_data_1)
    terminology_service.create_term(db, obj_in=term_data_2)

    # Search for "Compiler"
    response = client.get("/api/v1/terminology/terms?q=Compiler")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert response.json()[0]["english_term"] == "Compiler"

    # Search for pure Tamil substring
    response_tamil = client.get("/api/v1/terminology/terms?q=வரை")
    assert response_tamil.status_code == status.HTTP_200_OK
    assert len(response_tamil.json()) == 1
    assert response_tamil.json()[0]["english_term"] == "Interpreter"


def test_term_relationships(client: TestClient, db: Session):
    # Setup terms
    t1 = terminology_service.create_term(db, obj_in=TermCreate(english_term="Compiler", tamil_term="Compiler", pure_tamil_term="தொகுப்பி"))
    t2 = terminology_service.create_term(db, obj_in=TermCreate(english_term="Linker", tamil_term="Linker", pure_tamil_term="இணைப்பி"))

    payload = {
        "source_term_id": t1.id,
        "target_term_id": t2.id,
        "relationship_type": "related"
    }

    response = client.post("/api/v1/terminology/relationships", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["relationship_type"] == "related"
    assert response.json()["source_term_id"] == t1.id
    assert response.json()["target_term_id"] == t2.id

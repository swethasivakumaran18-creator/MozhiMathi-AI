class RagService:
    """RAG-ready placeholder service for future embedding/vector integrations."""

    def __init__(self):
        self._documents: list[str] = []

    def ingest_document(self, content: str) -> None:
        self._documents.append(content)

    def retrieve_context(self, query: str, top_k: int = 3) -> list[str]:
        if not self._documents:
            return []
        query_terms = set(query.lower().split())
        ranked = sorted(
            self._documents,
            key=lambda doc: len(query_terms.intersection(set(doc.lower().split()))),
            reverse=True,
        )
        return ranked[:top_k]


rag_service = RagService()

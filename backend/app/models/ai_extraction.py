from sqlalchemy import Column, String, TIMESTAMP, text, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class AIExtraction(Base):
    __tablename__ = "ai_extractions"

    id_extraction = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_run = Column(UUID(as_uuid=True), nullable=False)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    id_documento = Column(UUID(as_uuid=True), nullable=False)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    document_type_detected = Column(String, nullable=True)
    confidence = Column(Numeric, nullable=False)
    requires_human_review = Column(Boolean, nullable=False, default=True)
    fields_extracted = Column(JSONB, nullable=False)
    comparisons = Column(JSONB, nullable=True)
    evidence = Column(JSONB, nullable=True)
    decision_suggestion = Column(JSONB, nullable=False)
    errors = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("NOW()"))

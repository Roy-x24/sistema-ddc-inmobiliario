from sqlalchemy import Column, String, TIMESTAMP, text, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class AIModelRun(Base):
    __tablename__ = "ai_model_runs"

    id_run = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=True)
    id_documento = Column(UUID(as_uuid=True), nullable=True)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    prompt_version = Column(String, nullable=False)
    input_hash = Column(String, nullable=False)
    output_schema_version = Column(String, nullable=False)
    confidence = Column(Numeric, nullable=False)
    status = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    request_summary = Column(JSONB, nullable=True)
    response_summary = Column(JSONB, nullable=True)
    errors = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("NOW()"))

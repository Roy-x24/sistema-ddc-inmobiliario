from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id_embedding = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=True)
    id_documento = Column(UUID(as_uuid=True), nullable=True)
    source_type = Column(String, nullable=False)
    source_id = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    source_text = Column(String, nullable=False)
    embedding = Column(JSONB, nullable=False)
    metadata_json = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("NOW()"))


class AuditEmbedding(Base):
    __tablename__ = "audit_embeddings"

    id_embedding = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_auditoria = Column(UUID(as_uuid=True), nullable=True)
    id_cliente = Column(UUID(as_uuid=True), nullable=True)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    source_text = Column(String, nullable=False)
    embedding = Column(JSONB, nullable=False)
    metadata_json = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("NOW()"))

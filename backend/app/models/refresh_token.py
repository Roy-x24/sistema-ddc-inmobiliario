from sqlalchemy import Column, String, Boolean, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), nullable=False)
    token_hash = Column(String, nullable=False)
    revocado = Column(Boolean, default=False)
    fecha_expiracion = Column(TIMESTAMP, nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=text("NOW()"))

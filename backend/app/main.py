from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.schema_service import asegurar_esquema_automatizacion
from app.routers import (
    auth, clientes, documentos, perfiles, riesgo, activacion,
    auditoria, beneficiarios, observaciones, admin, cumplimiento, ai, dashboard,
    notificaciones
)

app = FastAPI(
    title="DDC/KYC Inmobiliario API",
    description="API para Debida Diligencia de Clientes en el sector inmobiliario panameno",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(documentos.router)
app.include_router(perfiles.router)
app.include_router(riesgo.router)
app.include_router(activacion.router)
app.include_router(auditoria.router)
app.include_router(beneficiarios.router)
app.include_router(observaciones.router)
app.include_router(admin.router)
app.include_router(cumplimiento.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(notificaciones.router)


@app.on_event("startup")
def startup():
    asegurar_esquema_automatizacion()


@app.get("/")
def raiz():
    return {"mensaje": "DDC/KYC API v1.1 en funcionamiento"}

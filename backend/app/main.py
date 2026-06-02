from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, clientes, documentos, perfiles, riesgo, activacion, auditoria

app = FastAPI(
    title="DDC/KYC Inmobiliario API",
    description="API para Debida Diligencia de Clientes en el sector inmobiliario panameño",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(documentos.router)
app.include_router(perfiles.router)
app.include_router(riesgo.router)
app.include_router(activacion.router)
app.include_router(auditoria.router)


@app.get("/")
def raiz():
    return {"mensaje": "DDC/KYC API en funcionamiento"}

import os
import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configurar conexion a la base de datos desde variables de entorno o default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ddc_user:ddc_pass@localhost:5432/ddc_db")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def crear_usuario_demo(email, nombre, rol, password_plano):
    password_hash = bcrypt.hashpw(password_plano.encode(), bcrypt.gensalt(12)).decode()
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO usuarios (nombre, correo, password_hash, rol)
            VALUES (:nombre, :correo, :password_hash, :rol)
            ON CONFLICT (correo) DO NOTHING
        """), {"nombre": nombre, "correo": email, "password_hash": password_hash, "rol": rol})
        conn.commit()

def seed():
    print("Ejecutando seed determinista...")
    crear_usuario_demo("demo_empleado@ddc.com", "Demo Empleado", "empleado", "empleado123")
    print("Seed completado.")

if __name__ == "__main__":
    seed()

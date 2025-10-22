from app.database import Base, engine
from app.models.user import User  # import all models here

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database and tables created successfully!")

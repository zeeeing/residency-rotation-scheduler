from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from server.database import Base


class SolverSession(Base):
    __tablename__ = "solver_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    academic_year = Column(String(50), nullable=True)
    
    api_response = Column(JSON, nullable=False)
    
    notes = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "academic_year": self.academic_year,
            "notes": self.notes,
            "resident_count": len(self.api_response.get("residents", [])) if self.api_response else 0,
        }

    def to_full_dict(self):
        result = self.to_dict()
        result["api_response"] = self.api_response
        return result

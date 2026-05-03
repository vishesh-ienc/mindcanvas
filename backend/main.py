from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional



print("Backend is running")

notes_db = []; 

class Note(BaseModel):
    content: str
    mood : Optional[str] = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174","http://localhost:5173", "http://127.0.0.1:5173" ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "This is mindcanvas Backend"}

@app.post("/note")
def create_note(note: Note):

    new_note = {

        "id" : len(notes_db) + 1,
        "content" : note.content,
        "mood" : note.mood,
        "created_at" : datetime.now()
    }
    notes_db.append(new_note)
    print("Saved note :", note.content)
    return {"message" : "Note added successfully"}
    
@app.get("/notes")
def show_notes(): 
    print("All notes:", notes_db)
    return notes_db


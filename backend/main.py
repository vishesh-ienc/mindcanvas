from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional



print("Backend is running")

notes_db = []; 

class Note(BaseModel):
    content: str
    title: Optional[str] = None
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
    return {"message": "This is Antar Backend"}

@app.post("/note")
def create_note(note: Note):

    new_note = {
        "id" : len(notes_db) + 1,
        "title" : note.title,
        "content" : note.content,
        "mood" : note.mood,
        "created_at" : datetime.now()
    }
    notes_db.append(new_note)
    print("Saved note :", note.content)
    return {"message": "Note added successfully", "id": new_note["id"]}
    
@app.get("/notes")
def show_notes(): 
    return notes_db

@app.put("/note/{note_id}")
def update_note(note_id: int, note: Note):
    for n in notes_db:
        if n["id"] == note_id:
            n["title"]   = note.title
            n["content"] = note.content
            n["mood"]    = note.mood
            return {"message": "Note updated successfully"}
    raise HTTPException(status_code=404, detail="Note not found")

@app.delete("/note/{note_id}")
def delete_note(note_id: int):
    global notes_db
    note = next((n for n in notes_db if n["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    notes_db = [n for n in notes_db if n["id"] != note_id]
    print("Deleted note id:", note_id)
    return {"message": "Note deleted successfully"}

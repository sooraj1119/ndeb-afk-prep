import os
import json
import asyncio
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

import config
import database
import ai_agent
from browser import LinkedInJobBot

app = FastAPI(title="LinkedIn Auto-Apply AI Bot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active bot instance and active connection sockets
active_bot: LinkedInJobBot = None
active_connections: List[WebSocket] = []
bot_task = None
log_queue = asyncio.Queue()

async def broadcast_log(message: str):
    """Puts log message in queue and broadcasts to all WebSocket connections."""
    timestamp = asyncio.get_event_loop().time()
    formatted_msg = json.dumps({"type": "log", "message": message, "time": timestamp})
    await log_queue.put(formatted_msg)
    
    # Broadcast to sockets
    for conn in active_connections:
        try:
            await conn.send_text(formatted_msg)
        except Exception:
            pass

async def broadcast_screenshot(path: str):
    """Notifies WebSocket clients that a new screenshot is available."""
    filename = os.path.basename(path)
    msg = json.dumps({"type": "screenshot", "url": f"/api/screenshots/{filename}"})
    for conn in active_connections:
        try:
            await conn.send_text(msg)
        except Exception:
            pass

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    database.init_db()
    # Create screenshots directory
    os.makedirs(os.path.join(config.BASE_DIR, "screenshots"), exist_ok=True)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    await websocket.send_text(json.dumps({"type": "status", "running": active_bot is not None and active_bot.is_running}))
    try:
        while True:
            # Just keep connection open, handle any user controls
            data = await websocket.receive_text()
            # E.g., check for client ping/pong
    except WebSocketDisconnect:
        active_connections.remove(websocket)

# --- Serve Screenshots ---
@app.get("/api/screenshots/{filename}")
async def get_screenshot(filename: str):
    path = os.path.join(config.BASE_DIR, "screenshots", filename)
    if os.path.exists(path):
        return FileResponse(path)
    return JSONResponse(status_code=404, content={"message": "Screenshot not found"})

# --- Profile Endpoints ---
class ProfileInput(BaseModel):
    full_name: str
    email: str
    phone: str
    location: str
    linkedin_url: str = ""
    portfolio_url: str = ""
    github_url: str = ""
    base_resume_text: str = ""
    job_titles: List[str] = []
    target_locations: List[str] = []
    search_keywords: List[str] = []
    custom_answers: dict = {}

@app.get("/api/profile")
async def get_profile_api():
    profile = database.get_profile()
    if profile:
        return profile
    return {
        "full_name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin_url": "",
        "portfolio_url": "",
        "github_url": "",
        "base_resume_text": "",
        "job_titles": [],
        "target_locations": [],
        "search_keywords": [],
        "custom_answers": {}
    }

@app.post("/api/profile")
async def save_profile_api(profile: ProfileInput):
    database.save_profile(profile.dict())
    return {"status": "success", "message": "Profile saved successfully."}

@app.post("/api/profile/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Save base resume
    uploads_dir = os.path.join(config.BASE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, file.filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Parse PDF Text
    resume_text = ai_agent.extract_text_from_pdf(file_path)
    
    # Get current profile or create empty
    current = database.get_profile() or {}
    current["base_resume_text"] = resume_text
    current["base_resume_path"] = file_path
    
    database.save_profile(current)
    
    return {
        "status": "success", 
        "filename": file.filename, 
        "text_preview": resume_text[:1000] + ("..." if len(resume_text) > 1000 else ""),
        "text": resume_text
    }

# --- Applications Endpoints ---
@app.get("/api/applications")
async def get_applications_api(limit: int = 100, offset: int = 0):
    apps = database.get_applications(limit, offset)
    return apps

@app.get("/api/applications/download-resume")
async def download_tailored_resume(path: str):
    if os.path.exists(path):
        return FileResponse(path, media_type="application/pdf", filename=os.path.basename(path))
    return JSONResponse(status_code=404, content={"message": "Resume file not found"})

# --- Self-Learning QA Endpoints ---
@app.get("/api/learned-qa")
async def get_learned_qa_api():
    return database.get_all_learned_qa()

class SaveQAInput(BaseModel):
    question_text: str
    options: List[str] = []
    answer: str
    is_success: int = 1
    error_feedback: str = ""

@app.post("/api/learned-qa")
async def save_learned_qa_api(data: SaveQAInput):
    database.save_learned_answer(
        question_text=data.question_text,
        options=data.options,
        answer=data.answer,
        is_success=data.is_success,
        error_feedback=data.error_feedback
    )
    return {"status": "success"}

# --- Bot Control Endpoints ---
async def run_bot_task():
    global active_bot
    try:
        await broadcast_log("Bot runner task started.")
        await active_bot.search_and_apply_jobs()
    except Exception as e:
        await broadcast_log(f"Fatal error in bot background execution: {e}")
    finally:
        await broadcast_log("Bot runner thread exited.")
        # Broadcast running status update
        for conn in active_connections:
            try:
                await conn.send_text(json.dumps({"type": "status", "running": False}))
            except Exception:
                pass

@app.post("/api/bot/start")
async def start_bot(background_tasks: BackgroundTasks):
    global active_bot, bot_task
    if active_bot and active_bot.is_running:
        return {"status": "error", "message": "Bot is already running."}
        
    active_bot = LinkedInJobBot(log_callback=broadcast_log, screenshot_callback=broadcast_screenshot)
    
    # Broadcast status change
    for conn in active_connections:
        await conn.send_text(json.dumps({"type": "status", "running": True}))
        
    background_tasks.add_task(run_bot_task)
    return {"status": "success", "message": "Bot started successfully."}

@app.post("/api/bot/stop")
async def stop_bot():
    global active_bot
    if not active_bot or not active_bot.is_running:
        return {"status": "error", "message": "Bot is not running."}
        
    await active_bot.stop()
    return {"status": "success", "message": "Stop request submitted."}

@app.get("/api/bot/status")
async def get_bot_status():
    running = active_bot is not None and active_bot.is_running
    count = active_bot.application_count if active_bot else 0
    return {"running": running, "application_count": count}

if __name__ == "__main__":
    import uvicorn
    # Make sure database is ready
    database.init_db()
    print("Starting FastAPI app on port 8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)

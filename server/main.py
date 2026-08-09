from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive()
            if "text" in data:
                await websocket.send_text(f"Echo from agent: {data['text']}")
    except WebSocketDisconnect:
        print("Client disconnected.")
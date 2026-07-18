from fastapi import FastAPI

app = FastAPI(title="HACK-NATION Backend")


@app.get("/")
def read_root():
    return {"message": "Hello from HACK-NATION backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

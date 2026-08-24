from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import pandas as pd
import io

app = FastAPI(title="Expense Analyzer")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
expenses = []

class Expense(BaseModel):
    date: str
    category: str
    description: str
    amount: float

def get_dataframe():
    df = pd.DataFrame(expenses)
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        df = df.dropna(subset=["date", "amount"])
    return df

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/summary")
def get_summary():
    df = get_dataframe()
    if df.empty:
        return {"total": 0, "average": 0, "highest": 0, "count": 0}
    return {
        "total": round(float(df["amount"].sum()), 2),
        "average": round(float(df["amount"].mean()), 2),
        "highest": round(float(df["amount"].max()), 2),
        "count": len(df)
    }

@app.get("/api/category")
def category_analysis():
    df = get_dataframe()
    if df.empty:
        return []
    result = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    return [{"category": str(category), "amount": round(float(amount), 2)} for category, amount in result.items()]

@app.get("/api/monthly")
def monthly_analysis():
    df = get_dataframe()
    if df.empty:
        return []
    df["month"] = df["date"].dt.strftime("%Y-%m")
    result = df.groupby("month")["amount"].sum().sort_index()
    return [{"month": str(month), "amount": round(float(amount), 2)} for month, amount in result.items()]

@app.get("/api/highest")
def highest_expenses():
    df = get_dataframe()
    if df.empty:
        return []
    result = df.sort_values(by="amount", ascending=False).head(5)
    return [{
        "date": row["date"].strftime("%Y-%m-%d"),
        "category": str(row["category"]),
        "description": str(row["description"]),
        "amount": round(float(row["amount"]), 2)
    } for _, row in result.iterrows()]

@app.get("/api/expenses")
def get_expenses():
    df = get_dataframe()
    if df.empty:
        return []
    return [{
        "date": row["date"].strftime("%Y-%m-%d"),
        "category": str(row["category"]),
        "description": str(row["description"]),
        "amount": round(float(row["amount"]), 2)
    } for _, row in df.iterrows()]

@app.post("/api/add")
def add_expense(expense: Expense):
    if expense.amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative.")
    expenses.append(expense.model_dump())
    return {"message": "Expense added successfully"}

@app.delete("/api/delete/{index}")
def delete_expense(index: int):
    if index < 0 or index >= len(expenses):
        raise HTTPException(status_code=404, detail="Expense not found.")
    expenses.pop(index)
    return {"message": "Expense deleted successfully"}

@app.post("/api/import-excel")
async def import_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx Excel file.")
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the Excel file.")
    required = {"date", "category", "description", "amount"}
    df.columns = [str(column).strip().lower() for column in df.columns]
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail="Missing columns: " + ", ".join(missing))
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["date", "amount", "category", "description"])
    if df.empty:
        raise HTTPException(status_code=400, detail="The Excel file contains no valid expense records.")
    count = 0
    for _, row in df.iterrows():
        expenses.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "category": str(row["category"]),
            "description": str(row["description"]),
            "amount": float(row["amount"])
        })
        count += 1
    return {"message": "Excel file imported successfully.", "imported": count}

@app.delete("/api/clear")
def clear_expenses():
    expenses.clear()
    return {"message": "All expenses cleared successfully."}
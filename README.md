## Prerequisites

- Python 3.10+
- pip

## Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows:

```bash
.venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

## Run the Application

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Application:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## Excel Import

The application supports `.xlsx` Excel files.

The Excel file should contain the following columns:

```text
date
category
description
amount
```

Example:

| date | category | description | amount |
|------|----------|-------------|--------|
| 2026-08-01 | Food | Lunch | 150 |
| 2026-08-02 | Transport | Bus | 50 |
| 2026-08-03 | Shopping | Books | 500 |

## API Endpoints

- `GET /` - load the application
- `GET /api/summary` - get expense summary
- `GET /api/category` - analyse spending by category
- `GET /api/monthly` - analyse monthly spending
- `GET /api/highest` - get top 5 highest expenses
- `GET /api/expenses` - get all expenses
- `POST /api/add` - add a new expense
- `DELETE /api/delete/{index}` - delete an expense
- `POST /api/import-excel` - import expenses from an Excel file
- `DELETE /api/clear` - clear all expenses

## Add an Expense

Example request:

```bash
curl -X POST "http://127.0.0.1:8000/api/add" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-08-24",
    "category": "Food",
    "description": "Lunch",
    "amount": 150
  }'
```

## Get Expense Summary

```bash
curl -X GET "http://127.0.0.1:8000/api/summary"
```

Example response:

```json
{
  "total": 150,
  "average": 150,
  "highest": 150,
  "count": 1
}
```

## Import Excel File

```bash
curl -X POST "http://127.0.0.1:8000/api/import-excel" \
  -F "file=@/path/to/expenses.xlsx"
```

## Category Analysis

```bash
curl -X GET "http://127.0.0.1:8000/api/category"
```

## Monthly Analysis

```bash
curl -X GET "http://127.0.0.1:8000/api/monthly"
```

## Data Storage

The current version stores expense records in memory.

No database or CSV file is required.

Data is reset when the FastAPI server is restarted.

## Future Improvements

- Add persistent database storage
- Add expense editing
- Add user authentication
- Add budget tracking
- Add date-range filtering
- Add expense search and filtering
- Add data export
- Add additional visualisations

## Notes

- Excel files must contain `date`, `category`, `description` and `amount` columns.
- Only `.xlsx` files are supported for Excel import.
- Expense data is stored in memory in the current version.
- Restarting the server clears the stored expenses.

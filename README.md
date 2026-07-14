# Bookstore App

![CI](https://github.com/charlesnzk/bookstore-app/actions/workflows/ci.yml/badge.svg)

A bookstore app with separate admin and customer flows. Django/DRF on the backend, React/Mantine on the frontend, MSSQL for the database. Everything runs through Docker Compose, nothing to be installed locally other than Docker.

## Stack

- Backend: Django 4.2, DRF, MSSQL Server 2022
- Frontend: React, Mantine
- Auth: JWT (SimpleJWT)
- Chatbot: LangChain and OpenAI (GPT-3.5-turbo)
- CI: GitHub Actions

## Running it

You will need Docker Desktop. An OpenAI key is optional, the app works fine without it, you just will not get chatbot replies.

```bash
git clone https://github.com/YOUR_USERNAME/bookstore-app.git
cd bookstore-app
cp .env.example .env
```

Fill in .env (see below), then:

```bash
docker compose up --build
```

First run takes a few minutes since it is pulling the MSSQL image and installing everything. Once it is up, open a second terminal and run migrations plus seed data:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed
```

App: http://localhost:5173
Django admin: http://localhost:8000/admin

### Test accounts (after seeding)

- Admin: admin / Admin!123
- Customer: customer1 / Customer!123
- Customer: customer2 / Customer!123
- Customer: customer3 / Customer!123

### .env variables

```
SECRET_KEY=       # any random string
DEBUG=True
DB_NAME=bookstore
DB_PASSWORD=      # MSSQL SA password, needs upper, lower, digit and symbol, 8+ chars
OPENAI_API_KEY=   # optional, chatbot will not work without it
```

## Other useful commands

```bash
# run the test suite (45 tests)
docker compose exec backend python manage.py test store -v 2

# lint
docker compose run --rm backend flake8 . --max-line-length=88 --exclude=migrations,__pycache__,manage.py

# wipe and reseed data
docker compose exec backend python manage.py clear_db
docker compose exec backend python manage.py seed
```

## Docs

- [NOTES.md](NOTES.md), how the program is built, the data model, API reference, and the reasoning behind decisions
- [USERGUIDE.md](USERGUIDE.md), what the app does, from a user perspective

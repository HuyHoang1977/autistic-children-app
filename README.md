# Flask + PostgreSQL + Docker Compose Project

This project is a full-stack web application using Flask (Python) for the back-end, PostgreSQL for the database, and a modern JavaScript framework for the front-end. Docker Compose is used for easy setup and orchestration.

## Project Structure

```
flask-postgres-app/
├── back-end/
│   ├── application.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── routes.py
│   │   ├── models/
│   │   ├── views/
│   └── db_data/
│       └── ... (PostgreSQL data/config)
│   └── db/
│       └── init.sql
├── front-end/
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   └── src/
└── README.md
```

## Requirements

- Docker
- Docker Compose
- Python 3.8+ (for local development)
- Node.js & npm (for front-end development)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd flask-postgres-app
```

### 2. Set up environment variables

Edit `back-end/.env` as needed for your database and Flask configuration.

### 3. Run with Docker Compose

```bash
cd back-end
docker-compose up --build
```

The back-end will be available at [http://localhost:5000](http://localhost:5000).

### 4. Run the Front-end

```bash
cd front-end
npm install
npm start
```

The front-end will be available at [http://localhost:3000](http://localhost:3000).

## Development

- To install Python dependencies locally:
  ```bash
  python -m venv venv
  source venv/bin/activate  # Linux/Mac
  venv\Scripts\activate     # Windows
  pip install -r requirements.txt
  ```

- To install front-end dependencies:
  ```bash
  cd front-end
  npm install
  ```

## License

MIT License

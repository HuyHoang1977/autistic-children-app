# Flask + PostgreSQL + Docker Compose Project

## Project Structure

```
flask-postgres-app
├── app
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── routes.py
│   └── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── .env
└── README.md
```

## Requirements

- Docker
- Docker Compose

### 1. Cài đặt môi trường
Nếu chạy cục bộ, tạo môi trường ảo và cài đặt thư viện:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r app/requirements.txt
```

### 2. Chạy Docker Compose
```bash
docker-compose up --build
```

### 3. Truy cập ứng dụng
```bash
 http://localhost:5000
 ```


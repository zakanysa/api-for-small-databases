# API for Small Databases

A comprehensive REST API that can connect to various small databases (SQLite, MySQL, PostgreSQL, MongoDB) and parse different file formats (CSV, Excel, JSON).

## Features

- **Database Support**: SQLite, MySQL, PostgreSQL, MongoDB
- **File Support**: CSV, Excel (.xlsx, .xls), JSON
- **RESTful API**: Clean and intuitive endpoints
- **Error Handling**: Comprehensive error handling and validation
- **File Upload**: Secure file upload with parsing
- **Schema Detection**: Automatic schema detection for files
- **Query Execution**: Execute custom SQL queries safely

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp config/.env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Test the API:**
   ```bash
   node test-api.js
   ```

## API Endpoints

### Database Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/database/connect` | Connect to database |
| GET | `/api/database/connections` | List active connections |
| DELETE | `/api/database/connections/:id` | Close connection |
| GET | `/api/database/connections/:id/tables` | List tables |
| POST | `/api/database/connections/:id/query` | Execute query |
| GET | `/api/database/connections/:id/tables/:name/data` | Get table data |

### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload and parse file |
| GET | `/api/files/parsed` | List parsed files |
| GET | `/api/files/parsed/:id` | Get file info |
| GET | `/api/files/parsed/:id/data` | Get file data |
| GET | `/api/files/parsed/:id/schema` | Get file schema |
| DELETE | `/api/files/parsed/:id` | Remove parsed file |

## Usage Examples

### Connect to SQLite Database

```bash
curl -X POST http://localhost:3000/api/database/connect \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sqlite",
    "config": {"path": "./database.db"}
  }'
```

### Connect to MySQL Database

```bash
curl -X POST http://localhost:3000/api/database/connect \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mysql",
    "config": {
      "host": "localhost",
      "user": "root",
      "password": "password",
      "database": "testdb"
    }
  }'
```

### Upload CSV File

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@sample-data.csv"
```

### Execute SQL Query

```bash
curl -X POST http://localhost:3000/api/database/connections/conn_123/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users WHERE age > ?",
    "params": [25]
  }'
```

## Configuration

Environment variables can be set in `.env`:

```env
PORT=3000
MAX_FILE_SIZE=10485760

# Database configurations
SQLITE_PATH=./data/database.db
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=testdb
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DATABASE=testdb
MONGODB_URI=mongodb://localhost:27017/testdb

# File upload settings
UPLOAD_PATH=./uploads
```

## Architecture

```
src/
├── controllers/      # Route handlers (future expansion)
├── models/          # Database models/schemas (future expansion)
├── routes/          # API route definitions
│   ├── database.js  # Database operations
│   └── files.js     # File operations
├── services/        # Business logic
│   ├── DatabaseManager.js  # Database connections
│   └── FileParser.js       # File parsing
├── middleware/      # Custom middleware
│   ├── upload.js           # File upload handling
│   └── errorHandler.js     # Error handling
└── utils/           # Helper utilities (future expansion)
```

## Supported Database Types

- **SQLite**: Lightweight, file-based database
- **MySQL**: Popular relational database
- **PostgreSQL**: Advanced open-source database
- **MongoDB**: NoSQL document database

## Supported File Types

- **CSV**: Comma-separated values with customizable delimiters
- **Excel**: .xlsx and .xls files with multiple sheet support
- **JSON**: Single objects or arrays of objects

## Error Handling

The API provides comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (database access denied)
- `404` - Not Found (connection/file not found)
- `413` - Payload Too Large (file size limit exceeded)
- `500` - Internal Server Error (unexpected errors)
- `503` - Service Unavailable (database connection issues)

## Security

- Input validation and sanitization
- SQL injection prevention
- File upload restrictions
- Secure error messages
- Environment variable configuration

## Testing

Run the comprehensive test suite:

```bash
node test-api.js
```

This tests all major functionality including:
- Database connections
- File uploads and parsing
- SQL query execution
- Schema detection
- Error handling

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test
```

## License

ISC
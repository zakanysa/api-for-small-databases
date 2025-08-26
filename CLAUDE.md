# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a new project for building an API that can connect to small databases and various file formats (CSV, Excel, JSON, etc.). The repository is currently empty and needs to be initialized based on the step-by-step guide provided.

## Getting Started

Since this is a fresh repository, you'll need to initialize the project structure first:

1. **Initialize Node.js project**: `npm init -y`
2. **Install core dependencies**: 
   ```bash
   npm install express cors helmet morgan dotenv
   npm install sqlite3 mysql2 pg mongodb
   npm install multer csv-parser xlsx
   npm install swagger-jsdoc swagger-ui-express
   npm install --save-dev nodemon jest
   ```

## Recommended Project Structure

```
api-for-small-databases/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models/schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (DatabaseManager, FileParser, QueryBuilder)
│   ├── middleware/     # Custom middleware (auth, error handling, upload)
│   └── utils/          # Helper utilities
├── config/            # Configuration files
├── uploads/           # Temporary file uploads
├── tests/            # Test files
├── docs/             # API documentation
├── .env              # Environment variables
└── server.js         # Main application entry point
```

## Key Components to Implement

### Core Services
- **DatabaseManager**: Unified connection handler for SQLite, MySQL, PostgreSQL, MongoDB
- **FileParser**: Handlers for CSV, Excel, JSON file processing
- **QueryBuilder**: SQL query generation and validation

### API Endpoints Structure
- `POST /api/connect` - Connect to database/file
- `GET /api/tables` - List tables/sheets
- `GET /api/tables/:name/schema` - Get table structure
- `GET /api/tables/:name/data` - Get table data
- `POST /api/query` - Execute custom queries
- `POST /api/upload` - Upload files (CSV, Excel)

## Development Commands

Once initialized:
- **Start development server**: `npm run dev` (with nodemon)
- **Run tests**: `npm test`
- **Start production**: `npm start`

## Security Considerations

- Implement input validation and SQL injection prevention
- Add file upload restrictions and validation
- Use environment variables for sensitive configuration
- Implement rate limiting for API endpoints
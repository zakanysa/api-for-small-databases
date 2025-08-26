const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const databaseRoutes = require('./src/routes/database');
const fileRoutes = require('./src/routes/files');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'API for Small Databases',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'Database Operations': {
        'POST /api/database/connect': 'Connect to database',
        'GET /api/database/connections': 'List active connections',
        'DELETE /api/database/connections/:id': 'Close connection',
        'GET /api/database/connections/:id/tables': 'List tables',
        'POST /api/database/connections/:id/query': 'Execute query',
        'GET /api/database/connections/:id/tables/:name/data': 'Get table data'
      },
      'File Operations': {
        'POST /api/files/upload': 'Upload and parse file',
        'GET /api/files/parsed': 'List parsed files',
        'GET /api/files/parsed/:id': 'Get file info',
        'GET /api/files/parsed/:id/data': 'Get file data',
        'GET /api/files/parsed/:id/schema': 'Get file schema',
        'DELETE /api/files/parsed/:id': 'Remove parsed file'
      }
    }
  });
});

app.use('/api/database', databaseRoutes);
app.use('/api/files', fileRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API for Small Databases running on port ${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} for API documentation`);
});

module.exports = app;
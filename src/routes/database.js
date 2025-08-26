const express = require('express');
const router = express.Router();
const DatabaseManager = require('../services/DatabaseManager');

router.post('/connect', async (req, res, next) => {
  try {
    const { type, config } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: { message: 'Database type is required' }
      });
    }

    if (!config) {
      return res.status(400).json({
        success: false,
        error: { message: 'Database configuration is required' }
      });
    }

    const result = await DatabaseManager.connect(type, config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/connections', async (req, res, next) => {
  try {
    const connections = DatabaseManager.listConnections();
    
    res.json({
      success: true,
      data: {
        connections,
        count: connections.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/connections/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const result = await DatabaseManager.disconnect(connectionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: { message: 'Connection not found' }
      });
    }

    res.json({
      success: true,
      message: 'Connection closed successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/connections/:connectionId/tables', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const tables = await DatabaseManager.getTables(connectionId);
    
    res.json({
      success: true,
      data: {
        connectionId,
        tables,
        count: tables.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/connections/:connectionId/query', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { query, params = [] } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query is required' }
      });
    }

    const result = await DatabaseManager.executeQuery(connectionId, query, params);
    
    res.json({
      success: true,
      data: {
        connectionId,
        query,
        result
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/connections/:connectionId/tables/:tableName/data', async (req, res, next) => {
  try {
    const { connectionId, tableName } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const query = `SELECT * FROM ${tableName} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const result = await DatabaseManager.executeQuery(connectionId, query);
    
    res.json({
      success: true,
      data: {
        connectionId,
        table: tableName,
        rows: result.rows,
        count: result.rowCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
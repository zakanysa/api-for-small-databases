const express = require('express');
const router = express.Router();
const FileParser = require('../services/FileParser');
const upload = require('../middleware/upload');
const fs = require('fs');

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const options = {
      delimiter: req.body.delimiter,
      headers: req.body.headers !== 'false',
      skipEmpty: req.body.skipEmpty !== 'false'
    };

    const result = await FileParser.parseFile(req.file.path, options);
    
    res.json({
      success: true,
      data: {
        fileId: result.fileId,
        type: result.type,
        filename: req.file.originalname,
        size: req.file.size,
        ...result
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
});

router.get('/parsed', async (req, res, next) => {
  try {
    const files = FileParser.listParsedFiles();
    
    res.json({
      success: true,
      data: {
        files,
        count: files.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/parsed/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = FileParser.getParsedFile(fileId);
    
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    next(error);
  }
});

router.get('/parsed/:fileId/data', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { sheet, limit = 100, offset = 0 } = req.query;
    
    const fileData = FileParser.getFileData(fileId, sheet);
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = fileData.data.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        fileId,
        sheet: sheet || 'default',
        rows: paginatedData,
        headers: fileData.headers,
        totalRows: fileData.rowCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < fileData.rowCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/parsed/:fileId/schema', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { sheet } = req.query;
    
    const schema = FileParser.getFileSchema(fileId, sheet);
    const fileData = FileParser.getFileData(fileId, sheet);
    
    res.json({
      success: true,
      data: {
        fileId,
        sheet: sheet || 'default',
        schema,
        headers: fileData.headers,
        rowCount: fileData.rowCount
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/parsed/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const result = FileParser.removeFile(fileId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    res.json({
      success: true,
      message: 'File removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
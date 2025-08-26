const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

axios.defaults.baseURL = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('🧪 Testing API for Small Databases\n');

    // Test 1: Check API status
    console.log('1. Testing API status...');
    const status = await axios.get('/');
    console.log('✅ API is running:', status.data.message);
    console.log('');

    // Test 2: Test file upload
    console.log('2. Testing file upload...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('./sample-data.csv'));
    
    const uploadResult = await axios.post('/api/files/upload', formData, {
      headers: formData.getHeaders()
    });
    console.log('✅ File uploaded:', uploadResult.data.data.filename);
    console.log('   File ID:', uploadResult.data.data.fileId);
    console.log('   Rows:', uploadResult.data.data.rowCount);
    console.log('');

    const fileId = uploadResult.data.data.fileId;

    // Test 3: Get file data
    console.log('3. Testing file data retrieval...');
    const fileData = await axios.get(`/api/files/parsed/${fileId}/data`);
    console.log('✅ Retrieved file data');
    console.log('   Headers:', fileData.data.data.headers);
    console.log('   Sample row:', fileData.data.data.rows[0]);
    console.log('');

    // Test 4: Get file schema
    console.log('4. Testing file schema...');
    const schema = await axios.get(`/api/files/parsed/${fileId}/schema`);
    console.log('✅ Retrieved file schema');
    console.log('   Schema:', JSON.stringify(schema.data.data.schema, null, 2));
    console.log('');

    // Test 5: Test SQLite connection
    console.log('5. Testing SQLite database connection...');
    const dbConnection = await axios.post('/api/database/connect', {
      type: 'sqlite',
      config: { path: './test.db' }
    });
    console.log('✅ SQLite connected:', dbConnection.data.data.connectionId);
    console.log('');

    const connectionId = dbConnection.data.data.connectionId;

    // Test 6: Create a test table
    console.log('6. Creating test table...');
    const createTable = await axios.post(`/api/database/connections/${connectionId}/query`, {
      query: `
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          age INTEGER,
          city TEXT,
          salary REAL
        )
      `
    });
    console.log('✅ Test table created');
    console.log('');

    // Test 7: Insert sample data
    console.log('7. Inserting sample data...');
    const insertData = await axios.post(`/api/database/connections/${connectionId}/query`, {
      query: `
        INSERT OR REPLACE INTO employees (id, name, age, city, salary) VALUES
        (1, 'John Doe', 30, 'New York', 50000),
        (2, 'Jane Smith', 25, 'Los Angeles', 45000),
        (3, 'Mike Johnson', 35, 'Chicago', 55000)
      `
    });
    console.log('✅ Sample data inserted');
    console.log('');

    // Test 8: Query the database
    console.log('8. Querying database...');
    const queryResult = await axios.post(`/api/database/connections/${connectionId}/query`, {
      query: 'SELECT * FROM employees WHERE age > ?',
      params: [28]
    });
    console.log('✅ Query executed');
    console.log('   Results:', queryResult.data.data.result.rows);
    console.log('');

    // Test 9: List tables
    console.log('9. Listing database tables...');
    const tables = await axios.get(`/api/database/connections/${connectionId}/tables`);
    console.log('✅ Tables listed:', tables.data.data.tables);
    console.log('');

    // Test 10: Get table data
    console.log('10. Getting table data...');
    const tableData = await axios.get(`/api/database/connections/${connectionId}/tables/employees/data`);
    console.log('✅ Table data retrieved');
    console.log('    Rows:', tableData.data.data.count);
    console.log('    Sample:', tableData.data.data.rows[0]);
    console.log('');

    console.log('🎉 All tests passed! API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
/* eslint-disable */
const mongoose = require('mongoose');

// Manually parse .env if --env-file not used, but we will use --env-file
// Just in case, simple parser:
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log('Could not read .env file manually:', e.message);
}

const uri = process.env.DB_CONNECTION;
console.log('Testing DB Connection...');
console.log('URI present:', !!uri);

if (!uri || uri.includes('<db_password>')) {
    console.error('ERROR: DB_CONNECTION contains placeholder <db_password> or is missing.');
    console.error('Current URI:', uri);
    process.exit(1);
}

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Successfully connected to MongoDB!');
        
        // Also check if we can write to the DB
        const collection = mongoose.connection.collection('connection_test');
        await collection.insertOne({ test: true, date: new Date() });
        console.log('Write test successful!');
        await collection.deleteOne({ test: true });
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
}

test();

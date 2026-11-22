
require("dotenv").config();

const pool = require("./config/database");

async function testDatabase() {
    try {
        const result = await pool.query(`
            SELECT
                NOW() AS server_time,
                current_database() AS database_name,
                version() AS postgres_version
        `);

        console.log("================================");
        console.log("ULAGU NEON DATABASE");
        console.log("================================");

        console.log("Connection: SUCCESS");
        console.log("Database:", result.rows[0].database_name);
        console.log("Server time:", result.rows[0].server_time);
        console.log("PostgreSQL:", result.rows[0].postgres_version);

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testDatabase();

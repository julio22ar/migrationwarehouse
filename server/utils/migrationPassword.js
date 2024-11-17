
// server/utils/migratePasswords.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Definimos las variables de la base de datos directamente en el script
const DB_HOST = 'localhost';
const DB_USER = 'b0dega_user';
const DB_PASSWORD = 'Crazyjuan2114.';
const DB_DATABASE = 'inventory_system';

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migratePasswords() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Iniciar transacción
        await connection.beginTransaction();

        // Obtener usuarios cuyas contraseñas no están hasheadas (menos de 60 caracteres)
        const [users] = await connection.execute(
            'SELECT id, password FROM users WHERE LENGTH(password) < 60'
        );

        console.log(`Encontrados ${users.length} usuarios para migrar`);

        // Hashear cada contraseña
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await connection.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, user.id]
            );
            console.log(`Migrada contraseña para usuario ID: ${user.id}`);
        }

        // Commit de la transacción
        await connection.commit();
        console.log('Migración completada exitosamente');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error durante la migración:', error);
    } finally {
        if (connection) {
            connection.release();
        }
        process.exit();
    }
}

migratePasswords();


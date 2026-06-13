const {getConnection} = require('../config/database');

class Province {
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM provinces ORDER BY nompro'
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM provinces WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create(provinceData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'INSERT INTO provinces (nompro, cdepro) VALUES (?, ?)',
            [provinceData.nompro, provinceData.cdepro]
        );

        return {id: result.insertId, ...provinceData};
    }
}

module.exports = Province;

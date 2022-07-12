import queryDB from './index.js';

export default {
    signUpUser: async (nickname, passwd) => {
        const [rows, fields] = await queryDB(
            'INSERT INTO Users (nickname, passwd) VALUES (?, ?)',
            [nickname, passwd]
        );
        return rows.insertId;
    },
    isNicknameInUse: async (nickname) => {
        const [rows, fields] = await queryDB(
            'SELECT EXISTS(SELECT * FROM Users WHERE nickname = ?)',
            [nickname]
        );
        return Boolean(Object.values(rows[0])[0]);
    },
    findByNickname: async (nickname) => {
        const [rows, fields] = await queryDB(
            'SELECT id, passwd FROM Users WHERE nickname = ? LIMIT 1',
            [nickname]
        );
        return rows.length === 0 ? null : rows[0];
    }
};

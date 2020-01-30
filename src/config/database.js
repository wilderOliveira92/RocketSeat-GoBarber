module.exports = {
    dialect: 'postegres',
    host: 'localhost', //192.168.99.100
    username: 'postegres',
    password: 'docker',
    database: 'gobarber',
    define: {
        timestamps: true,
        underscored: true,
        underscoredAll: true,
    }
};

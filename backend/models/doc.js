const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    candidat_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    concours_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    nomdoc: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nom_fichier: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    chemin_fichier: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    statut: {
        type: DataTypes.ENUM('en_attente', 'valide', 'rejete'),
        defaultValue: 'en_attente',
    },
    commentaire: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    validated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    validated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Document;

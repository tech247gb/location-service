import { sequelize } from "../config/dbConfig.js";
import { DataTypes } from "sequelize";

export const locModels = sequelize.define("location", {
  Id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
  },
  Longitude: DataTypes.STRING,
  Latitude: DataTypes.STRING,
  Data: DataTypes.STRING,
});

export const limitModel = sequelize.define("limitRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ip: {
    type: DataTypes.STRING,
  },
  count: {
    type: DataTypes.INTEGER,
  },
});

export const allowedIPs = sequelize.define("allowedips", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement: true,
  },
  user_id: {
    type:DataTypes.INTEGER,
  },
  ip: {
    type: DataTypes.STRING,
  },
});

export const apiKEYs = sequelize.define("apikeys", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement:true,
  },
  api_key: {
    type: DataTypes.STRING,
  },
});

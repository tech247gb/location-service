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

/**
 *  This will create a migration
 *  Model Migrations for queued locations
 * 
 */
export const queuedLocationModel = sequelize.define('queued-locations', {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement:true,
  },
  latitude: {
    type: DataTypes.STRING,
  },
  longitude: {
    type: DataTypes.STRING,
  },
  backUrl: {
    type: DataTypes.TEXT, // Update data type to TEXT
    get() {
      const backUrlString = this.getDataValue('backUrl');
      return backUrlString ? JSON.parse(backUrlString) : null; // Deserialize the JSON string to an array
    },
    set(backUrlArray) {
      this.setDataValue('backUrl', JSON.stringify(backUrlArray)); // Serialize the array to a JSON string
    },
  },
  corresponding_location: {
    type: DataTypes.STRING,
  },
  isQueued: {
    type: DataTypes.BOOLEAN,
  },
})

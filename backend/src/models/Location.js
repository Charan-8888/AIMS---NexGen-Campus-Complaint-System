const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    campus: {
      type: String,
      required: true,
      trim: true,
      default: 'NexGen University',
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    room: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true, // e.g. "Computer Lab", "Corridor", "Washroom"
    },
    // Geospatial: GeoJSON Point for 2dsphere index
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Geospatial index
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ building: 1 });
locationSchema.index({ campus: 1, building: 1, floor: 1 });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;

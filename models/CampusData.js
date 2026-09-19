const mongoose = require('mongoose');

const CampusDataSchema = new mongoose.Schema({
  poll: {
    question: {
      type: String,
      default: "Friday's Quarter-Final: Who will take the victory on the school ground?",
    },
    badge: {
      type: String,
      default: 'Jankapur High School Football Championship',
    },
    options: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    voters: [{ type: String }], // Array of user IDs who have already voted
  },
  riddle: {
    question: {
      type: String,
      default: 'A clock strikes 6 times in 5 seconds. How many seconds will it take to strike 12 times?',
    },
    subtext: {
      type: String,
      default: 'Madhyamik Logic Boost',
    },
    answer: {
      type: String,
      default:
        'It takes 11 seconds! Explanation: Between 6 strikes there are 5 intervals. 5 seconds ÷ 5 intervals = 1 second per interval. For 12 strikes, there are 11 intervals × 1 second = 11 seconds.',
    },
  },
  spotlights: [
    {
      name: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      icon: { type: String, default: '⭐' },
      color: { type: String, default: 'amber' },
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CampusData', CampusDataSchema);

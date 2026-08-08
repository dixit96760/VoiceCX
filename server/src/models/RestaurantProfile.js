const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Special'], default: 'Main Course' },
  price: { type: Number, default: 15.99 },
  description: { type: String, default: '' },
});

const restaurantProfileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantName: {
      type: String,
      required: true,
      default: 'Gourmet Haven Bistro',
    },
    cuisineType: {
      type: String,
      default: 'Italian & Artisan Pizza',
    },
    voiceAgentTone: {
      type: String,
      enum: ['Friendly & Warm', 'Professional & Efficient', 'Casual & Fun', 'Empathetic & Attentive'],
      default: 'Friendly & Warm',
    },
    menuItems: [menuItemSchema],
    greetingScript: {
      type: String,
      default: 'Hello! Thank you for calling Gourmet Haven Bistro. I am your AI feedback assistant calling to check how your dining experience was today.',
    },
    generatedScript: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RestaurantProfile', restaurantProfileSchema);

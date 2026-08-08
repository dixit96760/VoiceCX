const RestaurantProfile = require('../models/RestaurantProfile');
const { generateVoiceScript } = require('../services/geminiService');
const { getIsConnected } = require('../config/db');

// In-memory restaurant profile fallback
const memoryProfiles = {};

exports.getProfile = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const ownerId = req.user.id;

    if (isDb) {
      let profile = await RestaurantProfile.findOne({ ownerId });
      if (!profile) {
        profile = await RestaurantProfile.create({
          ownerId,
          restaurantName: req.user.name ? `${req.user.name}'s Kitchen` : 'Gourmet Haven Bistro',
          cuisineType: 'Modern Italian & Wood-fired Pizzas',
          voiceAgentTone: 'Friendly & Warm',
          menuItems: [
            { name: 'Truffle Mushroom Risotto', category: 'Main Course', price: 24.50, description: 'Arborio rice, black truffle, wild mushrooms, parmesan' },
            { name: 'Wood-Fired Margherita Pizza', category: 'Main Course', price: 18.00, description: 'San Marzano tomatoes, fresh mozzarella, basil' },
            { name: 'Crispy Calamari Fritti', category: 'Appetizer', price: 14.50, description: 'Served with house-made lemon aioli' },
            { name: 'House Artisanal Tiramisu', category: 'Dessert', price: 10.50, description: 'Espresso-infused ladyfingers with whipped mascarpone' }
          ]
        });
      }
      return res.json(profile);
    } else {
      if (!memoryProfiles[ownerId]) {
        memoryProfiles[ownerId] = {
          _id: 'prof_' + ownerId,
          ownerId,
          restaurantName: req.user.restaurantName || 'Gourmet Haven Bistro',
          cuisineType: 'Italian & Artisan Wood-fired Pizza',
          voiceAgentTone: 'Friendly & Warm',
          menuItems: [
            { name: 'Truffle Mushroom Risotto', category: 'Main Course', price: 24.50, description: 'Arborio rice, black truffle, wild mushrooms, parmesan' },
            { name: 'Wood-Fired Margherita Pizza', category: 'Main Course', price: 18.00, description: 'San Marzano tomatoes, fresh mozzarella, basil' },
            { name: 'Crispy Calamari Fritti', category: 'Appetizer', price: 14.50, description: 'Served with house-made lemon aioli' },
            { name: 'House Artisanal Tiramisu', category: 'Dessert', price: 10.50, description: 'Espresso-infused ladyfingers with whipped mascarpone' }
          ],
          greetingScript: 'Hello! Thank you for dining at Gourmet Haven Bistro. I am your AI feedback concierge calling to ask how your meal was.',
          generatedScript: 'Hi! This is the automated customer feedback assistant for Gourmet Haven Bistro...'
        };
      }
      return res.json(memoryProfiles[ownerId]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const ownerId = req.user.id;
    const { restaurantName, cuisineType, voiceAgentTone, menuItems, greetingScript } = req.body;

    if (isDb) {
      let profile = await RestaurantProfile.findOne({ ownerId });
      if (!profile) {
        profile = new RestaurantProfile({ ownerId });
      }

      if (restaurantName) profile.restaurantName = restaurantName;
      if (cuisineType) profile.cuisineType = cuisineType;
      if (voiceAgentTone) profile.voiceAgentTone = voiceAgentTone;
      if (menuItems) profile.menuItems = menuItems;
      if (greetingScript) profile.greetingScript = greetingScript;

      await profile.save();
      return res.json(profile);
    } else {
      if (!memoryProfiles[ownerId]) {
        memoryProfiles[ownerId] = { ownerId };
      }
      const existing = memoryProfiles[ownerId];
      memoryProfiles[ownerId] = {
        ...existing,
        restaurantName: restaurantName || existing.restaurantName,
        cuisineType: cuisineType || existing.cuisineType,
        voiceAgentTone: voiceAgentTone || existing.voiceAgentTone,
        menuItems: menuItems || existing.menuItems,
        greetingScript: greetingScript || existing.greetingScript,
      };
      return res.json(memoryProfiles[ownerId]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

exports.generateScript = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const ownerId = req.user.id;

    let profile;
    if (isDb) {
      profile = await RestaurantProfile.findOne({ ownerId });
    } else {
      profile = memoryProfiles[ownerId];
    }

    const restaurantName = profile?.restaurantName || req.user.restaurantName || 'Gourmet Haven Bistro';
    const cuisineType = profile?.cuisineType || 'Italian';
    const voiceAgentTone = profile?.voiceAgentTone || 'Friendly & Warm';
    const menuItems = profile?.menuItems || req.body.menuItems || [];

    const scriptData = await generateVoiceScript({
      restaurantName,
      cuisineType,
      voiceAgentTone,
      menuItems,
    });

    const scriptString = typeof scriptData === 'object' ? JSON.stringify(scriptData, null, 2) : scriptData;

    if (isDb && profile) {
      profile.generatedScript = scriptString;
      await profile.save();
    } else if (memoryProfiles[ownerId]) {
      memoryProfiles[ownerId].generatedScript = scriptString;
    }

    return res.json({
      success: true,
      scriptData,
      rawScript: scriptString,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating AI voice script', error: error.message });
  }
};

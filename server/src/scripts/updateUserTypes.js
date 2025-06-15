const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Update all users with userType 'patient' to 'user'
    const result = await User.updateMany(
      { userType: 'patient' },
      { $set: { userType: 'user' } }
    );

    console.log(`Updated ${result.modifiedCount} users from 'patient' to 'user'`);
    
    // Close the connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating user types:', error);
    process.exit(1);
  }
}

updateUserTypes(); 
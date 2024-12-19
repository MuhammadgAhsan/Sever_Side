
const express=require("express")
const mongoose=require("mongoose");
const cors = require("cors");

const app=express()
app.use(cors());
app.use(express.json());

// add schme register
const userSchema = new mongoose.Schema({
  fname: {
      type: String,
      required: true,
      trim: true
  },
  lname: {
      type: String,
      required: true,
      trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
},
  email: {
      type: String,
      required: true,
      unique: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email address']
  },
  password: {
      type: String,
      required: true,
      minlength: 8
  },
  gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other']
  },
  bgroup: {
      type: String,
      required: true,
      
  },
  phone: {
      type: String,
      required: true,
      match: [/^\d{11}$/, 'Please enter a valid phone number (11 digits)']
  },
  age: {
      type: Number,
      required: true,
      min: 0,
      max: 120
  },
  address: {
      type: String,
     
      trim: true
  },
  city: {
    type: String,
    
    trim: true
},
specialist: {
  type: String,
  default:"nothing",
  
  trim: true
},
experience: {
      type: String,
      default:"nothing",
      trim: true
  }
});

const  userCOllection = mongoose.model('user',userSchema);
//appointmentSchema
const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // User reference (patient)
  problem: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Doctor (can be null initially)
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'completed'], 
    default: 'pending'  // Default status is 'pending'
  },
}, {
  timestamps: true,  
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

  app.get('/appointments', async (req, res) => {
    const { userId } = req.query;  // The userId should be sent as a query paramete  console.log(userId,"slakldklsk")
    const Appointment = mongoose.model('Appointment', appointmentSchema);
    const User = mongoose.model('User', userSchema);  // Ensure the User model is correctly referenced
  console.log(userId,"sksksk")
    try {
        // Find appointments for the given userId, populate both doctor and user details
        const appointments = await Appointment.find({ userId })
            .populate('doctorId', 'email fname lname')  // Populate doctor details (without password)
            .populate('userId', 'fname lname email age phone address city')  // Populate user details (exclude password)
            .sort({ appointmentDate: 1 });  // Sort by appointment date, ascending
  
        // If no appointments are found for the user, return a 404 response
        if (appointments.length === 0) {
            return res.status(404).json({ message: 'No appointments found for this user.' });
        }
  
        // Send the appointments back as a JSON response
        res.status(200).json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  
  
  const PORT = 8082;
  mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
          console.log("Connected to MongoDB");
          app.listen(PORT, () => {
              console.log(`Server running on http://localhost:${PORT}`);
          });
      })
      .catch(err => {
          console.error("Failed to connect to MongoDB", err);
      });
  
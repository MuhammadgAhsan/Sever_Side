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
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
  }

  try {
      const appointments = await Appointment.find({ userId: mongoose.Types.ObjectId(userId) })
          .populate('doctorId', 'fname lname email')
          .populate('userId', 'fname lname email age phone address city')
          .sort({ appointmentDate: 1 });

      if (!appointments.length) {
          return res.status(404).json({ message: 'No appointments found for this user.' });
      }

      res.status(200).json(appointments);
  } catch (err) {
      console.error('Error fetching appointments:', err);
      res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});


// api resgister
app.post("/login", async (req, res) => {
  const { email, password,role } = req.body;
  console.log(role)

  try {
  
    const user = await userCOllection.findOne({ email });
    console.log("userDta",user)
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Check if the password matches
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid password!" });
    }
 
    // Respond with success message
    res.status(200).json({
      message: "Login successful!",
      userId: user._id,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/register", async (req, res) => {
  console.log("Request Body:", req.body); // Log incoming data for debugging

  try {
      // Create a new user instance
      const newUser = new userCOllection(req.body);

      // Save user to the database
      await newUser.save();

      res.status(201).json({
          message: "User registered successfully",
          user: {
              id: newUser._id,
              fname: newUser.fname,
              lname: newUser.lname,
              email: newUser.email,
              gender: newUser.gender,
              city: newUser.city
          }
      });
  } catch (error) {
      console.error("Error during registration:", error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
          res.status(400).json({ message: error.message, errors: error.errors });
      } else if (error.code === 11000) {
          // Handle unique constraint (e.g., email already exists)
          res.status(409).json({ message: "Email already in use" });
      } else {
          res.status(500).json({ message: "Internal Server Error" });
      }
  }
});

//  close all register

app.put("/update-password", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Use findOneAndUpdate to find the user by email and update the password
    const updatedUser = await userCOllection.findOneAndUpdate(
      { email },  // Find user by email
      { 
        $set: { password },  // Update password field
      },
      { 
        new: true,  // Return the updated user
        runValidators: true,  // Run validation on the update
      }
    );

    // If the user doesn't exist
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if the role matches
    if (updatedUser.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(400).json({ message: "User role does not match." });
    }

    // Return success response
    res.status(200).json({
      message: "Password updated successfully!",
      userId: updatedUser._id,
      role: updatedUser.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});








// all doctor api
app.get('/doctor', async (req, res) => {
    try {
        const users = await userCOllection.find({role:"Doctor"}); // Fetch all users from the collection
        res.status(200).json(users); // Send users as a JSON response
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.delete('/doctordel/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if the user exists
        const user = await userCOllection.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



// Fetch all appointments with doctor details


app.get('/appointments', async (req, res) => {
  const { userId } = req.query;



  try {
      // Correct query with new ObjectId()
      const appointments = await Appointment.find({})
    .sort({ appointmentDate: 1 });

console.log(appointments)
      if (!appointments.length) {
          console.warn("No appointments found for userId:", userId);
          return res.status(404).json({ message: 'No appointments found for this user.' });
      }

      console.log("Appointments fetched successfully:", appointments);
      res.status(200).json(appointments);
  } catch (err) {
      console.error("Error fetching appointments:", err);
      res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});



  app.delete('/appointments/:id', async (req, res) => {
    const { id } = req.params;  // Get appointment ID from the request parameter
  
    try {
      // Find and delete the appointment by its ID
      const appointment = await Appointment.findByIdAndDelete(id);
  
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to delete appointment' });
    }
  });
  app.get('/Allappointments', async (req, res) => {
    try {
      const Appointment = mongoose.model('Appointment', appointmentSchema);
      const User = mongoose.model('User', userSchema); 
      const appointments = await Appointment.find({status:"pending"})
      .populate('userId', 'fname lname email age phone address city')   // Populate doctorId with doctor's email, fname, lname
        .sort({ appointmentDate: 1 });
  
      if (appointments.length === 0) {
        return res.status(404).json({ message: 'No appointments found' });
      }
  
      res.status(200).json(appointments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  app.put('/appointments/assign', async (req, res) => {
 
    const { doctorId ,appointmentId} = req.body;
    console.log(doctorId,appointmentId,"sksk")
  
    try {
      const Appointment = mongoose.model('Appointment', appointmentSchema);
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      appointment.doctorId = doctorId;
      appointment.status="assigned" // Assign the doctor
      await appointment.save();
  
      res.status(200).json({ message: "Doctor assigned successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign doctor" });
    }
  });

// Aggregated stats for user roles (Patient, Doctor, Admin)
app.get('/userRoleStats', async (req, res) => {
  try {
    const User = mongoose.model('User', userSchema); 
    // Count total users by role
    const totalPatients = await User.countDocuments({ role: 'Patient' });
    const totalDoctors = await User.countDocuments({ role: 'Doctor' });
    const totalAdmins = await User.countDocuments({ role: 'Admin' });

    // Send the aggregated data as a response
    res.status(200).json({
      totalPatients,
      totalDoctors,
      totalAdmins,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user role stats' });
  }
});

app.get('/appointmentsStats', async (req, res) => {
  try {
    // Count total appointments
    const totalAppointments = await Appointment.countDocuments();

    // Count appointments by status
    const totalPendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const totalAssignedAppointments = await Appointment.countDocuments({ status: 'assigned' });
    const totalCompletedAppointments = await Appointment.countDocuments({ status: 'completed' });

    // Send the aggregated data as a response
    res.status(200).json({
      totalAppointments,
      totalPendingAppointments,
      totalAssignedAppointments,
      totalCompletedAppointments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching appointment stats' });
  }
});
  // all appointmentsAssigned for doctor
  app.get('/appointmentsAssigned', async (req, res) => {
    const doctorId=req.params.userId;
    try {
      const Appointment = mongoose.model('Appointment', appointmentSchema);
    const User = mongoose.model('User', userSchema); 
      const appointments = await Appointment.find({status:"assigned"})
      .populate('userId', 'fname lname email age phone address city')   // Populate doctorId with doctor's email, fname, lname
        .sort({ appointmentDate: 1 });
  
      if (appointments.length === 0) {
        return res.status(404).json({ message: 'No appointments found' });
      }
  
      res.status(200).json(appointments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });
  // Endpoint to save the doctor's description after a check-up
app.put('/Checkup/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: "Description cannot be empty" });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if the user is authorized (e.g., if the current user is the assigned doctor)
    // if (appointment.doctorId.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ message: "Unauthorized to add description for this appointment" });
    // }

    // Update the description for the appointment
    appointment.description = description;
    appointment.status = 'completed'; // You can change the status to 'completed' after the check-up

    await appointment.save();

    res.status(200).json({ message: 'Description saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save description' });
  }
});

const PORT = 8082;
mongoose.connect('mongodb+srv://ah7an07:4d8CxyozofrkLOam@cluster0.fg06i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB", err);
    });

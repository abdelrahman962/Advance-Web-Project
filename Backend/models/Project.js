

const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./User'); 
const projectSchema = new Schema({
  projectTitle: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
  },
  projectDescription: {
    type: String,
    required: [true, "Project description is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date',
    },
  },
  projectStatus: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Pending'
  },
  assignedStudents: [{  
    type: Schema.Types.ObjectId, 
    ref: 'User',                  
    required: [true, "Assigned user is required"],
  }],
  adminName: {
    type: String,
    required: [true, "Admin name is required"],
  }
});

projectSchema.pre('save', async function (next) {
  try {
   
    if (this.assignedStudents && this.assignedStudents.length > 0) {
      for (const studentId of this.assignedStudents) {
        const user = await User.findById(studentId); // Find by ID
        if (!user) {
          return next(new Error(`Assigned user with ID ${studentId} does not exist.`));
        }
        if (user.role !== 'Student') {
          return next(new Error(`Assigned user with ID ${studentId} must have role "Student".`));
        }
      }
    }
 
    const admin = await User.findOne({ name: this.adminName });
    if (!admin) {
      return next(new Error('Admin user does not exist.'));
    }
    if (admin.role !== 'Admin') {
      return next(new Error('Project creator must have role "Admin".'));
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;

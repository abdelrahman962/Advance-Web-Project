const mongoose = require('mongoose');
const User = require('./User');
const Project = require('./Project');

const taskSchema = new mongoose.Schema({
    projectTitle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Task must belong to a project']
    },
    taskName: {
        type: String,
        required: [true, 'Task name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Task description is required'],
        trim: true
    },
    assignedStudents: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must be assigned to a student']
    }],
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
        default: 'Pending'
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    }
}, { timestamps: true });


taskSchema.pre('save', async function (next) {
    try {
        
        const students = await User.find({ _id: { $in: this.assignedStudents } });
        if (students.length !== this.assignedStudents.length) {
            return next(new Error('One or more assigned users do not exist.'));
        }
        for (const student of students) {
             if (student.role !== 'Student') {
                return next(new Error('All assigned users must have role "Student".'));
             }
        }
        next();
    } catch (err) {
        next(err);
    }
});


const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
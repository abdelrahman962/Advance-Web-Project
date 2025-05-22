const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ChatMessageModel = require('./models/ChatMessage');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const { ApolloServer } = require('apollo-server');
const WebSocket = require('ws');

const resolvers = {
  Query: {

    users: async () => {
      try {
        const students = await User.find({ role: 'Student' });
        return students.map(student => ({ ...student.toObject(), id: student._id.toString() }));
      } catch (error) {
        throw new Error('Failed to fetch students');
      }
    },
    admins: async () => {
      try {
        const admins = await User.find({ role: 'Admin' });
        return admins.map(admin => ({ ...admin.toObject(), id: admin._id.toString() }));
      } catch (error) {
        throw new Error('Failed to fetch admins');
      }
    },
    adminTasks: async (_, { adminId }) => {
      try {
        console.log("adminId: ",adminId)
        const projects = await mongoose.model('Project').find({ adminName: adminId });
        if (!projects || projects.length === 0) {
          return [];
        }
        const projectIds = projects.map(project => project._id);
        const tasks = await Task.find({ projectTitle: { $in: projectIds } })
          .populate({
            path: 'projectTitle',
            select: 'id projectTitle'
          })
          .populate({
            path: 'assignedStudents',
            select: 'id name',
          });
        return tasks;
      } catch (error) {
        console.error("Error fetching admin tasks:", error);
        throw new Error("Failed to fetch tasks for admin.");
      }
    },
    receivedMessages: async (_, { receiverId }) => {
      try {
        const messages = await ChatMessageModel.find({ receiver: receiverId })
          .populate('sender')
          .populate('receiver')
          .sort({ timestamp: 1 });
        return messages.map(message => ({
          ...message.toObject(),
          id: message._id.toString(),
          sender: message.sender ? { ...message.sender.toObject(), id: message.sender._id.toString() } : null,
          receiver: message.receiver ? { ...message.receiver.toObject(), id: message.receiver._id.toString() } : null,
          timestamp: message.timestamp.toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching received messages:", error);
        throw new Error("Failed to fetch received messages");
      }
    },
    user: async (_, { id, name }) => {
      try {
        if (id) {
          const user = await User.findById(id);
          if (!user) {
            throw new Error(`User with ID "${id}" not found`);
          }
          return user;
        } else if (name) {
          const userName = await User.findOne({ name });
          if (!userName) {
            throw new Error(`User with name "${name}" not found`);
          }
          return userName;
        } else {
          throw new Error("You must provide either 'id' or 'name' to query a user.");
        }
      } catch (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
    },
    projects: async () => {
      try {
        console.log("Fetching projects...");
        const projects = await Project.find({}).populate({
          path: 'assignedStudents',
          model: 'User'
        });
        console.log("Projects fetched:", projects);
        return projects;
      } catch (error) {
        throw new Error('Failed to fetch projects');
      }
    },
    project: async (_, { id }) => {
      try {
        return await Project.findById(id).populate('assignedStudent');
      } catch (error) {
        throw new Error(`Failed to fetch project with ID ${id}`);
      }
    },
    tasks: async (parent) => {
      try {
        return await Task.find({ projectTitle: parent.id })
          .populate('assignedStudents', 'id name')
          .populate({ path: 'projectTitle', select: 'id projectTitle' });
      } catch (error) {
        throw new Error(`Failed to fetch tasks for project ${parent.id}`);
      }
    },
    task: async (_, { id }) => {
      try {
        return await Task.findById(id).populate('assignedStudent').populate('projectTitle');
      } catch (error) {
        throw new Error(`Failed to fetch task with ID ${id}`);
      }
    },
    numberOfStudents: async () => {
      try {
        const studentCount = await User.countDocuments({ role: 'Student' });
        return studentCount;
      } catch (error) {
        throw new Error('Failed to fetch number of students');
      }
    },
    numberOfTasks: async()=>{
try{
  const taskCount=await Task.countDocuments();
  return taskCount;
}catch(error){
        throw new Error('Failed to fetch number of tasks');
}
       
    },
    numberOfProjects: async()=>{
try{
  const projectCount=await Project.countDocuments();
  return projectCount;
}catch(error){
        throw new Error('Failed to fetch number of projects');
}
       
    },
 numberOfFinishedProjects: async()=>{
try{
  const projectCount=await Project.countDocuments({projectStatus: 'Completed'});
  return projectCount;
}catch(error){
        throw new Error('Failed to fetch number of finished projects');
}
       
    },



    
    projectsByAdmin: async (_, { adminName }) => {
      try {
        const projects = await Project.find({ adminName: adminName }).populate({
          path: 'assignedStudents',
          model: 'User'
        });
        return projects;
      } catch (error) {
        throw new Error(`Failed to fetch projects for admin: ${adminName}`);
      }
    },
      tasksByAdmin: async (_, { projectId }) => {
  try {
    // 1. Find the project by ID.
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error(`Project with ID "${projectId}" not found`);
    }

    // 2. Find tasks for the project.
    const tasks = await Task.find({ projectTitle: projectId }).populate({
      path: 'assignedStudents',
      model: 'User'
    });

    return tasks;
  } catch (error) {
    console.error("Error fetching tasks by project ID:", error);
    throw new Error(`Failed to fetch tasks for project: ${projectId}`);
  }
},

    messages: async (parent, { senderId, receiverId }) => {
      try {
        const messages = await ChatMessageModel.find({
          $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId },
          ],
        })
          .populate('sender')
          .populate('receiver')
          .sort({ timestamp: 1 });
        return messages.map(message => {
          const obj = message.toObject();
          return {
            ...obj,
            id: obj._id.toString(),
            sender: message.sender ? { ...message.sender.toObject(), id: message.sender._id.toString() } : null,
            receiver: message.receiver ? { ...message.receiver.toObject(), id: message.receiver._id.toString() } : null,
            message: message.message,
            timestamp: message.timestamp.toISOString(),
          };
        }).filter(msg => msg.sender && msg.receiver);
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw new Error("Failed to fetch messages");
      }
    },
    admins: async () => {
      try {
        const admins = await User.find({ role: 'Admin' });
        return admins;
      } catch (error) {
        throw new Error("Failed to fetch admins");
      }
    },
  },
  User: {
    projects: async (parent) => {
      try {
        return await Project.find({ assignedStudent: parent.id }).populate('assignedStudents');
      } catch (error) {
        throw new Error(`Failed to fetch projects for user ${parent.id}`);
      }
    },
    tasks: async (parent) => {
      try {
        return await Task.find({ assignedStudent: parent.id }).populate('assignedStudent').populate('projectTitle');
      } catch (error) {
        throw new Error(`Failed to fetch tasks for user ${parent.id}`);
      }
    }
  },
  Project: {
    assignedStudents: async (parent) => {
      try {
        const users = await User.find({ _id: { $in: parent.assignedStudents } });
        return users;
      } catch (error) {
        throw new Error(`Failed to fetch assigned students for project ${parent.id}`);
      }
    },
    startDate: (parent) => {
      const date = new Date(parent.startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    endDate: (parent) => {
      const date = new Date(parent.endDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    tasks: async (parent) => {
      try {
        return await Task.find({ projectTitle: parent.id })
          .populate('assignedStudents', 'id name')
          .populate({ path: 'projectTitle', select: 'id projectTitle' });
      } catch (error) {
        throw new Error(`Failed to fetch tasks for user ${parent.id}`);
      }
    },
  },
  Task: {
    projectTitle: async (parent) => {
      // Assuming projectTitle in Task model stores the project's ID
      // You might need to fetch the full project if it's not already populated
      if (parent.projectTitle && typeof parent.projectTitle !== 'object') {
        // If projectTitle is just an ID, fetch the Project
        const project = await mongoose.model('Project').findById(parent.projectTitle);
        return {
          id: project.id,
          projectTitle: project.projectTitle
        };
      }
      return parent.projectTitle; // Already populated object
    },
    assignedStudents: async (parent) => {
      try {
        // This resolver specifically targets the assignedStudents of the Task itself.
        // It's crucial that your Task model has an 'assignedStudents' field.
        if (parent.assignedStudents && parent.assignedStudents.length > 0) {
          return await User.find({ _id: { $in: parent.assignedStudents } });
        }
        return []; // Return an empty array if no students are assigned
      } catch (error) {
        console.error("Error fetching assigned students for task:", parent.id, error);
        throw new Error("Failed to fetch assigned students for task");
      }
    },
    dueDate: (parent) => {
     if (!parent.dueDate) return null;
  return new Date(parent.dueDate).toISOString();
    },
    
  },
  Mutation: {  // <--  All Mutation resolvers MUST be inside this object.
    sendMessage: async (parent, { senderId, receiverId, message }, context) => {
      const { userSocketMap } = context;
      console.log(`Sending message "${message}" from ${senderId} to ${receiverId}`);
      try {
        const chatMessage = new ChatMessageModel({
          sender: senderId,
          receiver: receiverId,
          message: message,
          timestamp: new Date(),
        });
        const savedMessage = await chatMessage.save();
        await savedMessage.populate(['sender', 'receiver']);
        if (userSocketMap && userSocketMap.has(receiverId)) {
          const receiverSocket = userSocketMap.get(receiverId);
          if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify({
              sender: senderId,
              message: message,
            }));
          }
        }
        return savedMessage;
      } catch (error) {
        console.error("GraphQL sendMessage error:", error);
        return {
          message: "Failed to send message",
          sentMessage: null,
        };
      }
    },
    createProject: async (parent, { input }) => {
      const {
        projectTitle,
        projectDescription,
        category,
        startDate,
        endDate,
        projectStatus,
        assignedStudents,
        adminName,
      } = input;
      try {
        if (!projectTitle || !projectDescription || !category || !startDate || !endDate || !adminName || !assignedStudents || assignedStudents.length === 0) {
          throw new UserInputError('All fields are required, and at least one student must be assigned.');
        }
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        if (parsedEndDate <= parsedStartDate) {
          throw new UserInputError('End date must be after start date.');
        }
        const objectIdStudents = [];
        for (const studentId of assignedStudents) {
          if (!mongoose.Types.ObjectId.isValid(studentId)) {
            throw new UserInputError(`Invalid student ID: ${studentId}`);
          }
          const student = await User.findById(studentId);
          if (!student) {
            throw new UserInputError(`Student with ID ${studentId} not found.`);
          }
          if (student.role !== 'Student') {
            throw new UserInputError(`User with ID ${studentId} is not a student.`);
          }
          objectIdStudents.push(studentId);
        }
        const admin = await User.findOne({ name: adminName });
        if (!admin) {
          throw new UserInputError(`Admin user with name "${adminName}" not found.`);
        }
        if (admin.role !== 'Admin') {
          throw new UserInputError(`User with name "${adminName}" is not an admin.`);
        }
        const newProject = new Project({
          projectTitle,
          projectDescription,
          category,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          projectStatus,
          assignedStudents: objectIdStudents,
          adminName,
        });
        const savedProject = await newProject.save();
        return savedProject.populate('assignedStudents');
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
    createTask: async (
      _,
      { projectTitle, taskName, description, assignedStudents, status, dueDate },
    ) => {
      try {
        const project = await Project.findById(projectTitle);
        if (!project) {
          throw new Error('Project not found');
        }
        const students = await User.find({ _id: { $in: assignedStudents } });
        if (students.length !== assignedStudents.length) {
          throw new Error('One or more assigned students not found');
        }
        for (const student of students) {
          if (student.role !== 'Student') {
            throw new Error('All assigned users must have the role "Student"');
          }
        }
        const newTask = new Task({
          projectTitle,
          taskName,
          description,
          assignedStudents,
          status,
          dueDate,
        });
        const savedTask = await newTask.save();
        const populatedTask = await Task.findById(savedTask._id)
          .populate('projectTitle')
          .populate('assignedStudents');
        return populatedTask;
      } catch (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task');
      }
    },
    createUser: async (_, { name, role, password, UniId }) => { // Make sure createUser is DIRECTLY inside Mutation
      try {
        if (!name || !role || !password) {
          throw new UserInputError("Name, role, and password are required");
        }
        if (role !== 'Student' && role !== 'Admin') {
          throw new UserInputError("Role must be 'Student' or 'Admin'");
        }
        if (role === 'Student' && UniId === null) {
          throw new UserInputError("UniId is required for students");
        }
        if (role === 'Student' && UniId !== null) {
          const existingUserWithUniId = await User.findOne({ UniId });
          if (existingUserWithUniId) {
            throw new UserInputError("UniId must be unique");
          }
        }
        const existingUserWithName = await User.findOne({ name });
        if (existingUserWithName) {
          throw new UserInputError("Name must be unique");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name,
          role,
          password: hashedPassword,
          UniId,
        });
        const savedUser = await newUser.save();
        return { ...savedUser.toObject(), id: savedUser._id.toString() };
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    },
    updateUser: async (_, { id, name, role, UniId }) => {
      try {
        if (!id) {
          throw new UserInputError("ID is required for updating a user.");
        }
        if (role && role !== 'Student' && role !== 'Admin') {
          throw new UserInputError("Role must be 'Student' or 'Admin'");
        }
        if (role === 'Student' && UniId === null) {
          throw new UserInputError("UniId is required for students.");
        }
        const existingUser = await User.findById(id);
        if (!existingUser) {
          throw new UserInputError(`User with ID "${id}" not found.`);
        }
        if (role === 'Student' && UniId !== null) {
          const existingUserWithUniId = await User.findOne({ UniId, _id: { $ne: id } });
          if (existingUserWithUniId) {
            throw new UserInputError("UniId must be unique.");
          }
        }
        if (name) {
          const existingUserWithName = await User.findOne({ name, _id: { $ne: id } });
          if (existingUserWithName) {
            throw new UserInputError("Name must be unique");
          }
        }
        const updatedUser = await User.findByIdAndUpdate(
          id,
          { name, role, UniId },
          { new: true }
        );
        return updatedUser;
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
   login: async (_, { name, password }) => {
    try {
        const user = await User.findOne({ name }).select('+password');
        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }

        console.log("Provided password (from client):", password);
        console.log("Stored hashed password (from database):", user.password);

        const passwordMatch = await bcrypt.compare(password, user.password);

        console.log("bcrypt.compare() result:", passwordMatch); // Log the result

        if (!passwordMatch) {
            throw new AuthenticationError('Invalid credentials');
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
            expiresIn: '1h',
        });

        const { password: _password, ...userData } = user.toObject();
        return { token, user: { ...userData, id: user._id.toString() } };
    } catch (error) {
        console.error("Error during login:", error);
        throw error;
    }
},
  },
};

module.exports = resolvers;
















/*

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ChatMessageModel = require('./models/ChatMessage');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const { ApolloServer } = require('apollo-server');
const WebSocket = require('ws');

const resolvers = {
  Query: {
    users: async () => {
      try {
        const students = await User.find({ role: 'Student' });
        return students.map(student => ({ ...student.toObject(), id: student._id.toString() }));
      } catch (error) {
        throw new Error('Failed to fetch students');
      }
    },
    admins: async () => {
      try {
        const admins = await User.find({ role: 'Admin' });
        return admins.map(admin => ({ ...admin.toObject(), id: admin._id.toString() }));
      } catch (error) {
        throw new Error('Failed to fetch admins');
      }
    },
    adminTasks: async (_, { adminId }) => {
      try {
        const projects = await mongoose.model('Project').find({ adminName: adminId });
        if (!projects || projects.length === 0) {
          return [];
        }
        const projectIds = projects.map(project => project._id);
        const tasks = await Task.find({ projectTitle: { $in: projectIds } })
          .populate({
            path: 'projectTitle',
            select: 'id projectTitle'
          })
          .populate({
            path: 'assignedStudents',
            select: 'id name',
          });
        return tasks;
      } catch (error) {
        console.error("Error fetching admin tasks:", error);
        throw new Error("Failed to fetch tasks for admin.");
      }
    },
    receivedMessages: async (_, { receiverId }) => {
      try {
        const messages = await ChatMessageModel.find({ receiver: receiverId })
          .populate('sender')
          .populate('receiver')
          .sort({ timestamp: 1 });
        return messages.map(message => ({
          ...message.toObject(),
          id: message._id.toString(),
          sender: message.sender ? { ...message.sender.toObject(), id: message.sender._id.toString() } : null,
          receiver: message.receiver ? { ...message.receiver.toObject(), id: message.receiver._id.toString() } : null,
          timestamp: message.timestamp.toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching received messages:", error);
        throw new Error("Failed to fetch received messages");
      }
    },
    user: async (_, { id, name }) => {
      try {
        if (id) {
          const user = await User.findById(id);
          if (!user) {
            throw new Error(`User with ID "${id}" not found`);
          }
          return user;
        } else if (name) {
          const userName = await User.findOne({ name });
          if (!userName) {
            throw new Error(`User with name "${name}" not found`);
          }
          return userName;
        } else {
          throw new Error("You must provide either 'id' or 'name' to query a user.");
        }
      } catch (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
    },
    projects: async () => {
      try {
        console.log("Fetching projects...");
        const projects = await Project.find({}).populate({
          path: 'assignedStudents',
          model: 'User'
        });
        console.log("Projects fetched:", projects);
        return projects;
      } catch (error) {
        throw new Error('Failed to fetch projects');
      }
    },
    project: async (_, { id }) => {
      try {
        return await Project.findById(id).populate('assignedStudent');
      } catch (error) {
        throw new Error(`Failed to fetch project with ID ${id}`);
      }
    },
    tasks: async (parent) => {
      try {
        return await Task.find({ projectTitle: parent.id })
          .populate('assignedStudents', 'id name')
          .populate({ path: 'projectTitle', select: 'id projectTitle' });
      } catch (error) {
        throw new Error(`Failed to fetch tasks for project ${parent.id}`);
      }
    },
    task: async (_, { id }) => {
      try {
        return await Task.findById(id).populate('assignedStudent').populate('projectTitle');
      } catch (error) {
        throw new Error(`Failed to fetch task with ID ${id}`);
      }
    },
    numberOfStudents: async () => {
      try {
        const studentCount = await User.countDocuments({ role: 'Student' });
        return studentCount;
      } catch (error) {
        throw new Error('Failed to fetch number of students');
      }
    },
    projectsByAdmin: async (_, { adminName }) => {
      try {
        const projects = await Project.find({ adminName: adminName }).populate({
          path: 'assignedStudents',
          model: 'User'
        });
        return projects;
      } catch (error) {
        throw new Error(`Failed to fetch projects for admin: ${adminName}`);
      }
    },
    messages: async (parent, { senderId, receiverId }) => {
      try {
        const messages = await ChatMessageModel.find({
          $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId },
          ],
        })
          .populate('sender')
          .populate('receiver')
          .sort({ timestamp: 1 });
        return messages.map(message => {
          const obj = message.toObject();
          return {
            ...obj,
            id: obj._id.toString(),
            sender: message.sender ? { ...message.sender.toObject(), id: message.sender._id.toString() } : null,
            receiver: message.receiver ? { ...message.receiver.toObject(), id: message.receiver._id.toString() } : null,
            message: message.message,
            timestamp: message.timestamp.toISOString(),
          };
        }).filter(msg => msg.sender && msg.receiver);
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw new Error("Failed to fetch messages");
      }
    },
    admins: async () => {
      try {
        const admins = await User.find({ role: 'Admin' });
        return admins;
      } catch (error) {
        throw new Error("Failed to fetch admins");
      }
    },
  },
  User: {
    projects: async (parent) => {
      try {
        return await Project.find({ assignedStudent: parent.id }).populate('assignedStudents');
      } catch (error) {
        throw new Error(`Failed to fetch projects for user ${parent.id}`);
      }
    },
    tasks: async (parent) => {
      try {
        return await Task.find({ assignedStudent: parent.id }).populate('assignedStudent').populate('projectTitle');
      } catch (error) {
        throw new Error(`Failed to fetch tasks for user ${parent.id}`);
      }
    }
  },
  Project: {
    assignedStudents: async (parent) => {
      try {
        const users = await User.find({ _id: { $in: parent.assignedStudents } });
        return users;
      } catch (error) {
        throw new Error(`Failed to fetch assigned students for project ${parent.id}`);
      }
    },
    startDate: (parent) => {
      const date = new Date(parent.startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    endDate: (parent) => {
      const date = new Date(parent.endDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    tasks: async (parent) => {
      try {
        return await Task.find({ assignedStudents: parent.id })
          .populate('assignedStudents', 'id name')
          .populate({ path: 'projectTitle', select: 'id projectTitle' });
      } catch (error) {
        throw new Error(`Failed to fetch tasks for user ${parent.id}`);
      }
    },
  },
  Task: {
    projectTitle: async (parent) => {
      if (parent.projectTitle) {
        return {
          id: parent.projectTitle.id,
          projectTitle: parent.projectTitle.projectTitle
        }
      }
      return null;
    },
    assignedStudents: async (parent) => {
      try {
        return await mongoose.model('User').find({ _id: { $in: parent.assignedStudents } });
      } catch (error) {
        console.error("Error fetching assigned students", error);
        throw new Error("Failed to fetch assigned students");
      }
    }
  },
  Mutation: {  // <--  All Mutation resolvers MUST be inside this object.
    sendMessage: async (parent, { senderId, receiverId, message }, context) => {
      const { userSocketMap } = context;
      console.log(`Sending message "${message}" from ${senderId} to ${receiverId}`);
      try {
        const chatMessage = new ChatMessageModel({
          sender: senderId,
          receiver: receiverId,
          message: message,
          timestamp: new Date(),
        });
        const savedMessage = await chatMessage.save();
        await savedMessage.populate(['sender', 'receiver']);
        if (userSocketMap && userSocketMap.has(receiverId)) {
          const receiverSocket = userSocketMap.get(receiverId);
          if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify({
              sender: senderId,
              message: message,
            }));
          }
        }
        return savedMessage;
      } catch (error) {
        console.error("GraphQL sendMessage error:", error);
        return {
          message: "Failed to send message",
          sentMessage: null,
        };
      }
    },
    createProject: async (parent, { input }) => {
      const {
        projectTitle,
        projectDescription,
        category,
        startDate,
        endDate,
        projectStatus,
        assignedStudents,
        adminName,
      } = input;
      try {
        if (!projectTitle || !projectDescription || !category || !startDate || !endDate || !adminName || !assignedStudents || assignedStudents.length === 0) {
          throw new UserInputError('All fields are required, and at least one student must be assigned.');
        }
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        if (parsedEndDate <= parsedStartDate) {
          throw new UserInputError('End date must be after start date.');
        }
        const objectIdStudents = [];
        for (const studentId of assignedStudents) {
          if (!mongoose.Types.ObjectId.isValid(studentId)) {
            throw new UserInputError(`Invalid student ID: ${studentId}`);
          }
          const student = await User.findById(studentId);
          if (!student) {
            throw new UserInputError(`Student with ID ${studentId} not found.`);
          }
          if (student.role !== 'Student') {
            throw new UserInputError(`User with ID ${studentId} is not a student.`);
          }
          objectIdStudents.push(studentId);
        }
        const admin = await User.findOne({ name: adminName });
        if (!admin) {
          throw new UserInputError(`Admin user with name "${adminName}" not found.`);
        }
        if (admin.role !== 'Admin') {
          throw new UserInputError(`User with name "${adminName}" is not an admin.`);
        }
        const newProject = new Project({
          projectTitle,
          projectDescription,
          category,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          projectStatus,
          assignedStudents: objectIdStudents,
          adminName,
        });
        const savedProject = await newProject.save();
        return savedProject.populate('assignedStudents');
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
    createTask: async (
      _,
      { projectTitle, taskName, description, assignedStudents, status, dueDate },
    ) => {
      try {
        const project = await Project.findById(projectTitle);
        if (!project) {
          throw new Error('Project not found');
        }
        const students = await User.find({ _id: { $in: assignedStudents } });
        if (students.length !== assignedStudents.length) {
          throw new Error('One or more assigned students not found');
        }
        for (const student of students) {
          if (student.role !== 'Student') {
            throw new Error('All assigned users must have the role "Student"');
          }
        }
        const newTask = new Task({
          projectTitle,
          taskName,
          description,
          assignedStudents,
          status,
          dueDate,
        });
        const savedTask = await newTask.save();
        const populatedTask = await Task.findById(savedTask._id)
          .populate('projectTitle')
          .populate('assignedStudents');
        return populatedTask;
      } catch (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task');
      }
    },
    createUser: async (_, { name, role, password, UniId }) => { // Make sure createUser is DIRECTLY inside Mutation
      try {
        if (!name || !role || !password) {
          throw new UserInputError("Name, role, and password are required");
        }
        if (role !== 'Student' && role !== 'Admin') {
          throw new UserInputError("Role must be 'Student' or 'Admin'");
        }
        if (role === 'Student' && UniId === null) {
          throw new UserInputError("UniId is required for students");
        }
        if (role === 'Student' && UniId !== null) {
          const existingUserWithUniId = await User.findOne({ UniId });
          if (existingUserWithUniId) {
            throw new UserInputError("UniId must be unique");
          }
        }
        const existingUserWithName = await User.findOne({ name });
        if (existingUserWithName) {
          throw new UserInputError("Name must be unique");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name,
          role,
          password: hashedPassword,
          UniId,
        });
        const savedUser = await newUser.save();
        return { ...savedUser.toObject(), id: savedUser._id.toString() };
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    },
    updateUser: async (_, { id, name, role, UniId }) => {
      try {
        if (!id) {
          throw new UserInputError("ID is required for updating a user.");
        }
        if (role && role !== 'Student' && role !== 'Admin') {
          throw new UserInputError("Role must be 'Student' or 'Admin'");
        }
        if (role === 'Student' && UniId === null) {
          throw new UserInputError("UniId is required for students.");
        }
        const existingUser = await User.findById(id);
        if (!existingUser) {
          throw new UserInputError(`User with ID "${id}" not found.`);
        }
        if (role === 'Student' && UniId !== null) {
          const existingUserWithUniId = await User.findOne({ UniId, _id: { $ne: id } });
          if (existingUserWithUniId) {
            throw new UserInputError("UniId must be unique.");
          }
        }
        if (name) {
          const existingUserWithName = await User.findOne({ name, _id: { $ne: id } });
          if (existingUserWithName) {
            throw new UserInputError("Name must be unique");
          }
        }
        const updatedUser = await User.findByIdAndUpdate(
          id,
          { name, role, UniId },
          { new: true }
        );
        return updatedUser;
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
    login: async (_, { name, password }) => {
      try {
        const user = await User.findOne({ name });
        if (!user) {
          throw new AuthenticationError('Invalid credentials');
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          throw new AuthenticationError('Invalid credentials');
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
          expiresIn: '1h',
        });
        return { token, user: { ...user.toObject(), id: user._id.toString() } };
      } catch (error) {
        console.error("Error during login:", error);
        throw error;
      }
    },
  },
};

module.exports = resolvers;
*/
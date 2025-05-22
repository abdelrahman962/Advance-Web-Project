import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation, useQuery } from '@apollo/client';

// GraphQL Mutation to create a task
const CREATE_TASK = gql`
  mutation CreateTask(
    $projectTitle: ID!
    $taskName: String!
    $description: String!
    $assignedStudents: [ID!]!
    $status: String!
    $dueDate: String!
  ) {
    createTask(
      projectTitle: $projectTitle
      taskName: $taskName
      description: $description
      assignedStudents: $assignedStudents
      status: $status
      dueDate: $dueDate
    ) {
      id
      taskName
      description
      status
      dueDate
      projectTitle {
        id
        projectTitle
      }
      assignedStudents {
        id
        name
      }
    }
  }
`;

// GraphQL Query to get projects.  This is needed to populate the dropdown.
const GET_PROJECTS = gql`
    query GetProjects {
        projects {
            id
            projectTitle
        }
    }
`;

// GraphQL Query to get users. This is needed to populate the dropdown.
const GET_USERS = gql`
    query GetUsers {
        users {
            id
            name
            role
        }
    }
`;
function AddTaskForm() {
  // State for form inputs
  const [projectTitle, setProjectTitle] = useState('');
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedStudent, setAssignedStudent] = useState(''); // Store student name, will convert to ID
  const [status, setStatus] = useState('Pending'); // Default status
  const [dueDate, setDueDate] = useState('');

  // State for dropdown options
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const statusOptions = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

  // State for messages
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  // Use useMutation hook for creating tasks
  const [createTask, { loading: creatingTask, error: createTaskError }] = useMutation(CREATE_TASK);

    // Fetch projects using useQuery
    const { loading: loadingProjects, error: errorProjects, data: projectsData } = useQuery(GET_PROJECTS);

    // Fetch users using useQuery
    const { loading: loadingUsers, error: errorUsers, data: usersData } = useQuery(GET_USERS);


  // Effect to load dropdown options (projects and students) on component mount
  useEffect(() => {
        if (projectsData?.projects) {
            setAvailableProjects(projectsData.projects.map(p => ({
                id: p.id,
                projectTitle: p.projectTitle
            })));
        }
    }, [projectsData]);

    useEffect(() => {
        if (usersData?.users) {
             // Filter only students.
             const students = usersData.users.filter(user => user.role === 'Student');
            setAvailableStudents(students.map(s => ({ id: s.id, name: s.name })));
        }
    }, [usersData]);


  const handleAddTask = async () => {
    setError('');
    setSuccessMessage('');

    if (!projectTitle || !taskName.trim() || !description.trim() || !assignedStudent || !status || !dueDate) {
      setError('Please fill in all fields before adding a task.');
      return;
    }

      // Convert selected projectTitle string to ID
       const selectedProject = availableProjects.find(p => p.projectTitle === projectTitle);
       if (!selectedProject) {
        setError('Selected project title is invalid.');
        return;
       }
       const projectID = selectedProject.id;

        // Convert selected assignedStudent string to an array of student IDs.
        const selectedStudent = availableStudents.find(s => s.name === assignedStudent);
         if (!selectedStudent) {
          setError('Selected student name is invalid.');
          return;
        }
        const studentID = selectedStudent.id;
        const assignedStudentIds = [studentID]; // Wrap it in an array


    try {
      const result = await createTask({
        variables: {
          projectTitle: projectID,
          taskName: taskName.trim(),
          description: description.trim(),
          assignedStudents: assignedStudentIds,
          status,
          dueDate,
        },
      });

      if (result.data?.createTask) {
        setSuccessMessage('Task added successfully!');
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to create task.');
      console.error('Error creating task:', err);
    }
  };

  // Helper to determine status text color
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'In Progress':
        return 'text-yellow-400';
      case 'Completed':
        return 'text-green-500';
      case 'Pending':
        return 'text-gray-400';
      case 'On Hold':
        return 'text-orange-400';
      case 'Cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-300';
    }
  };

  if (loadingProjects || loadingUsers || creatingTask) {
        return (
            <div className="bg-[#1e1e1e] text-white min-h-screen flex items-center justify-center p-5">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    if (errorProjects) {
        return (
            <div className="bg-[#1e1e1e] text-white min-h-screen flex items-center justify-center p-5">
                <div className="text-red-500">Error loading projects: {errorProjects.message}</div>
            </div>
        );
    }

    if (errorUsers) {
          return (
            <div className="bg-[#1e1e1e] text-white min-h-screen flex items-center justify-center p-5">
                <div className="text-red-500">Error loading users: {errorUsers.message}</div>
            </div>
        );
    }

  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen flex items-center justify-center p-5">
      <div className="bg-[#1a1a1a] w-full max-w-md p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center text-[#00a6ff] mb-6">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-2xl text-gray-400 hover:text-green-500 cursor-pointer transition"
          >
            &times;
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

        {/* Project Title Dropdown */}
        <div className="mb-4">
          <label htmlFor="projectTitle" className="block font-bold mb-1">
            Project Title:
          </label>
          <select
            id="projectTitle"
            className="w-full bg-[#474b4e] border border-[#625f5f] rounded px-3 py-2 focus:outline-none focus:border-[#00a6ff] text-white"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
          >
            <option value="">Select a project</option>
            {availableProjects.map((project) => (
              <option key={project.id} value={project.projectTitle}>
                {project.projectTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Task Name Input */}
        <div className="mb-4">
          <label htmlFor="taskName" className="block font-bold mb-1">
            Task Name:
          </label>
          <input
            type="text"
            id="taskName"
            className="w-full bg-[#474b4e] border border-[#625f5f] rounded px-3 py-2 focus:outline-none focus:border-[#00a6ff] text-white"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </div>

        {/* Description Textarea */}
        <div className="mb-4">
          <label htmlFor="description" className="block font-bold mb-1">
            Description:
          </label>
          <textarea
            id="description"
            className="w-full bg-[#474b4e] border border-[#625f5f] rounded px-3 py-2 focus:outline-none focus:border-[#00a6ff] text-white resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        {/* Assigned Student Dropdown */}
        <div className="mb-4">
          <label htmlFor="assignedStudent" className="block font-bold mb-1">
            Assigned Student:
          </label>
          <select
            id="assignedStudent"
            className="w-full bg-[#474b4e] border border-[#625f5f] rounded px-3 py-2 focus:outline-none focus:border-[#00a6ff] text-white"
            value={assignedStudent}
            onChange={(e) => setAssignedStudent(e.target.value)}
          >
            <option value="">Select a student</option>
            {availableStudents.map((student) => (
              <option key={student.id} value={student.name}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="mb-4">
          <label htmlFor="status" className="block font-bold mb-1">
            Status:
          </label>
          <select
            id="status"
            className="w-full bg-[#474b4e] border border-[#625f5f] rounded px-3 py-2 focus:outline-none focus:border-[#00a6ff] text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Input */}
        <div className="mb-6">
          <label htmlFor="dueDate" className="block font-bold mb-1">
            Due Date:
          </label>
          <input
            type="date"
            id="dueDate"
            className="w-full bg-[#474b4e] border border-[#625f5f] rounded px-3 py-2 focus:outline-none focus:border-[#00a6ff] text-white"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Add Task Button */}
        <button
          id="addTaskBtn"
          onClick={handleAddTask}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-500 text-white font-semibold py-3 rounded transition"
          disabled={creatingTask}
        >
          {creatingTask ? 'Adding Task...' : 'Add Task'}
        </button>
      </div>
    </div>
  );
}

export default AddTaskForm;


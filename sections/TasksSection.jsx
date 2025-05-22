import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useQuery, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { onError } from "@apollo/client/link/error";

// Re-using the GET_PROJECTS query from ProjectsSection.jsx
// This query fetches projects along with their nested tasks and adminName
const GET_PROJECTS_FOR_TASKS = gql`
    query GetProjectsForTasks {
        projects {
            id
            projectTitle
            projectDescription
            adminName # Include adminName for filtering admin tasks
            assignedStudents { # These are students assigned to the *project*
                id
                name
                role
                UniId
            }
            category
            projectStatus
            startDate
            endDate
            tasks {
                id
                taskName
                description
                status
                dueDate
                assignedStudents { # Explicitly asking for assigned students on the task
                    id
                    name
                }
            }
        }
    }
`;

// Apollo Client setup (copying from ProjectsSection.jsx to ensure consistency if not globally configured)
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
            console.error(
                `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}, Operation: ${operation.operationName}`,
            )
        );
    }
    if (networkError) console.error(`[Network error]: ${networkError}, Operation: ${operation.operationName}`);
    if (forward) return forward(operation);
});

const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql', // Replace with your GraphQL server URL
});

const client = new ApolloClient({
    link: errorLink.concat(httpLink),
    cache: new InMemoryCache(),
});

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    let date;
    // Check if the dateString is a numeric string (timestamp)
    if (!isNaN(dateString) && !isNaN(parseFloat(dateString))) {
        date = new Date(parseInt(dateString, 10)); // Convert to integer and create Date
    } else {
        // Fallback for ISO 8601 strings or DD-MM-YYYY or other formats
        // This part needs to be robust for any non-timestamp string you expect
        const parts = dateString.split('-');
        if (parts.length === 3 && parseInt(parts[0]).toString().length === 4) { // Assumes YYYY-MM-DD
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (parts.length === 3 && parseInt(parts[2]).toString().length === 4) { // Assumes DD-MM-YYYY
             date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
            date = new Date(dateString); // Generic parsing for ISO strings, etc.
        }
    }

    if (isNaN(date.getTime())) { // Check if the date is valid after parsing attempts
        console.warn(`formatDate: Could not parse "${dateString}" into a valid date.`);
        return 'Invalid Date';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
};

function TasksSection() {
    const [rawTasks, setRawTasks] = useState([]); // Store the unformatted/unfiltered tasks here
    const [sortBy, setSortBy] = useState('Task Status');
    const navigate = useNavigate();
    const [user, setUser] = useState(null); // State to store the current user

    const { loading, error, data } = useQuery(GET_PROJECTS_FOR_TASKS, {
        client: client,
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse currentUser from localStorage", e);
                setUser(null);
            }
        }
    }, []);

    // Effect to process fetched data and populate rawTasks
    useEffect(() => {
        if (!data || !user) return;

        let allTasks = [];
        data.projects.forEach(project => {
            if (project.tasks && project.tasks.length > 0) {
                const relevantTasks = project.tasks.filter(task => {
                    if (user.role === 'Admin') {
                        return project.adminName === user.name;
                    } else if (user.role === 'Student') {
                        return task.assignedStudents.some(student => student.id === user.id);
                    }
                    return false;
                }).map(task => {
                    // Format assignedStudentNames here, as it's part of data processing
                    const assignedStudentNames = Array.isArray(task.assignedStudents)
                        ? task.assignedStudents.map(s => s?.name || 'Unknown Student').join(', ')
                        : 'N/A';

                    return {
                        ...task,
                        projectTitle: project.projectTitle,
                        assignedStudent: assignedStudentNames, // This is the combined string of student names
                        // We will format dueDate for display in the useMemo below
                    };
                });
                allTasks = allTasks.concat(relevantTasks);
            }
        });
        setRawTasks(allTasks); // Set the raw (but filtered and partially formatted) tasks
    }, [data, user]);

    // Use useMemo to memoize the sorted and fully formatted tasks
    // This will only re-run when rawTasks or sortBy changes
    const sortedAndFormattedTasks = useMemo(() => {
        if (!rawTasks || rawTasks.length === 0) {
            return [];
        }

        const tasksToSort = rawTasks.map(task => ({
            ...task,
            displayDueDate: formatDate(task.dueDate)
        }));


        const sorted = [...tasksToSort].sort((a, b) => {
            switch (sortBy) {
                case 'Task Status':
                    return a.status.localeCompare(b.status);
                case 'Project':
                    return a.projectTitle.localeCompare(b.projectTitle);
                case 'Due Date':
                    // Convert original dueDate to Date objects for accurate sorting
                    const dateA = new Date(a.dueDate);
                    const dateB = new Date(b.dueDate);
                    // Handle invalid dates by pushing them to the end
                    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                    if (isNaN(dateA.getTime())) return 1;
                    if (isNaN(dateB.getTime())) return -1;
                    return dateA.getTime() - dateB.getTime();
                case 'Assigned Student':
                    // Ensure assignedStudent is always a string for localeCompare
                    return (a.assignedStudent || '').localeCompare(b.assignedStudent || '');
                default:
                    return 0;
            }
        });
        return sorted;
    }, [rawTasks, sortBy]); // Dependencies for useMemo

    const handleSortChange = (value) => {
        setSortBy(value);
    };

    const handleCreateTaskClick = () => {
        // Allow Admins to create tasks for any project
        // Allow Students to create tasks for projects they are assigned to
        navigate('/add-task');
    };

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'In Progress':
                return 'text-green-500';
            case 'Completed':
                return 'text-blue-500';
            case 'Pending':
                return 'text-yellow-400';
            case 'On Hold':
               return  'text-orange-500';
                
            case 'Cancelled': // Group these two as they often indicate no active progress
                return 'text-red-500';
            default:
                return 'text-gray-300';
        }
    };


    if (loading) {
        return (
            <section className="section-content p-8 flex flex-col bg-[#1a1a1a]">
                <div className="text-gray-400">Loading tasks...</div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="section-content p-8 flex flex-col bg-[#1a1a1a]">
                <div className="text-red-500">Error: {error.message}</div>
            </section>
        );
    }

    return (
        <section className="section-content p-8 flex flex-col bg-[#1a1a1a]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-2xl font-bold">My Tasks</h2>
                <button
                    onClick={handleCreateTaskClick}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
                >
                    Create a new Task
                </button>
            </div>

            <div className="mb-4">
                <label className="text-gray-300 mr-2">Sort by:</label>
                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="bg-gray-700 text-gray-200 border border-gray-600 rounded px-3 py-2 w-[180px]"
                >
                    <option value="Task Status" className='bg-gray-800 hover:bg-gray-700/50 text-gray-200'>Task Status</option>
                    <option value="Project" className='bg-gray-800 hover:bg-gray-700/50 text-gray-200'>Project</option>
                    <option value="Due Date" className='bg-gray-800 hover:bg-gray-700/50 text-gray-200'>Due Date</option>
                    <option value="Assigned Student" className='bg-gray-800 hover:bg-gray-700/50 text-gray-200'>Assigned Student</option>
                </select>
            </div>

            {sortedAndFormattedTasks.length === 0 ? (
                <div className="text-gray-400">No tasks assigned to you.</div>
            ) : (
                <div className="rounded-md border border-gray-700 overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="text-white px-6 py-3 text-left">Task ID</th>
                                <th className="text-white px-6 py-3 text-left">Project</th>
                                <th className="text-white px-6 py-3 text-left">Task Name</th>
                                <th className="text-white px-6 py-3 text-left">Description</th>
                                <th className="text-white px-6 py-3 text-left">Assigned Student</th>
                                <th className="text-white px-6 py-3 text-left">Status</th>
                                <th className="text-white px-6 py-3 text-left">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900">
                            {sortedAndFormattedTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-700/50">
                                    <td className="text-gray-200 px-6 py-4">{task.id}</td>
                                    <td className="text-gray-200 px-6 py-4">{task.projectTitle}</td>
                                    <td className="text-gray-200 px-6 py-4">{task.taskName}</td>
                                    <td className="text-gray-300 px-6 py-4">{task.description}</td>
                                    <td className="text-gray-200 px-6 py-4">{task.assignedStudent}</td>
                                    <td className={`${getStatusColorClass(task.status)} font-semibold px-6 py-4`}>
                                        {task.status}
                                    </td>
                                    <td className="text-gray-200 px-6 py-4">{task.displayDueDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default TasksSection;

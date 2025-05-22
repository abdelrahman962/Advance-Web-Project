import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useQuery, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { onError } from "@apollo/client/link/error";

// Define your GraphQL query to fetch all projects, including the adminName
const GET_ALL_PROJECTS = gql`
    query GetAllProjects {
        projects {
            id
            projectTitle
            projectDescription
            assignedStudents {
                id
                name
                role
                UniId
            }
            category
            projectStatus
            startDate
            endDate
            adminName
            tasks {
                id
                taskName
                description
                status
                dueDate
                assignedStudents {
                    id
                    name
                }
            }
        }
    }
`;

// Define a GraphQL query to fetch projects by admin name (already present)
const GET_PROJECTS_BY_ADMIN = gql`
    query ProjectsByAdmin($adminName: String!) {
        projectsByAdmin(adminName: $adminName) {
            id
            projectTitle
            projectDescription
            assignedStudents {
                id
                name
                role
                UniId
            }
            category
            projectStatus
            startDate
            endDate
            adminName
            tasks {
                id
                taskName
                description
                status
                dueDate
                assignedStudents {
                    id
                    name
                }
            }
        }
    }
`;

// Helper function to calculate progress and status based on dates (no change)
const calculateProjectStatusAndProgress = (project) => {
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (!startDate || !endDate) {
        return {
            calculatedProgress: project.progress || 0,
            calculatedStatus: project.status || 'Unknown'
        };
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);


    if (currentDate < startDate) {
        return { calculatedProgress: 0, calculatedStatus: 'Pending' };
    }

    if (currentDate >= endDate) {
        return { calculatedProgress: 100, calculatedStatus: 'Completed' };
    }

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    const calculatedProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

    return { calculatedProgress: Math.round(calculatedProgress), calculatedStatus: 'In Progress' };
};

// Apollo Client setup with error handling (no change)
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
    uri: 'http://localhost:4000/graphql',
});

const client = new ApolloClient({
    link: errorLink.concat(httpLink),
    cache: new InMemoryCache(),
});


function ProjectsSection({ checkAdminAccess }) {
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [selectedProject, setSelectedProject] = useState(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Determine which query to use based on user role
    let queryToUse;
    let queryVariables = {};

    if (user?.role === 'Admin') {
        queryToUse = GET_PROJECTS_BY_ADMIN;
        queryVariables = { adminName: user.name };
    } else { // For Students and other roles, fetch all projects and filter client-side
        queryToUse = GET_ALL_PROJECTS;
    }

    const { data, error, loading, refetch } = useQuery(
        queryToUse,
        {
            skip: !user, // Only run query after user is set
            variables: queryVariables,
            client: client,
        }
    );

    // useEffect to set the user
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (!data || !user) return;

        let projects = [];
        if (user.role === 'Admin') {
            projects = data.projectsByAdmin;
        } else { // For Students and other roles, get all projects
            projects = data.projects;
            // ************ IMPORTANT: Filter for students here ************
            if (user.role === 'Student' && user.UniId) {
                projects = projects.filter(project =>
                    project.assignedStudents && project.assignedStudents.some(student => student.UniId === user.UniId)
                );
            }
        }


        // Apply search term filter
        if (searchTerm) {
            projects = projects.filter(p =>
                p.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.projectDescription?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply status filter
        if (statusFilter !== 'All Statuses') {
            projects = projects.filter(p => {
                const { calculatedStatus } = calculateProjectStatusAndProgress(p);
                const status = ['On Hold', 'Canceled'].includes(p.projectStatus) ? p.projectStatus : calculatedStatus; // Use projectStatus from backend if 'On Hold' or 'Canceled'
                return status === statusFilter;
            });
        }

        // Calculate progress and status for display
        const processedProjects = projects.map(p => {
            const { calculatedStatus, calculatedProgress } = calculateProjectStatusAndProgress(p);
            return {
                ...p,
                // Use projectStatus from backend if 'On Hold' or 'Canceled', otherwise use calculated
                status: ['On Hold', 'Canceled'].includes(p.projectStatus) ? p.projectStatus : calculatedStatus,
                progress: (p.startDate && p.endDate) ? calculatedProgress : p.progress || 0
            };
        });

        setFilteredProjects(processedProjects);
    }, [data, user, searchTerm, statusFilter]); // Depend on data, user, search term, and status filter


    // Function to handle task data fetching and storage (no change)
    const fetchAndStoreTasks = async (project) => {
        if (!project) return;
        const tasksData = project.tasks;
        localStorage.setItem('tasksData', JSON.stringify(tasksData));
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        fetchAndStoreTasks(project);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleAddProjectClick = () => {
        if (checkAdminAccess()) {
            navigate('/add-project');
        } else {
            alert("You do not have permission to add projects.");
        }
    };

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'In Progress': return 'text-yellow-400';
            case 'Completed': return 'text-green-500';
            case 'Pending': return 'text-gray-400';
            case 'On Hold': return 'text-orange-400';
            case 'Canceled': return 'text-red-500';
            case 'Unknown': return 'text-gray-500';
            default: return 'text-gray-300';
        }
    };

    if (!user || loading) {
        return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-gray-400">Loading...</div>;
    }

    if (error) {
        console.error("GraphQL Error:", error);
        return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-red-500">Error loading projects: {error.message}</div>;
    }

    return (
        <section id="projects-section" className="section-content p-8 flex flex-col bg-[#1a1a1a]">
            <h2 className="text-2xl text-indigo-600 mb-4">Projects Overview</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button
                    type="button"
                    onClick={handleAddProjectClick}
                    className="bg-indigo-600 hover:bg-indigo-500 text-gray-200 px-4 py-2 rounded"
                >
                    Add New Project
                </button>
                <input
                    id="searchInput"
                    type="text"
                    placeholder="Search projects..."
                    className="flex-1 bg-gray-700 text-gray-200 px-3 py-2 rounded"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <select
                    id="status"
                    className="bg-gray-700 text-gray-200 px-3 py-2 rounded"
                    value={statusFilter}
                    onChange={handleStatusChange}
                >
                    <option>All Statuses</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>On Hold</option>
                    <option>Canceled</option>
                    <option>Unknown</option>
                </select>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="projects-details grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 w-full md:w-3/5">
                    {filteredProjects.map(project => (
                        <div
                            key={project.id}
                            className="bg-[#404040] p-4 rounded shadow cursor-pointer hover:bg-gray-600"
                            onClick={() => handleProjectClick(project)}
                        >
                            <h3 className="text-lg font-semibold mb-2">{project.projectTitle}</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                <strong>Description:</strong> {project.projectDescription}
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                <strong>Students:</strong> {Array.isArray(project.assignedStudents)
                                    ? project.assignedStudents.map(s => s.name).join(", ")
                                    : "—"}
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                <strong>Category:</strong> {project.category}
                            </p>
                            <div className="w-full bg-gray-600 rounded-full h-2.5 mb-2">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full text-xs text-white flex justify-center items-center"
                                    style={{ width: `${project.progress}%` }}
                                >
                                    {project.progress > 5 && `${project.progress}%`}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Start: {project.startDate || 'N/A'}</span>
                                <span>End: {project.endDate || 'N/A'}</span>
                            </div>

                            <p className={`text-sm font-semibold ${getStatusColorClass(project.status)}`}>
                                <strong>Status:</strong> {project.status}
                            </p>
                        </div>
                    ))}
                    {filteredProjects.length === 0 && <p className="text-center w-full md:col-span-full text-gray-400">No projects found matching your criteria.</p>}
                </div>

                <div id="project-detail-panel" className="w-full md:w-2/5 bg-[#404040] p-6 rounded max-h-[calc(100vh-10rem)] overflow-y-auto text-gray-300">
                    {selectedProject ? (
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-[#00ffff]">{selectedProject.projectTitle} Details</h3>
                            <p className="mb-2"><strong>Description:</strong> {selectedProject.projectDescription}</p>
                            <p className="mb-2"><strong>Category:</strong> {selectedProject.category}</p>
                            <p className="mb-2">
                                <strong>Students:</strong> {Array.isArray(selectedProject.assignedStudents)
                                    ? selectedProject.assignedStudents.map(s => s.name).join(", ")
                                    : "—"}
                            </p>
                            <p className="mb-2"><strong>Start Date:</strong> {selectedProject.startDate || 'N/A'}</p>
                            <p className="mb-2"><strong>End Date:</strong> {selectedProject.endDate || 'N/A'}</p>
                            <p className={`mb-2 font-semibold ${getStatusColorClass(selectedProject.status)}`}>
                                <strong>Status:</strong> {selectedProject.status}
                            </p>
                            <p className="mb-2"><strong>Progress:</strong> {selectedProject.progress}%</p>
                            <hr className="border-gray-600 my-4" />
                            <h4 className="text-lg font-semibold mb-3 text-[#00ffff]">Tasks for this Project</h4>
                            {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                                selectedProject.tasks.map(task => (
                                    <div key={task.id} className="bg-gray-600 p-3 rounded mb-3 last:mb-0">
                                        <p className="text-sm"><strong>Task Name:</strong> {task.taskName}</p>
                                        <p className="text-sm"><strong>Description:</strong> {task.description}</p>
                                        <p className="text-sm">
                                            <strong>Assigned To:</strong> {Array.isArray(task.assignedStudents)
                                                ? task.assignedStudents.map(s => s?.name || 'Unknown Student').join(', ')
                                                : 'N/A'}
                                        </p>
                                        <p className={`text-sm font-semibold ${getStatusColorClass(task.status)}`}>
                                            <strong>Status:</strong> {task.status}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p>No tasks found for this project.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400">Select a project to see its details</p>
                    )}
                </div>
            </div>
        </section>
    );
}

export default ProjectsSection;
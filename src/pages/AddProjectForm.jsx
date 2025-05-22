import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREATE_PROJECT } from '../graphql/mutations';
import { GET_USERS } from '../graphql/mutations';
import { useQuery, useMutation } from '@apollo/client';

function AddProjectForm() {
    const [projectTitle, setProjectTitle] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudentsNames, setSelectedStudentsNames] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [projectCategory, setProjectCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [projectStatus, setProjectStatus] = useState('In Progress');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const adminName = JSON.parse(localStorage.getItem('currentUser')).name;
    const navigate = useNavigate();
    const { loading: usersLoading, error: usersError, data: usersData, refetch: refetchUsers } = useQuery(GET_USERS);
    const [createProject, { loading: mutationLoading, error: mutationError }] = useMutation(CREATE_PROJECT);

    useEffect(() => {
        if (usersData && usersData.users) {
            const students = usersData.users.filter(user => user.role === 'Student');
            setAvailableStudents(students);
        }
    }, [usersData]);

    useEffect(() => {
        if (availableStudents.length > 0) {
            const studentIds = availableStudents
                .filter(student => selectedStudentsNames.includes(student.name))
                .map(student => student.id);
            setSelectedStudentIds(studentIds);
        }
    }, [selectedStudentsNames, availableStudents]);

    const handleAddProject = async () => {
        setError('');
        setSuccessMessage('');

        if (!projectTitle.trim() || !projectDescription.trim() || selectedStudentsNames.length === 0 || !projectCategory || !startDate || !endDate) {
            setError('Please fill in all required fields (Title, Description, Students, Category, Dates).');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after end date.');
            return;
        }
       



        try {
            // Refetch users before creating the project
            const usersResult = await refetchUsers();
            let validStudentIds = [];

            if (usersResult && usersResult.data && usersResult.data.users) {
                const currentStudents = usersResult.data.users.filter(user => user.role === 'Student');

                // Derive validStudentIds directly from fetched and filtered student data
                validStudentIds = currentStudents
                    .filter(student => selectedStudentsNames.includes(student.name))
                    .map(student => student.id);

                if (validStudentIds.length !== selectedStudentsNames.length) {
                    const errorMessage = "One or more selected students are invalid. Please check the student list.";
                    setError(errorMessage);
                    console.error(errorMessage, "Valid IDs:", validStudentIds, "Selected Names:", selectedStudentsNames, "Available Students:", currentStudents);
                    return;
                }
            } else {
                const errorMessage = "Failed to fetch the students. Please try again.";
                setError(errorMessage);
                console.error(errorMessage, usersResult);
                return;
            }


            const mutationVariables = {
                input: {
                    projectTitle: projectTitle.trim(),
                    projectDescription: projectDescription.trim(),
                    category: projectCategory,
                    startDate,
                    endDate,
                    projectStatus,
                    assignedStudents: validStudentIds,
                    adminName,
                },
            };


            const { data } = await createProject({
                variables: mutationVariables,
            });


            if (data && data.createProject) {
                setSuccessMessage('Project added successfully!');
                setTimeout(() => {
                    navigate('/home');
                }, 1500);
            } else {
                const errorMessage = 'Failed to create project. Please try again.';
                setError(errorMessage);
                console.error(errorMessage, data);
            }
        } catch (err) {
            let errorMessage = 'Failed to add project. Please check your input and try again.';
            if (err.graphQLErrors && err.graphQLErrors.length > 0) {
                errorMessage = err.graphQLErrors[0].message;
            }
            setError(errorMessage);
            console.error('Error creating project:', err);
        }
    };

    const handleStudentSelectChange = (e) => {
        const options = e.target.options;
        const values = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                values.push(options[i].value);
            }
        }
        setSelectedStudentsNames(values);
    };

    if (usersLoading) return <div className="text-white">Loading students...</div>;
    if (usersError) return <div className="text-red-500">Error loading students: {usersError.message}</div>;

    return (
        <div className="bg-[#1e1e1e] text-white font-sans p-5 min-h-screen flex items-center justify-center">
            <div className="max-w-md mx-auto bg-[#111111] rounded-lg shadow-lg p-6 w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-[#007bff]">Add New Project</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-2xl cursor-pointer hover:text-[#cccccc]"
                    >
                        &times;
                    </button>
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
                {mutationError && <p className="text-red-500 text-center mb-4">Mutation Error: {mutationError.message}</p>}

                <div className="mb-3">
                    <label htmlFor="projectTitle" className="block font-bold text-[#cccccc] mb-1">Project Title:</label>
                    <input
                        type="text"
                        id="projectTitle"
                        placeholder="Enter project title"
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007bff]"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="projectDescription" className="block font-bold text-[#cccccc] mb-1">Project Description:</label>
                    <textarea
                        id="projectDescription"
                        placeholder="Enter project description"
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white resize-y focus:outline-none focus:border-[#007bff]"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label htmlFor="studentsList" className="block font-bold text-[#cccccc] mb-1">Students List:</label>
                    <select
                        id="studentsList"
                        multiple
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white max-h-32 overflow-y-auto focus:outline-none focus:border-[#007bff]"
                        value={selectedStudentsNames}
                        onChange={handleStudentSelectChange}
                    >
                        {availableStudents.map(student => (
                            <option key={student.id} value={student.name}>
                                {student.name}
                            </option>
                        ))}
                    </select>
                    {selectedStudentsNames.length > 0 && (
                        <p className="text-sm text-gray-400 mt-1">Selected: {selectedStudentsNames.join(', ')}</p>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="projectCategory" className="block font-bold text-[#cccccc] mb-1">Project Category:</label>
                    <select
                        id="projectCategory"
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007bff]"
                        value={projectCategory}
                        onChange={(e) => setProjectCategory(e.target.value)}
                    >
                        <option value="" disabled>Select a category</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Development">Mobile Development</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Machine Learning">Machine Learning</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label htmlFor="startDate" className="block font-bold text-[#cccccc] mb-1">Starting Date:</label>
                    <input
                        type="date"
                        id="startDate"
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007bff]"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="endDate" className="block font-bold text-[#cccccc] mb-1">Ending Date:</label>
                    <input
                        type="date"
                        id="endDate"
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007bff]"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="projectStatus" className="block font-bold text-[#cccccc] mb-1">Project Status:</label>
                    <select
                        id="projectStatus"
                        className="w-full bg-[#2b2b2b] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007bff]"
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value)}
                    >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <button
                    id="addProjectBtn"
                    onClick={handleAddProject}
                    className="bg-[#28a745] hover:bg-green-700 text-white font-semibold py-2 px-4 rounded w-full mt-4"
                >
                    Add Project
                </button>
            </div>
        </div>
    );
}

export default AddProjectForm;

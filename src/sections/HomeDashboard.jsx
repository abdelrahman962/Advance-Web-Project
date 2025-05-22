import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto'; // Use 'chart.js/auto' for Chart.js 3+ or specific module for older versions
import {gql,useQuery} from "@apollo/client";
// Make sure you have installed Chart.js: npm install chart.js

const GET_NUMBER_OF_STUDENTS = gql`
  query GetNumberOfStudents {
    numberOfStudents
  }
`;

const GET_NUMBER_OF_TASKS = gql`
  query GetNumberOfTasks {
    numberOfTasks
  }
`;

const GET_NUMBER_OF_PROJECTS = gql`
  query GetNumberOfProjects {
    numberOfProjects
  }
`;

const GET_NUMBER_OF_FINISHED_PROJECTS = gql`
  query GetNumberOfFinishedProjects {
    numberOfFinishedProjects
  }
`;



function HomeDashboard() {
  const [projectsNum, setProjectsNum] = useState(0); // State for counts
  const [studentsNum, setStudentsNum] = useState(0);
  const [tasksNum, setTasksNum] = useState(0);
  const [finishedNum, setFinishedNum] = useState(0);
  const chartRef = React.useRef(null); // Ref for the canvas element
  const chartInstanceRef = React.useRef(null); // Ref to hold the Chart.js instance


// 2. Use useQuery hooks for each count
  const { data: studentsData, loading: studentsLoading, error: studentsError } = useQuery(GET_NUMBER_OF_STUDENTS);
  const { data: tasksData, loading: tasksLoading, error: tasksError } = useQuery(GET_NUMBER_OF_TASKS);
  const { data: projectsData, loading: projectsLoading, error: projectsError } = useQuery(GET_NUMBER_OF_PROJECTS);
  const { data: finishedProjectsData, loading: finishedProjectsLoading, error: finishedProjectsError } = useQuery(GET_NUMBER_OF_FINISHED_PROJECTS);








  // Effect to fetch data and render chart when component mounts
  useEffect(() => {
    // Update state based on GraphQL data
    if (studentsData) {
      setStudentsNum(studentsData.numberOfStudents);
    }
    if (tasksData) {
      setTasksNum(tasksData.numberOfTasks);
    }
    if (projectsData) {
      setProjectsNum(projectsData.numberOfProjects);
    }
    if (finishedProjectsData) {
      setFinishedNum(finishedProjectsData.numberOfFinishedProjects);
    }

    // --- Chart.js Initialization ---
    // Only render the chart if all data is loaded and no errors
    const allLoaded = !studentsLoading && !tasksLoading && !projectsLoading && !finishedProjectsLoading;
    const noErrors = !studentsError && !tasksError && !projectsError && !finishedProjectsError;

    if (allLoaded && noErrors && chartRef.current) {
      // Destroy existing chart instance if it exists before creating a new one
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');

      var xValues = ["Projects", "Students", "Tasks", "Finished Projects"];
      var yValues = [projectsNum, studentsNum, tasksNum, finishedNum]; // Use states

      var barColors = [
        '#4bc4b7',
        '#1565c0',
        '#8d6e63',
        '#6a1b9a'
      ];

      chartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: xValues,
          datasets: [{
            backgroundColor: barColors,
            data: yValues
          }]
        },
        options: {
          responsive: true, // Make chart responsive
          maintainAspectRatio: false, // Allow aspect ratio to change
          legend: { display: false },
          title: {
            display: true,
            text: "Admin Dashboard Overview (Count)",
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          scales: {
            y: { // Use 'y' for Chart.js 3+
              ticks: {
                beginAtZero: true,
                min: 0,
               max: Math.max(...yValues, 5), // Auto adjust max based on data
                 stepSize: 2 // Auto adjust step size
              },
              title: {
                display: true,
                text: 'Count',
                color: '#d1d5db'
              }
            },
            x: { // Use 'x' for Chart.js 3+
              ticks: {
                color: '#d1d5db'
              }
            }
          },
          plugins: {
              legend: { display: false }, // Moved legend to plugins in Chart.js 3+
              title: {
                  display: true,
                  text: "Admin Dashboard Overview (Count)", // Updated title text
                  font: {
                      size: 16,
                      weight: 'bold'
                  },
                  color: '#ffffff' // Set title color for dark background
              }
          }
        }
      });
    }

    // Cleanup function to destroy chart instance on component unmount
    return () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
    };

  }, [
    studentsData, tasksData, projectsData, finishedProjectsData,
    studentsLoading, tasksLoading, projectsLoading, finishedProjectsLoading,
    studentsError, tasksError, projectsError, finishedProjectsError,
    projectsNum, studentsNum, tasksNum, finishedNum // Keep current state values as dependencies for chart re-render
  ]);

   // Effect to display current date (adapted from inline script)
  useEffect(() => {
      const dateElement = document.getElementById('date');
      if(dateElement){
          const updateDate = () => {
              const current = new Date();
              const options = {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
              };
              dateElement.innerHTML = current.toLocaleDateString('en-US', options);
          };
          updateDate(); // Set initial date
          const intervalId = setInterval(updateDate, 1000); // Update every second

          // Cleanup interval on component unmount
          return () => clearInterval(intervalId);
      }
  }, []);


if (studentsLoading || tasksLoading || projectsLoading || finishedProjectsLoading) {
    return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-gray-400">Loading dashboard data...</div>;
  }

  // Show error state if any query failed
  if (studentsError || tasksError || projectsError || finishedProjectsError) {
    console.error("GraphQL Errors:", studentsError, tasksError, projectsError, finishedProjectsError);
    return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-red-500">Error loading dashboard data. Check console for details.</div>;
  }



  return (
    <section id="home-section" className="section-content col-span-4 p-8 flex flex-col bg-[#1a1a1a]">
      <div id="first" className="flex justify-between mb-6">
        <span className="text-2xl text-indigo-600">Welcome to the Task Management System</span>
        <span id="date" className="text-gray-400 text-sm"></span> {/* Date will be injected here */}
      </div>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"> {/* Added responsive grid */}
        <div className="bg-[#404040] p-4 rounded shadow text-center">
          <h3 className="text-lg mb-2">Number of Projects</h3>
          <p id="projectsNum" className="text-xl">{projectsNum}</p> {/* Display state */}
        </div>
        <div className="bg-[#404040] p-4 rounded shadow text-center">
          <h3 className="text-lg mb-2">Number of Students</h3>
          <p id="studentsNum" className="text-xl">{studentsNum}</p> {/* Display state */}
        </div>
        <div className="bg-[#404040] p-4 rounded shadow text-center">
          <h3 className="text-lg mb-2">Number of Tasks</h3>
          <p id="tasksNum" className="text-xl">{tasksNum}</p> {/* Display state */}
        </div>
        <div className="bg-[#404040] p-4 rounded shadow text-center">
          <h3 className="text-lg mb-2">Number of Finished Projects</h3>
          <p id="finishedNum" className="text-xl">{finishedNum}</p> {/* Display state */}
        </div>
      </div>

      {/* Chart Container */}
      <div className="max-w-4xl mx-auto w-full"> {/* Added w-full for better centering */}
        <canvas id="myChart" ref={chartRef}></canvas> {/* Use ref for canvas */}
      </div>
    </section>
  );
}

export default HomeDashboard;
import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getCookie, setCookie } from '../utils/cookies';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = ({ onLogout }) => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(new Date('2022-10-04'));
  const [endDate, setEndDate] = useState(new Date('2022-10-29'));
  const [age, setAge] = useState('all');
  const [gender, setGender] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    loadUserPreferences();
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('start_date') && params.has('end_date') && params.has('age') && params.has('gender')) {
      setStartDate(new Date(params.get('start_date') || ''));
      setEndDate(new Date(params.get('end_date') || ''));
      setAge(params.get('age') || 'all');
      setGender(params.get('gender') || 'all');
      fetchData();
    }
  }, [location]);

  const fetchData = async () => {
    try {
      const token = getCookie('auth_token');
      const response = await axios.get('http://localhost:3001/api/data', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          age,
          gender,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(response.data);
      saveUserPreferences();
      updateURL();
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const loadUserPreferences = () => {
    const savedStartDate = getCookie('start_date');
    const savedEndDate = getCookie('end_date');
    const savedAge = getCookie('age');
    const savedGender = getCookie('gender');

    if (savedStartDate) setStartDate(new Date(savedStartDate));
    if (savedEndDate) setEndDate(new Date(savedEndDate));
    if (savedAge) setAge(savedAge);
    if (savedGender) setGender(savedGender);
  };

  const saveUserPreferences = () => {
    setCookie('start_date', startDate.toISOString(), 30);
    setCookie('end_date', endDate.toISOString(), 30);
    setCookie('age', age, 30);
    setCookie('gender', gender, 30);
  };

  const updateURL = () => {
    const params = new URLSearchParams({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      age,
      gender,
    });
    history.push({ search: params.toString() });
  };

  const resetFilters = () => {
    setStartDate(new Date('2022-10-04'));
    setEndDate(new Date('2022-10-29'));
    setAge('all');
    setGender('all');
    fetchData();
  };

  const barChartData = {
    labels: ['A', 'B', 'C', 'D', 'E', 'F'],
    datasets: [
      {
        label: 'Total Time Spent',
        data: ['A', 'B', 'C', 'D', 'E', 'F'].map(feature =>
          data.reduce((sum, item) => sum + item[feature], 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const lineChartData = selectedFeature ? {
    labels: data.map(item => item.Day),
    datasets: [
      {
        label: `Feature ${selectedFeature} Time Trend`,
        data: data.map(item => item[selectedFeature]),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  } : null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Data Visualization Dashboard</h1>
      <div className="mb-4 flex flex-wrap items-center">
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          className="mr-2  mb-2"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          className="mr-2 mb-2"
        />
        <select
          value={age}
          onChange={e => setAge(e.target.value)}
          className="mr-2 mb-2"
        >
          <option value="all">All Ages</option>
          <option value="15-25">15-25</option>
          <option value=">25">&gt;25</option>
        </select>
        <select
          value={gender}
          onChange={e => setGender(e.target.value)}
          className="mr-2 mb-2"
        >
          <option value="all">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <button
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 mb-2"
        >
          Apply Filters
        </button>
        <button
          onClick={resetFilters}
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2 mb-2"
        >
          Reset Filters
        </button>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded mb-2"
        >
          Logout
        </button>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Feature Usage</h2>
        <Bar
          data={barChartData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                setSelectedFeature(['A', 'B', 'C', 'D', 'E', 'F'][index]);
              }
            },
          }}
        />
      </div>
      {selectedFeature && lineChartData && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Time Trend for Feature {selectedFeature}</h2>
          <Line
            data={lineChartData}
            options={{
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'day',
                  },
                },
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
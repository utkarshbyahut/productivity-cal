"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {useEffect, useState } from "react";
import React from "react";

const fetchLogs = async () => {
    try {
        const response = await fetch("http://localhost:5001/api/logs");
        if (!response.ok) {
            throw new Error("Failed to fetch logs");
        }
        const logs = await response.json();

        // Convert logs into FullCalendar events format
        return logs.map(log => ({
            title: log.content,
            date: log.date.split("T")[0], // Ensure correct format
            id: log._id,
        }));
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};

export default function Calendar() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [logContent, setLogContent] = useState("");
    const [events, setEvents] = useState([]);

    const handleDateClick = (info) => {
        console.log("Date Clicked:", info.dateStr);
        setSelectedDate(info.dateStr);
    };

    // Fetch logs from backend on component mount
    useEffect(() => {
        const loadLogs = async () => {
            const logs = await fetchLogs();
            setEvents(logs); // Set logs to events state
        };

        loadLogs();
    }, []); // Runs only once when the component mounts

    const handleSaveLog = async () => {
        if (!logContent) return; // Prevent saving empty logs
    
        try {
            const response = await fetch("http://localhost:5001/api/logs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    date: selectedDate,
                    content: logContent,
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to save log");
            }
    
            const newLog = await response.json();
    
            // Add the new log to the calendar events (with ID from DB)
            setEvents([...events, { title: newLog.content, date: newLog.date, id: newLog._id }]);
    
            // Clear input and hide form
            setLogContent("");
            setSelectedDate(null);
        } catch (error) {
            console.error("Error saving log:", error);
        }
    };
    

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            <div className="bg-black shadow-lg rounded-lg p-6 w-[80%] max-w-4xl">
                <h1 className="text-2xl font-bold text-center mb-4 text-gray-700">🗓 Calendar</h1>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    dateClick={handleDateClick} // Fixes `datecClick` typo
                    events={events}
                />

                {selectedDate && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <h2 className="text-lg font-semibold">Add Log for {selectedDate}</h2>
                        <input
                            type="text"
                            value={logContent}
                            onChange={(e) => setLogContent(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            placeholder="Enter log content"
                            required
                        />
                        <button
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                            onClick={handleSaveLog}
                        >
                            Save Log
                        </button>    
                    </div>
                )}
            </div>
        </div>   
    );
}


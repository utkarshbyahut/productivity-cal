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

        console.log("📥 Logs Fetched from Backend:", logs); // ✅ Debugging Step

        return logs.map(log => ({
            id: log._id,
            title: log.content,
            description: log.description || "",
            start: log.date.split("T")[0], // ✅ Fixes timezone issue (keeps only YYYY-MM-DD)
            allDay: true, // ✅ Forces FullCalendar to treat it as a full-day event
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
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleDateClick = (info) => {
        console.log("Date Clicked:", info.dateStr);
        setSelectedDate(info.dateStr);
    };

    const handleEventClick = (info) => {
        setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            date: info.event.startStr,
        });
    };

    // Fetch logs from backend on component mount
    useEffect(() => {
        const loadLogs = async () => {
            const logs = await fetchLogs();
            setEvents(logs); // Set logs to events state
        };

        loadLogs();
    }, []); // Runs only once when the component mounts

    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");


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
                    description,
                    startTime,
                    endTime,
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to save log");
            }
    
            const newLog = await response.json();
    
            // Add the new log to the calendar events (with ID from DB)
            setEvents([...events, {
                title: newLog.content,
                date: newLog.date,
                description: newLog.description,
                start: newLog.startTime,
                end: newLog.endTime,
                id: newLog._id,
            }]);
    
            // Clear input and hide form
            setLogContent("");
            setSelectedDate(null);
        } catch (error) {
            console.error("Error saving log:", error);
        }
    };
    
    const handleUpdateEvent = async (updatedEvent) => {
        try {
            // Delete the old event
            await fetch(`http://localhost:5001/api/logs/${updatedEvent.id}`, {
                method: "DELETE",
            });
    
            // Create a new event with updated title
            const response = await fetch("http://localhost:5001/api/logs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    date: updatedEvent.date,
                    content: updatedEvent.title,
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to create new event");
            }
    
            const newEvent = await response.json();
    
            // Update the UI with the new event
            setEvents([...events.filter(event => event.id !== updatedEvent.id), {
                title: newEvent.content,
                date: newEvent.date,
                id: newEvent._id,
            }]);
    
            setSelectedEvent(null); // Close modal
        } catch (error) {
            console.error("Error updating event:", error);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/logs/${eventId}`, {
                method: "DELETE",
            });
    
            if (!response.ok) {
                throw new Error("Failed to delete event");
            }
    
            // Remove from UI
            setEvents(events.filter(event => event.id !== eventId));
            setSelectedEvent(null); // Close modal
        } catch (error) {
            console.error("Error deleting event:", error);
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
                    dateClick={handleDateClick}
                    events={events}
                    eventClick={handleEventClick}
                    ref={(calendar) => {
                        if (calendar) {
                            console.log("📆 FullCalendar Events:", calendar.getApi().getEvents()); // 🔹 Debugging Step
                        }
                    }}

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
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md mt-2"
                            placeholder="Description"
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <input
                            type="time"
                            className="w-full p-2 border rounded-md mt-2"
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                        <input
                            type="time"
                            className="w-full p-2 border rounded-md mt-2"
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                        <button
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                            onClick={handleSaveLog}
                        >
                            Save Log
                        </button>       
                    </div>
                )}

                {selectedEvent && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-md shadow-lg text-center relative z-50">
                            <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
                            
                            {/* Input field for editing */}
                            <input
                                type="text"
                                value={selectedEvent.title}
                                onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            />

                            <p className="text-gray-700">Date: {selectedEvent.date}</p>
                            
                            <div className="mt-4 flex justify-center space-x-4">
                                <button 
                                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                                    onClick={() => handleUpdateEvent(selectedEvent)}
                                >
                                    Save
                                </button>    
                                <button 
                                    className="px-4 py-2 bg-red-500 text-white rounded-md"
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                >
                                    Delete
                                </button>
                                <button 
                                    className="px-4 py-2 bg-gray-300 rounded-md"
                                    onClick={() => setSelectedEvent(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>   
    );
}
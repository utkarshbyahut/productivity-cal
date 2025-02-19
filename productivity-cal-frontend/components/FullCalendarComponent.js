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
            // Want to make a working var as well to keep all the working and database specific values different and separate
            id: log._id,
            title: log.content,
            description: log.description || "",
            startTime: log.startTime, // debug for time
            start: log.date.split("T")[0], // ✅ Fixes timezone issue (keeps only YYYY-MM-DD)
            allDay: true, // ✅ Forces FullCalendar to treat it as a full-day event

            // Starting working values here
            title_wv: log.content.split(" ").slice(2).join(" ") || log.content

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

    /* 
    // Fetch logs from backend on component mount
        useEffect(() => {
            const loadLogs = async () => {
            const logs = await fetchLogs();
            setEvents(logs); // Set logs to events state
        };

        loadLogs();
    }, []); // Runs only once when the component mounts

    */

    useEffect(() => {
        const loadLogs = async () => {
            const logs = await fetchLogs();
    
            const formattedEvents = logs.map(log => ({
                id: log.id,
                title: `${log.startTime ? log.startTime + " - " : ""}${log.title_wv}`, // Adds space & dash
                description: log.description || "",
                start: log.start, // ✅ Fixes timezone issue (keeps only YYYY-MM-DD)
                allDay: true
            }));
            
            console.log(formattedEvents);

            setEvents(formattedEvents); // ✅ Set formatted events to state
        };
    
        loadLogs();

    }, []);

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
                    description : description || "",
                    startTime : startTime || "",
                    endTime : endTime || "",
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to save log");
            }
    
            const newLog = await response.json();
    
            // ✅ Use functional state update to avoid stale state issues
            setEvents((prevEvents) => [
                ...prevEvents,
                {
                    id: newLog.id,
                    title: newLog.content,
                    description: newLog.description,
                    start: newLog.date.split("T")[0], // ✅ Ensures proper formatting
                    allDay: true // ✅ Prevents time-related issues
                },
            ]);
    
            // ✅ Clear input fields
            setLogContent("");
            setSelectedDate(null);
            setDescription("");
            setStartTime("");
            setEndTime("");
    
        } catch (error) {
            console.error("Error saving log:", error);
        }
    };
    
    
    const handleUpdateEvent = async (updatedEvent) => {
        try {
            const response = await fetch(`http://localhost:5001/api/logs/${updatedEvent.id}`, {
                method: "PUT", 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: updatedEvent.id,
                    date: updatedEvent.date,
                    content: updatedEvent.title,
                    description: updatedEvent.description || "", 
                    startTime: updatedEvent.startTime || "00:00",
                    endTime: updatedEvent.endTime || "00:00",
                }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to update event");
            }
    
            const updatedLog = await response.json();
    
            // ✅ Update the UI immediately
            setEvents((prevEvents) =>
                prevEvents.map((event) =>
                    event.id === updatedLog._id
                        ? {
                              ...event,
                              title: updatedLog.content,
                              description: updatedLog.description,
                              start: updatedLog.date.split("T")[0], // ✅ Keeps correct format
                              allDay: true,              
                          } 
                          
                        : event
                )
                
            );
    
            setSelectedEvent(null); // ✅ Close modal after update
    
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

                            <p className="text-xl font-semibold">{selectedEvent.description}</p>
                            <p className="text-xl font-semibold">{selectedEvent.startTime}</p>
                            <p className="text-xl font-semibold">{selectedEvent.endTime}</p>

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
const express = require('express');
const Log = require('../models/Log');
const router = express.Router();

//Route 1: Create a new log
router.post('/', async (req, res) => {
    try {
        const { date, content, description, startTime, endTime } = req.body;

        if (!date || !content) {
            return res.status(400).json({ message: 'Date and content are required' });
        }

        const newLog = new Log({
            date,
            content,
            description: description || "", // Default empty if not provided
            startTime: startTime || "",
            endTime: endTime || ""
        });

        await newLog.save();

        res.status(201).json(newLog);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const log = await Log.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        await log.deleteOne();
        res.status(200).json({ message: 'Log deleted successfully' });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

//Route 2: Get all logs
router.get('/', async (req, res) => {
    try {
        const logs = await Log.find().sort({ date: -1 }); // Sort logs by date (latest first)
        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});

// ✅ Route: Update an existing log by ID
router.put('/:id', async (req, res) => {
    try {
        const { date, content, description, startTime, endTime } = req.body;

        const updatedLog = await Log.findByIdAndUpdate(
            req.params.id,
            { date, content, description, startTime, endTime },
            { new: true } // ✅ Return the updated document
        );

        if (!updatedLog) {
            return res.status(404).json({ message: "Log not found" });
        }

        res.status(200).json(updatedLog);
    } catch (error) {
        console.error("Error updating log:", error);
        res.status(500).json({ message: "Server error", error });
    }
});


module.exports = router;

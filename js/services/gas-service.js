/**
 * ============================================================
 * Luminova GAS Service Layer (gas-service.js)
 * ============================================================
 * Enterprise-grade API service for all Google Apps Script
 * communication. Decouples network logic from UI components.
 *
 * CORS STRATEGY:
 *   All requests use method POST with Content-Type 'text/plain;charset=utf-8'.
 *   This forces the browser to treat every request as a "Simple Request",
 *   completely bypassing the OPTIONS preflight that Google Apps Script rejects.
 *
 * USAGE:
 *   await Luminova.Services.GAS.verifyStudent(webhookUrl, payload);
 *   await Luminova.Services.GAS.submitExam(webhookUrl, payload);
 * ============================================================
 */
(function () {
    "use strict";

    if (!window.__LUMINOVA) return;
    const Luminova = window.__LUMINOVA;

    // Initialize Services namespace
    if (!Luminova.Services) Luminova.Services = {};

    // ─── Internal fetch wrapper ───────────────────────────────
    // Single point of truth for ALL outbound requests to GAS.
    // Enforces POST + text/plain on every call.
    async function _gasFetch(url, payload) {
        // 0. Protocol Safety: Detect file:// execution environment
        if (window.location.protocol === 'file:') {
            throw new Error(
                "PROTOCOL ERROR: This application is running from a local file (file://). " +
                "API calls require an HTTP server. Please host the application on a web server " +
                "(e.g., Live Server, localhost, or a deployed URL) to enable exam submission."
            );
        }

        // 1. URL Sanity Check
        if (!url || !url.includes('/macros/s/') || !url.endsWith('/exec')) {
            throw new Error(
                "INVALID WEBHOOK URL: The URL must be a deployed Web App URL ending in '/exec', not a library or script editor URL."
            );
        }

        // 2. Strict Simple-Request Fetch (with timeout & error handling)
        let response;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                throw new Error('REQUEST TIMEOUT: The server did not respond within 30 seconds. Please check your internet connection and try again.');
            }
            // Network errors (offline, CORS, DNS failure)
            throw new Error(
                'NETWORK ERROR: Could not reach the server. ' +
                'Please check your internet connection. ' +
                '(Detail: ' + (fetchError.message || 'Unknown network error') + ')'
            );
        }

        // 3. HTTP Status Guard
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 4. Parse JSON response from GAS
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            throw new Error('PARSE ERROR: The server returned an invalid response. Expected JSON. (Detail: ' + (parseError.message || 'Unknown parse error') + ')');
        }
        return data;
    }

    // ─── Public API ───────────────────────────────────────────

    Luminova.Services.GAS = {

        /**
         * PRE-EXAM GATEKEEPER — Verify if a student has already submitted.
         *
         * @param {string} webhookUrl - The per-exam Web App URL from CMS.
         * @param {object} studentData - { exam, name, email, seat }
         * @returns {Promise<object>} - Resolves with { status: 'exists' | 'clear' }
         * @throws {Error} on network failure or invalid URL.
         *
         * PAYLOAD SCHEMA (what the backend receives):
         * {
         *   "action":  "verify",        // String — routing key for doPost
         *   "exam":    "Exam Title",     // String — exam identifier
         *   "name":    "Student Name",   // String — student full name
         *   "email":   "a@b.com",        // String — student email
         *   "seat":    "42"              // String — seat number
         * }
         */
        verifyStudent: async function (webhookUrl, { exam, name, email, seat }) {
            const payload = {
                action: 'verify',
                exam: exam,
                name: name,
                email: email,
                seat: seat
            };

            return await _gasFetch(webhookUrl, payload);
        },

        /**
         * EXAM SUBMISSION — Send the student's completed exam to the backend.
         *
         * @param {string} webhookUrl - The per-exam Web App URL from CMS.
         * @param {object} examData - Full submission payload.
         * @returns {Promise<object>} - Resolves with backend confirmation.
         * @throws {Error} on network failure or invalid URL.
         *
         * PAYLOAD SCHEMA (what the backend receives):
         * {
         *   "action":            "submit",           // String — routing key for doPost
         *   "studentName":       "Student Name",     // String
         *   "seatNumber":        "42",               // String
         *   "department":        "CS",               // String
         *   "email":             "a@b.com",          // String
         *   "examTitle":         "Exam Title",       // String
         *   "score":             18,                 // Number
         *   "maxScore":          20,                 // Number
         *   "timeTaken":         "N/A",              // String
         *   "terminationReason": "completed",        // String — "completed" | "time_expired" | "anti_cheat_violation"
         *   "adminEmails":       "a@b.com,c@d.com", // String (comma-separated)
         *   "responses": [                           // Array of Objects
         *     {
         *       "question":      "Question text",    // String
         *       "studentAnswer": "Option B",         // String | Array | null
         *       "isCorrect":     true                // Boolean
         *     }
         *   ]
         * }
         */
        submitExam: async function (webhookUrl, examData) {
            const payload = {
                action: 'submit',
                studentName: examData.studentName,
                seatNumber: examData.seatNumber,
                department: examData.department,
                email: examData.email,
                examTitle: examData.examTitle,
                score: examData.score,
                maxScore: examData.maxScore,
                timeTaken: examData.timeTaken,
                terminationReason: examData.terminationReason,
                adminEmails: examData.adminEmails,
                responses: examData.responses
            };

            return await _gasFetch(webhookUrl, payload);
        }
    };

    console.log('✅ Luminova GAS Service Layer loaded.');

})();

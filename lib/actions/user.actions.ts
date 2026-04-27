'use server'


import {connectToDatabase} from "@/database/mongoose";




export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Mongoose connection not connected");
        }

        // Better Auth stores records in "user". Keep "users" as fallback for legacy data.
        const [authUsers, legacyUsers] = await Promise.all([
            db.collection("user").find(
                { email: { $exists: true, $ne: null } },
                { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
            ).toArray(),
            db.collection("users").find(
                { email: { $exists: true, $ne: null } },
                { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
            ).toArray()
        ]);

        const users = [...authUsers, ...legacyUsers];
        const seenEmails = new Set<string>();

        return users
            .filter((user) => user.email && user.name)
            .filter((user) => {
                const email = String(user.email).toLowerCase();
                if (seenEmails.has(email)) return false;
                seenEmails.add(email);
                return true;
            })
            .map((user) => ({
                id: user.id || user._id?.toString() || '',
                email: user.email,
                name: user.name,
            }));

    } catch (err) {
        console.log('Error fetching users for news email', err);
        return [];
    }
};
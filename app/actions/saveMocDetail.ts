import { db } from "../configs/db";
import { mocRecords } from "../configs/schema";




type MocRecord = {
    type: string;
    mocNumber: string; // Keep this in camelCase
    smallDescription: string; // Keep this in camelCase
    mocName: string; // Keep this in camelCase
    awardedDate: Date; // Keep this as Date
    startDate: Date; // Keep this as Date
    mccDate: Date; // Keep this as Date
    value: number; // Keep this as number
    scope: string[]; // Keep this as string array
    pqrStatus: string; // Keep this in camelCase
    wqtStatus: string; // Keep this in camelCase
    wpsStatus: string; // Keep this in camelCase
};

// Save MOC Record Function
export async function saveMocDetail(data: MocRecord) {
    const {
        type,
        mocNumber,
        smallDescription,
        mocName,
        awardedDate,
        startDate,
        mccDate,
        value,
        scope,
        pqrStatus,
        wqtStatus,
        wpsStatus,
    } = data;

    try {
        // Insert new record into the moc_records table
        await db.insert(mocRecords).values({
            type,
            mocNumber, // Use camelCase as defined in the schema
            smallDescription, // Use camelCase as defined in the schema
            mocName, // Use camelCase as defined in the schema
            awardedDate: awardedDate.toISOString(), // Convert to ISO string if necessary
            startDate: startDate.toISOString(), // Convert to ISO string if necessary
            mccDate: mccDate.toISOString(), // Convert to ISO string if necessary
            value,
            scope: JSON.stringify(scope), // Convert scope array to JSON string
            pqrStatus, // Use camelCase as defined in the schema
            wqtStatus, // Use camelCase as defined in the schema
            wpsStatus, // Use camelCase as defined in the schema
        });

        return { success: true };
    } catch (error) {
        console.error("Error saving MOC record:", error);
        return { success: false, message: "Failed to save MOC record" };
    }
}
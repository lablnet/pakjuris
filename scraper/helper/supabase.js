const { createClient } = require('@supabase/supabase-js');
// load .env file
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Checks if a member already exists in the database.
 *
 * @param {string} name - The name of the member.
 * @param {string} fatherName - The father's name of the member.
 * @param {string} constituency - The member's constituency.
 * @returns {Promise<boolean>} - True if the member exists, false otherwise.
 */
async function memberExists(name, fatherName, constituency) {
    try {
        const { data, error, count } = await supabase
            .from('members')
            .select('name, father_name, constituency', { count: 'exact' })
            .match({ name, father_name: fatherName, constituency });

        if (error) {
            console.error('Error checking member existence:', error);
            return false; // Or throw the error if you want to stop execution
        }
        return count > 0;
    } catch (error) {
        console.error('Error checking member existence:', error);
        return false;
    }
}




/**
 * Adds a member to the Supabase database.
 *
 * @param {object} memberData - The member data to add.
 * @returns {Promise<object>} - The result of the insertion.
 */
async function addMember(memberData) {
    try {
        const { data, error } = await supabase
            .from('members')
            .insert([memberData]); // Insert as an array for multiple members

        if (error) {
            console.error('Error adding member:', error);
            throw error; // Re-throw the error to be handled by the calling function
        }
        return data;

    } catch (error) {
        console.error('Error adding member:', error);
        throw error;
    }
}

const checkFileExists = async(bucketName, filePath) => {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .list(filePath)

    if (error) {
        console.error(error)
        return false
    }
    if (data.length > 0) {
        // return file public url
        return data[0].publicUrl;
    }
    return false;
};

/**
 * Uploads an image to Supabase storage and returns the public URL.
 *
 * @param {Buffer} imageBuffer - The image data as a Buffer.
 * @param {string} imageName - The desired name for the image in storage.
 * @returns {Promise<string|null>} - The public URL of the uploaded image, or null if upload fails.
 */
async function uploadImage(folderName, fileBuffer, fileName, bucketName = "images") {
    // Construct the full file path by combining folder name and image name
    const filePath = `${folderName}/${fileName}`;
    // get file mime type
    const fileMimeType = "image/jpeg"; // fileBuffer.mimeType;
    const fileExists = await checkFileExists(bucketName, filePath);
    if (fileExists) {
        return fileExists;
    }
    try {
        const { data, error } = await supabase.storage
            .from(bucketName) // Your storage bucket name
            .upload(filePath, fileBuffer, {
                upsert: true, // Overwrite if the file already exists
                contentType: fileMimeType
            });

        if (error) {
            console.error("Error uploading image:", error);
            return null;
        }

        // Construct the public URL
        const publicUrl = `${supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl}`;
        return publicUrl;

    } catch (error) {
        console.error('Error uploading and getting URL:', error);
        return null;
    }
}

// get party by abbreviation use LIKE
async function getPartyByAbbreviation(abbreviation) {
    const { data, error } = await supabase
        .from('parties')
        .select('*')
        .ilike('abbreviation', abbreviation);
    return data;
}

// Export the functions
module.exports = {
    memberExists,
    addMember,
    uploadImage,
    supabase,
    getPartyByAbbreviation
};
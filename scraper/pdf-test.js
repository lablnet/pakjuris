const fs = require('fs');
const pdf = require('pdf-parse');

// Read the PDF file
const dataBuffer = fs.readFileSync('./pdfs/2017_Companies_Act_2017.pdf');

const getSpecificPage = async(data, pageNum) => {
    try {
        // Get all text and split by page breaks
        const allText = data.text;

        // Find page markers in the text (page numbers are usually at the bottom)
        const pageRegex = /Page\s+(\d+)\s+of\s+\d+/g;
        let match;
        let pageLocations = [];

        // Find all page number locations in the text
        while ((match = pageRegex.exec(allText)) !== null) {
            pageLocations.push({
                pageNum: parseInt(match[1]),
                position: match.index,
                marker: match[0] // Store the actual marker text
            });
        }

        console.log(`Found ${pageLocations.length} page markers`);

        // Find the requested page
        const pageIndex = pageLocations.findIndex(p => p.pageNum === pageNum);

        if (pageIndex !== -1) {
            // Start from the actual page marker including the text "Page X of Y"
            const startPos = pageLocations[pageIndex].position;

            // End at the next page marker (or end of document)
            const endPos = pageIndex < pageLocations.length - 1 ?
                pageLocations[pageIndex + 1].position : allText.length;

            // Extract just this page's content
            let pageContent = allText.substring(startPos, endPos);
            // remove Page pageNum of pageNum
            pageContent = pageContent.replace(`Page ${pageNum} of ${pageNum}`, '');
            return pageContent;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return null;
    }
}

(async() => {
    try {
        // Get all pages
        const data = await pdf(dataBuffer);
        const numPages = data.numpages;
        console.log(`Number of pages: ${numPages}`);

        const page1 = await getSpecificPage(data, 0);
        console.log(page1);

    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
})();
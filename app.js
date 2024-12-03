const { createApp, ref, watch } = Vue;
const { VeProgress } = veprogress;

createApp({
    components: {
        VeProgress
    },
    setup() {
        const students = ref([]);
        const sections = ref([]);
        const config = ref({
            examName: '',
            examDate: '',
            department: 'Computer Science',
            university: 'Example University',
            sectionSize: 20,
            debug: false // Debug mode variable
        });
        const loading = ref(false);
        const progress = ref(0);
        let typingTimer;

        // Handle file upload and initiate CSV parsing
        const handleFileUpload = (event) => {
            loading.value = true;
            progress.value = 0;
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                const csv = e.target.result;
                await parseCSV(csv);
                await sortAndSectionStudents();
                generatePDF();
                loading.value = false;
            };
            reader.readAsText(file);
        };

        // Function to parse CSV data
        const parseCSV = async (csv) => {
	    if (config.value.debug) console.log("Parsing CSV...");
	    const lines = csv.split('\n');
	    if (config.value.debug) console.log("CSV Lines:", lines);

	    const examInfo = lines[0].split(',');
	    if (config.value.debug) console.log("Exam Info Line:", examInfo);

	    config.value.examName = examInfo[1];
	    if (config.value.debug) console.log("Exam Name:", config.value.examName);
	    
	    // Bug description: The date field may contain a comma after the weekday, causing incorrect parsing.
	    // Attempt to extract the date from field 4
	    let dateField = examInfo[4];
	    if (config.value.debug) console.log("Initial Date Field:", dateField);

	    let dateMatch = dateField.match(/\b\d{1,2}\.\s\w+\s\d{4}\b/);
	    if (config.value.debug) console.log("Initial Date Match:", dateMatch);
	    
	    // If date extraction from field 4 fails, try field 5
	    if (!dateMatch) {
		dateField = examInfo[5];
		if (config.value.debug) console.log("Fallback Date Field:", dateField);

		dateMatch = dateField.match(/\b\d{1,2}\.\s\w+\s\d{4}\b/);
		if (config.value.debug) console.log("Fallback Date Match:", dateMatch);
	    }

	    if (dateMatch) {
		const dateStr = dateMatch[0];
		if (config.value.debug) console.log("Extracted Date String:", dateStr);

		const [day, month, year] = dateStr.split(' ');
		if (config.value.debug) console.log("Day:", day, "Month:", month, "Year:", year);

		const months = {
		    'Januar': '01',
		    'Februar': '02',
		    'März': '03',
		    'April': '04',
		    'Mai': '05',
		    'Juni': '06',
		    'Juli': '07',
		    'August': '08',
		    'September': '09',
		    'Oktober': '10',
		    'November': '11',
		    'Dezember': '12'
		};
		const formattedDate = new Date(`${year}-${months[month]}-${day.replace('.', '')}`).toISOString().split('T')[0];
		config.value.examDate = formattedDate;
	    } else {
		config.value.examDate = "Date not found";
	    }
	    
	    if (config.value.debug) console.log("Exam Date:", config.value.examDate);

	    const headers = lines[1].split(',');
	    if (config.value.debug) console.log("CSV Headers:", headers);

	    const result = [];
	    for (let i = 2; i < lines.length; i++) {
		const currentline = lines[i].split(',');
		if (config.value.debug) console.log(`Processing Line ${i}:`, currentline);

		if (currentline.length === headers.length) {
		    const obj = {};
		    for (let j = 1; j < headers.length; j++) {
		        obj[headers[j].trim()] = currentline[j].trim();
		    }
		    result.push(obj);
		}
		progress.value = Math.round((i / lines.length) * 100);
		await new Promise(resolve => setTimeout(resolve, 0));
	    }
	    students.value = result;
	    if (config.value.debug) console.log("Students:", students.value);
	};

        // Function to generate PDF
        const generatePDF = async () => {
	    console.log("Generating PDF...");
	    const { PDFDocument, rgb, StandardFonts } = PDFLib;
	    const pdfDoc = await PDFDocument.create();
	    const A4_WIDTH = 210 * 2.83465; // 210 mm in points
	    const A4_HEIGHT = 297 * 2.83465; // 297 mm in points

	    // Load fonts
	    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
	    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	    for (let sectionIndex = 0; sectionIndex < sections.value.length; sectionIndex++) {
		const section = sections.value[sectionIndex];
		
		// Create section page
		const sectionPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
		const sectionWidth = sectionPage.getWidth();
		const sectionHeight = sectionPage.getHeight();
		const fontSize = 12;
		
		// Section title
		sectionPage.drawText(`Section ${sectionIndex + 1}`, {
		    x: sectionWidth / 2,
		    y: sectionHeight - 20 * 2.83465,
		    size: fontSize,
		    font: helveticaBoldFont,
		    color: rgb(0, 0, 0),
		    align: 'center'
		});

		for (let studentIndex = 0; studentIndex < section.length; studentIndex++) {
		    const student = section[studentIndex];
		    const yPosition = sectionHeight - (studentIndex + 3) * 2 * fontSize;
		    sectionPage.drawText(`Name: ${student.Name}`, {
		        x: 50,
		        y: yPosition,
		        size: fontSize,
		        font: helveticaFont,
		        color: rgb(0, 0, 0),
		    });
		    sectionPage.drawText(`Matrikelnummer: ${student.Matrikelnummer}`, {
		        x: 200,
		        y: yPosition,
		        size: fontSize,
		        font: helveticaFont,
		        color: rgb(0, 0, 0),
		    });
		}

		// Generate cover page for each student
		for (let studentIndex = 0; studentIndex < section.length; studentIndex++) {
		    const student = section[studentIndex];
		    const coverPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
		    const coverWidth = coverPage.getWidth();
		    const coverHeight = coverPage.getHeight();

		    // University name (top left) and Exam date (top right) on the same height as the top barcode
		    const barcodeTopY = coverHeight - 20 * 2.83465;
		    coverPage.drawText(config.value.university, {
		        x: 10 * 2.83465,
		        y: barcodeTopY,
		        size: 12,
		        font: helveticaFont,
		        color: rgb(0, 0, 0),
		    });
		    coverPage.drawText(config.value.examDate, {
		        x: coverWidth - 50 * 2.83465,
		        y: barcodeTopY,
		        size: 12,
		        font: helveticaFont,
		        color: rgb(0, 0, 0),
		    });

		    // Barcode Matrikelnummer (top center)
		    const coverCanvasTop = document.createElement('canvas');
		    JsBarcode(coverCanvasTop, student.Matrikelnummer, {
		        format: "CODE128",
		        displayValue: true,
		        fontSize: 40, // Increase the font size for the number under the barcode
		        height: 50, // Set the barcode height to 50
		        textPosition: "top" // Set the text position to top
		    });
		    const coverBarcodeImageTop = await pdfDoc.embedPng(coverCanvasTop.toDataURL('image/png'));
		    coverPage.drawImage(coverBarcodeImageTop, {
		        x: coverWidth / 2 - 50,
		        y: barcodeTopY - 30, // Adjusted to account for text position at top
		        width: 100,
		        height: 50
		    });

		    // Exam name (main heading, center) with word wrapping and larger font size
		    const examName = config.value.examName;
		    const examNameWrapped = examName.split(' ').reduce((acc, word) => {
		        const lastLine = acc[acc.length - 1];
		        if (lastLine && (lastLine + ' ' + word).length <= 30) {
		            acc[acc.length - 1] = lastLine + ' ' + word;
		        } else {
		            acc.push(word);
		        }
		        return acc;
		    }, []);
		    coverPage.setFont(helveticaBoldFont, 32);
		    let examNameY = coverHeight / 2 + 30 * 2.83465;
		    examNameWrapped.forEach(line => {
		        const examNameWidth = helveticaBoldFont.widthOfTextAtSize(line, 32);
		        coverPage.drawText(line, {
		            x: (coverWidth - examNameWidth) / 2,
		            y: examNameY,
		            size: 32,
		            font: helveticaBoldFont,
		            color: rgb(0, 0, 0),
		            align: 'center'
		        });
		        examNameY -= 40;
		    });

		    // Department (subheading, center) with word wrapping
		    const department = config.value.department;
		    const departmentWrapped = department.split(' ').reduce((acc, word) => {
		        const lastLine = acc[acc.length - 1];
		        if (lastLine && (lastLine + ' ' + word).length <= 40) {
		            acc[acc.length - 1] = lastLine + ' ' + word;
		        } else {
		            acc.push(word);
		        }
		        return acc;
		    }, []);
		    coverPage.setFont(helveticaFont, 16);
		    let departmentY = examNameY - 20;
		    departmentWrapped.forEach(line => {
		        const departmentWidth = helveticaFont.widthOfTextAtSize(line, 16);
		        coverPage.drawText(line, {
		            x: (coverWidth - departmentWidth) / 2,
		            y: departmentY,
		            size: 16,
		            font: helveticaFont,
		            color: rgb(0, 0, 0),
		            align: 'center'
		        });
		        departmentY -= 20;
		    });

		    // Grading field (bottom area)
		    coverPage.drawRectangle({
		        x: 10 * 2.83465,
		        y: 40 * 2.83465,
		        width: coverWidth - 20 * 2.83465,
		        height: 50 * 2.83465,
		        borderColor: rgb(0, 0, 0),
		        borderWidth: 1
		    });

		    // Section number (bottom center, above the bottom barcode)
		    const sectionNumberY = 10 * 2.83465 + 40 + 10; // Adjusted to be above the bottom barcode
		    const sectionNumberText = `Section ${sectionIndex + 1}`;
		    const sectionNumberWidth = helveticaFont.widthOfTextAtSize(sectionNumberText, fontSize);
		    coverPage.drawText(sectionNumberText, {
		        x: (coverWidth - sectionNumberWidth) / 2,
		        y: sectionNumberY,
		        size: fontSize, // Normal font size
		        font: helveticaFont,
		        color: rgb(0, 0, 0),
		        align: 'center'
		    });

		    // Barcode Matrikelnummer (bottom center)
		    const coverCanvasBottom = document.createElement('canvas');
		    JsBarcode(coverCanvasBottom, student.Matrikelnummer, {
		        format: "CODE128",
		        displayValue: true,
		        fontSize: 40, // Increase the font size for the number under the barcode
		        height: 50 // Set the barcode height to 50
		    });
		    const coverBarcodeImageBottom = await pdfDoc.embedPng(coverCanvasBottom.toDataURL('image/png'));
		    coverPage.drawImage(coverBarcodeImageBottom, {
		        x: coverWidth / 2 - 50,
		        y: 10 * 2.83465,
		        width: 100,
		        height: 50 // Set the barcode height to 50
		    });
		}
		progress.value = Math.round(((sectionIndex + 1) / sections.value.length) * 100);
		await new Promise(resolve => setTimeout(resolve, 0));
	    }

	    const pdfBytes = await pdfDoc.save();
	    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
	    const url = URL.createObjectURL(blob);
	    console.log("Generated PDF URL:", url);
	    document.getElementById('pdf-preview').src = url;
	    console.log("PDF generated and displayed.");
	};


        // Sort students and divide them into sections
        const sortAndSectionStudents = async () => {
	    console.log("Sorting and sectioning students...");
	    
	    // Sort students by Name, Vorname, and Mittelname
	    students.value.sort((a, b) => {
		if (a.Name !== b.Name) return a.Name.localeCompare(b.Name);
		if (a.Vorname !== b.Vorname) return a.Vorname.localeCompare(b.Vorname);
		return a.Mittelname.localeCompare(b.Mittelname);
	    });

	    // Map to keep track of students with the same base name
	    const nameMap = new Map();

	    // Populate the map with students grouped by their base name
	    students.value.forEach(student => {
		const baseName = student.Name;
		if (!nameMap.has(baseName)) {
		    nameMap.set(baseName, []);
		}
		nameMap.get(baseName).push(student);
	    });

	    // Iterate over each group of students with the same base name
	    nameMap.forEach((studentsWithSameName, baseName) => {
		if (studentsWithSameName.length > 1) {
		    // Map to keep track of students with the same full name (Name + Vorname)
		    const firstNamesMap = new Map();

		    // Populate the map with students grouped by their full name
		    studentsWithSameName.forEach(student => {
		        const fullName = `${student.Name}, ${student.Vorname}`;
		        if (!firstNamesMap.has(fullName)) {
		            firstNamesMap.set(fullName, []);
		        }
		        firstNamesMap.get(fullName).push(student);
		    });

		    // Iterate over each group of students with the same full name
		    firstNamesMap.forEach((studentsWithSameFirstName, fullName) => {
		        if (studentsWithSameFirstName.length > 1) {
		            // If there are multiple students with the same full name, add the Mittelname
		            studentsWithSameFirstName.forEach(student => {
		                student.Name = `${student.Name}, ${student.Vorname}, ${student.Mittelname}`;
		            });
		        } else {
		            // If the full name is unique, add only the Vorname
		            studentsWithSameFirstName.forEach(student => {
		                student.Name = `${student.Name}, ${student.Vorname}`;
		            });
		        }
		    });
		}
	    });

	    // Divide students into sections based on the section size
	    sections.value = [];
	    for (let i = 0; i < students.value.length; i += config.value.sectionSize) {
		sections.value.push(students.value.slice(i, i + config.value.sectionSize));
		progress.value = Math.round(((i + config.value.sectionSize) / students.value.length) * 100);
		await new Promise(resolve => setTimeout(resolve, 0));
	    }
	    console.log("Sections:", sections.value);
	};

        // Delayed processing to handle user input changes
        const delayedProcessing = () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(async () => {
                loading.value = true;
                progress.value = 0;
                await sortAndSectionStudents();
                generatePDF();
                loading.value = false;
            }, 3000);
        };

        // Immediate processing for user input changes
        const immediateProcessing = async () => {
            clearTimeout(typingTimer);
            loading.value = true;
            progress.value = 0;
            await sortAndSectionStudents();
            generatePDF();
            loading.value = false;
        };

        // Watch for changes in config and trigger delayed processing
        watch([config], delayedProcessing, { deep: true });

        return {
            students,
            config,
            handleFileUpload,
            loading,
            progress,
            immediateProcessing
        };
    }
}).mount('#app');

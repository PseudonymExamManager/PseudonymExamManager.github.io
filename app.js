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
	    debug: false, // Debug mode variable
	    projectSource: 'https://github.com/PseudonymExamManager/PseudonymExamManager.github.io', // Project source URL
	    privacyInfo: 'https://pseudonymexammanager.github.io/privacy' // Privacy information URL
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
	    const { PDFDocument, rgb, StandardFonts } = PDFLib; // Ensure rgb is imported here
	    const pdfDoc = await PDFDocument.create();
	    pdfDoc.setCreator(config.value.projectSource);
	    pdfDoc.setProducer('PseudonymExamManager');
	    const A4_WIDTH = 210 * 2.83465; // 210 mm in points
	    const A4_HEIGHT = 297 * 2.83465; // 297 mm in points

	    // Load fonts
	    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
	    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	    for (let sectionIndex = 0; sectionIndex < sections.value.length; sectionIndex++) {
		const section = sections.value[sectionIndex];
		
		// Create section page
		createSectionPage(pdfDoc, section, sectionIndex, helveticaFont, helveticaBoldFont, A4_WIDTH, A4_HEIGHT, rgb);

		// Generate cover page for each student
		for (let studentIndex = 0; studentIndex < section.length; studentIndex++) {
		    const student = section[studentIndex];
		    await createCoverPage(pdfDoc, student, sectionIndex, helveticaFont, helveticaBoldFont, A4_WIDTH, A4_HEIGHT, rgb);
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

	const createSectionPage = (pdfDoc, section, sectionIndex, helveticaFont, helveticaBoldFont, A4_WIDTH, A4_HEIGHT, rgb) => {
	    const headers = ["Name", "Student\nNumber", "ID\nCheck", "Remarks"];
	    const maxNameColumnWidth = 300;
	    const maxStudentNumberColumnWidth = 100; // Set a reasonable maximum width for student number
	    const otherColumnWidths = [40, 150]; // Widths for ID Check and Remarks
	    const fontSize = 12;
	    const lineHeight = 1.5 * fontSize; // Adjust line height for better readability
	    const margin = 50;
	    const usableHeight = A4_HEIGHT - 60 * 2.83465; // Adjust for margins and header

	    // Calculate the dynamic width of the Name column
	    let nameColumnWidth = 0;
	    section.forEach(student => {
		const nameWidth = helveticaFont.widthOfTextAtSize(student.Name, fontSize);
		if (nameWidth > nameColumnWidth) {
		    nameColumnWidth = nameWidth;
		}
	    });
	    nameColumnWidth = Math.min(nameColumnWidth + 10, maxNameColumnWidth); // Add some padding and cap at max width

	    // Calculate the dynamic width of the Student Number column
	    let studentNumberColumnWidth = 0;
	    section.forEach(student => {
		const numberWidth = helveticaFont.widthOfTextAtSize(student.Matrikelnummer, fontSize);
		if (numberWidth > studentNumberColumnWidth) {
		    studentNumberColumnWidth = numberWidth;
		}
	    });
	    studentNumberColumnWidth = Math.min(studentNumberColumnWidth + 10, maxStudentNumberColumnWidth); // Add some padding and cap at max width

	    const columnWidths = [nameColumnWidth, studentNumberColumnWidth, ...otherColumnWidths];

	    let yPosition = A4_HEIGHT - 40 * 2.83465;
	    let pageIndex = 1;

	    // Function to draw table headers
	    const drawTableHeaders = (page) => {
		headers.forEach((header, index) => {
		    const lines = header.split('\n');
		    lines.forEach((line, lineIndex) => {
		        page.drawText(line, {
		            x: margin + columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
		            y: yPosition - (lineIndex * lineHeight),
		            size: fontSize,
		            font: helveticaBoldFont,
		            color: rgb(0, 0, 0),
		        });
		    });
		});
		yPosition -= lineHeight * 2;
	    };

	    // Function to split text based on column width
	    const splitText = (text, maxWidth, font, fontSize) => {
		const words = text.split(' ');
		let lines = [];
		let currentLine = words[0];

		for (let i = 1; i < words.length; i++) {
		    const word = words[i];
		    const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
		    if (width < maxWidth) {
		        currentLine += ' ' + word;
		    } else {
		        lines.push(currentLine);
		        currentLine = word;
		    }
		}
		lines.push(currentLine);
		return lines;
	    };

	    // Function to draw table rows
	    const drawTableRows = (page, startIndex) => {
		let currentIndex = startIndex;
		while (currentIndex < section.length && yPosition > lineHeight) {
		    const student = section[currentIndex];
		    const studentData = [
		        student.Name,
		        student.Matrikelnummer,
		        "", // ID Check (empty)
		        ""  // Remarks (empty)
		    ];

		    let maxLines = 1; // Track the maximum number of lines for the current row

		    studentData.forEach((data, index) => {
		        let textLines;
		        if (index === 0 && columnWidths[index] >= maxNameColumnWidth) {
		            // Only apply hyphenation if the name column width is at its maximum
		            textLines = splitText(data, columnWidths[index] - 2, helveticaFont, fontSize);
		        } else {
		            textLines = [data];
		        }

		        textLines.forEach((line, lineIndex) => {
		            page.drawText(line, {
		                x: margin + columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
		                y: yPosition - (lineIndex * lineHeight),
		                size: fontSize,
		                font: helveticaFont,
		                color: rgb(0, 0, 0),
		            });
		        });
		        if (textLines.length > maxLines) {
		            maxLines = textLines.length; // Update maxLines if more lines are needed
		        }
		    });

		    // Draw a box for the ID Check column
		    const boxX = margin + columnWidths.slice(0, 2).reduce((a, b) => a + b, 0);
		    const boxY = yPosition - (maxLines - 1) * lineHeight; // Adjust box position
		    page.drawRectangle({
		        x: boxX,
		        y: boxY,
		        width: columnWidths[2] - 30, // Adjust box width
		        height: 10, // Box height
		        borderColor: rgb(0, 0, 0),
		        borderWidth: 1,
		    });

		    // Draw horizontal line 2px above the row
		    const lineY = yPosition + 11;
		    page.drawLine({
		        start: { x: 0, y: lineY }, // Start at the left edge
		        end: { x: A4_WIDTH, y: lineY }, // End at the right edge
		        thickness: 0.5,
		        color: rgb(0, 0, 0),
		    });

		    // Store the line height for use in the cover page
		    student.lineY = lineY;

		    yPosition -= maxLines * lineHeight; // Adjust yPosition for the next row
		    currentIndex++;
		}
		return currentIndex;
	    };

	    // Create initial page and draw headers
	    let sectionPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
	    sectionPage.drawText(`Section ${sectionIndex + 1}`, {
		x: A4_WIDTH / 2 - 50,
		y: A4_HEIGHT - 20 * 2.83465,
		size: fontSize,
		font: helveticaBoldFont,
		color: rgb(0, 0, 0),
	    });
	    yPosition -= 20;
	    drawTableHeaders(sectionPage);

	    // Draw rows and handle page overflow
	    let startIndex = 0;
	    while (startIndex < section.length) {
		startIndex = drawTableRows(sectionPage, startIndex);
		if (startIndex < section.length) {
		    // Add new page
		    sectionPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
		    pageIndex++;
		    yPosition = A4_HEIGHT - 40 * 2.83465;
		    sectionPage.drawText(`Section ${sectionIndex + 1}`, {
		        x: A4_WIDTH / 2 - 50,
		        y: A4_HEIGHT - 20 * 2.83465,
		        size: fontSize,
		        font: helveticaBoldFont,
		        color: rgb(0, 0, 0),
		    });
		    yPosition -= 20;
		    drawTableHeaders(sectionPage);
		}
	    }
	};

	
	const createCoverPage = async (pdfDoc, student, sectionIndex, helveticaFont, helveticaBoldFont, A4_WIDTH, A4_HEIGHT, rgb) => {
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
	    const sectionNumberWidth = helveticaFont.widthOfTextAtSize(sectionNumberText, 12);
	    coverPage.drawText(sectionNumberText, {
		x: (coverWidth - sectionNumberWidth) / 2,
		y: sectionNumberY,
		size: 12, // Normal font size
		font: helveticaFont,
		color: rgb(0, 0, 0),
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

	    // Draw short horizontal lines at the same height as the section page lines
	    const lineY = student.lineY;
	    coverPage.drawLine({
		start: { x: 0, y: lineY }, // Start at the left edge
		end: { x: 10 * 2.83465, y: lineY }, // Short line at the left edge, half the length
		thickness: 0.5,
		color: rgb(0, 0, 0),
	    });
	    coverPage.drawLine({
		start: { x: coverWidth - 10 * 2.83465, y: lineY }, // Short line at the right edge, half the length
		end: { x: coverWidth, y: lineY }, // End at the right edge
		thickness: 0.5,
		color: rgb(0, 0, 0),
	    });
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

	// Set a cookie for a very long time (effectively forever)
	// Only 'department' and 'university' values are stored
	const setCookie = (name, value) => {
	    const d = new Date();
	    d.setTime(d.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // 100 years
	    const expires = "expires=" + d.toUTCString();
	    document.cookie = name + "=" + value + ";" + expires + ";path=/";
	};

	// Get a cookie by name
	const getCookie = (name) => {
	    const nameEQ = name + "=";
	    const ca = document.cookie.split(';');
	    for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	    }
	    return null;
	};

	// Load 'department' and 'university' from cookies
	const loadConfigFromCookies = () => {
	    const savedDepartment = getCookie('exam_department');
	    const savedUniversity = getCookie('exam_university');
	    if (savedDepartment) config.value.department = savedDepartment;
	    if (savedUniversity) config.value.university = savedUniversity;
	};

	// Save 'department' and 'university' to cookies when they change
	const watchConfigChanges = () => {
	    watch([() => config.value.department, () => config.value.university], ([newDepartment, newUniversity]) => {
		setCookie('exam_department', newDepartment);
		setCookie('exam_university', newUniversity);
	    });
	};

	// Call this function when the app is created
	loadConfigFromCookies();
	watchConfigChanges();
	
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
// This project is licensed under the AGPL-3.0 License

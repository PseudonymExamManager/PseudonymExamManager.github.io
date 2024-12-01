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
            sectionSize: 20
        });
        const loading = ref(false);
        const progress = ref(0);
        let typingTimer;

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

        const parseCSV = async (csv) => {
            console.log("Parsing CSV...");
            const lines = csv.split('\n');
            const examInfo = lines[0].split(',');
            config.value.examName = examInfo[1];
            config.value.examDate = examInfo[4].split(' ')[1];
            console.log("Exam Info:", config.value.examName, config.value.examDate);

            const headers = lines[1].split(',');
            const result = [];
            for (let i = 2; i < lines.length; i++) {
                const currentline = lines[i].split(',');
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
            console.log("Students:", students.value);
        };

        const sortAndSectionStudents = async () => {
            console.log("Sorting and sectioning students...");
            students.value.sort((a, b) => {
                if (a.Name !== b.Name) return a.Name.localeCompare(b.Name);
                if (a.Vorname !== b.Vorname) return a.Vorname.localeCompare(b.Vorname);
                return a.Mittelname.localeCompare(b.Mittelname);
            });

            sections.value = [];
            for (let i = 0; i < students.value.length; i += config.value.sectionSize) {
                sections.value.push(students.value.slice(i, i + config.value.sectionSize));
                progress.value = Math.round(((i + config.value.sectionSize) / students.value.length) * 100);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            console.log("Sections:", sections.value);
        };

        const generatePDF = async () => {
            console.log("Generating PDF...");
            const { PDFDocument, rgb } = PDFLib;
            const pdfDoc = await PDFDocument.create();
            for (let sectionIndex = 0; sectionIndex < sections.value.length; sectionIndex++) {
                const section = sections.value[sectionIndex];
                const page = pdfDoc.addPage([600, 400]);
                const { width, height } = page.getSize();
                const fontSize = 12;
                page.drawText(`Section ${sectionIndex + 1}`, {
                    x: 50,
                    y: height - fontSize,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                });
                for (let studentIndex = 0; studentIndex < section.length; studentIndex++) {
                    const student = section[studentIndex];
                    const yPosition = height - (studentIndex + 2) * 2 * fontSize;
                    page.drawText(`Name: ${student.Name}`, {
                        x: 50,
                        y: yPosition,
                        size: fontSize,
                        color: rgb(0, 0, 0),
                    });
                    page.drawText(`Matrikelnummer: ${student.Matrikelnummer}`, {
                        x: 200,
                        y: yPosition,
                        size: fontSize,
                        color: rgb(0, 0, 0),
                    });
                    const canvas = document.createElement('canvas');
                    JsBarcode(canvas, student.Matrikelnummer, {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 18
                    });
                    const barcodeImage = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
                    page.drawImage(barcodeImage, {
                        x: 350,
                        y: yPosition - 20,
                        width: 100,
                        height: 50
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

        const immediateProcessing = async () => {
            clearTimeout(typingTimer);
            loading.value = true;
            progress.value = 0;
            await sortAndSectionStudents();
            generatePDF();
            loading.value = false;
        };

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

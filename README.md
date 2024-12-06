# PseudonymExamManager

PseudonymExamManager is a web application designed to manage and pseudonymize exam data. The app operates entirely locally within your browser, ensuring that no data entered into the app leaves your computer. The only information stored in the browser is the entered university name and department (which can also be the chair).

## CampusNet Usage 

CampusNet and related applications are used at 70 universities in Germany, Austria, and Switzerland, including the University of Bremen, the University of Hamburg with StiNE, the sister university HafenCity University Hamburg, the University of Mainz, the University of Paderborn, the University of Leipzig, and the University of Lübeck.

[Information from wikipedia](https://de.wikipedia.org/wiki/CampusNet#Verbreitung)

## Features

- **Local Data Processing**: All data processing, including sorting and generating PDFs, is performed locally in the browser. No data is sent to external servers.
- **Data Sorting and Sectioning**: The app sorts students by name and sections them based on the specified section size.
- **Cover Sheet Generation**: Generates cover sheets for each student with university name, exam date, exam name, department, section number, and a barcode (containing the matriculation number) twice on the sheet.
- **Grade Entry and Barcode Scanning**: After grading, the department secretariat scans the barcode on the cover sheet to find the correct student by matriculation number and enter the grade into CampusNet.

## Getting Started

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge)

### Installation

1. **Download the Project Files**:
   - Download the `index.html` and `app.js` files from the GitHub repository.

2. **Run the Application Locally**:
   - Place the downloaded files in a directory on your computer.
   - Open the `index.html` file in your web browser.

### Usage

### Usage

1. **Upload CSV File**:
   - Click on the file input to upload the CSV file containing student data exported from CampusNet.

2. **Configure Exam Details**:
   - Enter the exam name, exam date, department, and university name.
   - Specify the section size.

3. **Generate PDF**:
   - The app will process the data, sort students, and generate cover sheets.
   - The generated PDF will be displayed in the iframe.
   - **Note**: The PDF must be printed to be used for the exam.

### Configuring the BCST-33 Barcode Scanner

To configure the BCST-33 Barcode Scanner for use with this application, follow these steps:

1. **Set Up the Scanner**:
   - Connect the BCST-33 Barcode Scanner to your computer via USB.

2. **Configure the Scanner**:
   - Scan the following configuration barcodes to set up the scanner for Code 128 barcodes:
     - **Enter Setup Mode**: !Enter Setup Mode
     - **Enable Code 128**: !Enable Code 128
     - **Exit Setup Mode**: !Exit Setup Mode

3. **Test the Scanner**:
   - Open the `index.html` file in your browser and scan a printed barcode to ensure it is read correctly.

## Privacy Information

For detailed privacy information, please visit [Privacy Information](https://pseudonymexammanager.github.io/privacy).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE file](https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/LICENSE) for details.

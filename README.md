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
- **Section Marking with Horizontal Lines**: Draws horizontal lines on both the section pages and cover pages of a PDF to mark specific cover pages. These lines act like tabs, making it easier to quickly find the right page when distributing cover sheets. You can also hold the cover sheet against the section page to check if the lines match up, ensuring you have the correct cover page.

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

1. **Upload CSV File**:
   - Click on the file input to upload the CSV file containing student data exported from CampusNet.

2. **Configure Exam Details**:
   - Enter the exam name, exam date, department, and university name.
   - Specify the section size.

3. **Generate PDF**:
   - The app will process the data, sort students, and generate cover sheets.
   - The generated PDF will be displayed in the iframe.
   - **Note**: The PDF must be printed to be used for the exam.

## Configuring the BCST-33 Barcode Scanner (Example)

To configure the BCST-33 Barcode Scanner for use with this application, follow these steps. Note that the scanner can only read barcodes from paper, so it is essential to print the necessary pages beforehand. Alternatively, you can print this entire guide.

### 1. Set Up the Scanner:
1. Connect the BCST-33 Barcode Scanner to your computer via USB.

### 2. Configure the Scanner:
1. **Print the Configuration Barcodes:**
    - Ensure you have [printed the pages](https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/c999f591c7dddd6db735b0ef70c16fba19f1be64/docs/BCST-33_Complete_Manual-V1_DE.pdf) (8,12,22,63,55,75) containing the configuration barcodes. The scanner can only read barcodes from paper.

2. **Scan the Configuration Barcodes:**
    - **Enter Setup Mode:** Scan the barcode labeled "Enter Setup Mode" to begin the configuration process.

    
    <picture>
      <img alt="Enter Setup Mode Barcode" src="https://raw.githubusercontent.com/PseudonymExamManager/PseudonymExamManager.github.io/refs/heads/main/img/ENTER_SETUP_MODE_BARCODE.png" width="300">
    </picture>

    - **Mute:** Scan the barcode labeled "Mute" to disable the scanner's beep sound during scanning.
    
    <picture>
      <img alt="Mute Barcode" src="https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/img/MUTE_BARCODE.png" width="300">
    </picture>
    
    - **64ms Delay:** Scan the barcode labeled "64ms" to set a 64ms delay. This ensures compatibility with slower computers. Adjust to a higher speed if necessary.
    
    <picture>
      <img alt="64ms Delay Barcode" src="https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/img/64MS_DELAY_BARCODE.png" width="300">
    </picture>
    
    - **Ignore Caps Lock:** Scan the barcode labeled "Ignore Caps Lock" to prevent output errors caused by the Caps Lock key.
    
    <picture>
      <img alt="Ignore Caps Lock Barcode" src="https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/img/IGNORE_CAPS_LOCK_BARCODE.png" width="300">
    </picture>
    
    - **Prefix Setup:** Scan the barcode labeled "Prefix Setup" to configure a prefix for the scanner.
    
    <picture>
      <img alt="Prefix Setup Barcode" src="https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/img/PREFIX_SETUP_BARCODE.png" width="300">
    </picture>
    
    - **"ACK" Prefix:** Scan the barcode labeled "ACK" to set "Ctrl+F" as the prefix. This allows the scanner to automatically search and highlight the student number on the CampusNet page, similar to manually pressing "Ctrl+F" and entering the number, but much faster.
    
    <picture>
      <img alt="ACK Prefix Barcode" src="https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/img/ACK_PREFIX_BARCODE.png" width="300">
    </picture>
    
    - **Save and Exit:** Scan the barcode labeled "Save and Exit" to save the settings and exit setup mode.
    
    <picture>
      <img alt="Save and Exit Barcode" src="https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/img/SAVE_AND_EXIT_BARCODE.png" width="300">
    </picture>

### 3. Test the Scanner:
1. Open the `index.html` file in your browser.
2. Scan a printed barcode to ensure it is read correctly.

### Explanation of the Prefix Setup:
The goal of setting up the prefix is to enable the scanner to automatically search for the student number on the CampusNet page. When you scan a barcode, the scanner sends the "Ctrl+F" command followed by the student number. This mimics the action of manually pressing "Ctrl+F" and typing the number, but it is much faster because it automates the process.

By using this setup, you can quickly locate and highlight student numbers on the CampusNet page, improving efficiency and reducing the time spent on manual searches.

## Privacy Information

For detailed privacy information, please visit [Privacy Information](https://pseudonymexammanager.github.io/privacy).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE file](https://github.com/PseudonymExamManager/PseudonymExamManager.github.io/blob/main/LICENSE) for details.

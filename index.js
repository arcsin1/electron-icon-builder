#!/usr/bin/env node

// Import required dependencies
const { Jimp } = require("jimp");        // Updated import for Jimp 1.x
const args = require("args");           // Command line argument parser
const path = require("path");           // Path utilities
const fs = require("fs").promises;      // File system operations (async)
const icongen = require("icon-gen");    // Icon generation library

// Define the PNG sizes to generate for different platforms
const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

// Configure command line arguments
args
  .option("input", "Input PNG file. Recommended (1024x1024)", "./icon.png")
  .option("output", "Folder to output new icons folder", "./")
  .option("flatten", "Flatten output structure for electron-builder", false);

// Parse command line arguments
const flags = args.parse(process.argv);

/**
 * Validates input parameters and checks if input file exists
 * @param {string} inputPath - Path to the input image file
 * @param {string} outputPath - Path to the output directory
 * @throws {Error} If validation fails
 */
function validateInputs(inputPath, outputPath) {
  if (!inputPath || !outputPath) {
    throw new Error("Input and output paths are required");
  }
  
  // Check if input file exists
  try {
    require('fs').accessSync(inputPath, require('fs').constants.F_OK);
  } catch (error) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }
}

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dir - Directory path to check/create
 * @returns {Promise<void>}
 */
async function ensureDirExists(dir) {
  try {
    await fs.access(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      throw error;
    }
  }
}

/**
 * Creates a single PNG file with specified size
 * @param {number} size - The width/height of the square PNG
 * @param {string} inputPath - Path to the source image
 * @param {string} outputDir - Directory to save the resized PNG
 * @returns {Promise<string>} Success message
 */
async function createPNG(size, inputPath, outputDir) {
  const fileName = `${size}.png`;
  const outputPath = path.join(outputDir, fileName);
  
  try {
    // Load image, resize it to specified dimensions, and save (Updated for Jimp 1.x)
    const image = await Jimp.read(inputPath);
    await image.resize({ w: size, h: size }).write(outputPath);
    return `Created ${outputPath}`;
  } catch (error) {
    throw new Error(`Failed to create ${fileName}: ${error.message}`);
  }
}

/**
 * Creates all PNG files in parallel for better performance
 * @param {string} inputPath - Path to the source image
 * @param {string} outputDir - Directory to save all PNG files
 * @returns {Promise<string[]>} Array of success messages
 */
async function createAllPNGs(inputPath, outputDir) {
  console.log("Creating PNG files in parallel...");
  
  try {
    // Use Promise.all to create all PNGs simultaneously
    const results = await Promise.all(
      PNG_SIZES.map(size => createPNG(size, inputPath, outputDir))
    );
    
    // Log each successful creation
    results.forEach(result => console.log(result));
    return results;
  } catch (error) {
    throw new Error(`Failed to create PNG files: ${error.message}`);
  }
}

/**
 * Renames PNG files to Electron's expected format (e.g., 16.png -> 16x16.png)
 * @param {string} outputDir - Directory containing the PNG files
 * @returns {Promise<void>}
 */
async function renamePNGsToElectronFormat(outputDir) {
  console.log("Renaming PNGs to Electron Format...");
  
  try {
    // Create rename operations for all PNG files
    const renamePromises = PNG_SIZES.map(async (size) => {
      const startName = `${size}.png`;
      const endName = `${size}x${size}.png`;  // Electron format: widthxheight.png
      const startPath = path.join(outputDir, startName);
      const endPath = path.join(outputDir, endName);
      
      await fs.rename(startPath, endPath);
      console.log(`Renamed ${startName} to ${endName}`);
      return endName;
    });
    
    // Execute all rename operations in parallel
    await Promise.all(renamePromises);
    console.log("All PNG files renamed successfully");
  } catch (error) {
    throw new Error(`Failed to rename PNG files: ${error.message}`);
  }
}

/**
 * Generates platform-specific icon files (ICNS for macOS, ICO for Windows)
 * @param {string} pngDir - Directory containing source PNG files
 * @param {string} macDir - Output directory for macOS ICNS files
 * @param {string} winDir - Output directory for Windows ICO files
 * @returns {Promise<Object>} Results from icon generation
 */
async function generateIcons(pngDir, macDir, winDir) {
  console.log("Generating platform-specific icons...");
  
  try {
    // Ensure output directories exist
    await Promise.all([
      ensureDirExists(macDir),
      ensureDirExists(winDir)
    ]);
    
    // Generate macOS and Windows icons in parallel
    const [macResult, winResult] = await Promise.all([
      // Generate ICNS file for macOS
      icongen(pngDir, macDir, {
        icns: { 
          name: "icon",
          sizes: [16, 32, 64, 128, 256, 512, 1024]  // Standard macOS icon sizes
        },
        report: true,
      }),
      // Generate ICO file for Windows
      icongen(pngDir, winDir, {
        ico: { 
          name: "icon",
          sizes: [16, 24, 32, 48, 64, 128, 256]     // Standard Windows icon sizes
        },
        report: true,
      })
    ]);
    
    console.log("Icons generated successfully:");
    console.log("macOS:", macResult);
    console.log("Windows:", winResult);
    
    return { mac: macResult, win: winResult };
  } catch (error) {
    throw new Error(`Failed to generate icons: ${error.message}`);
  }
}

/**
 * Main function that orchestrates the entire icon generation process
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // Resolve input and output paths to absolute paths
    const inputPath = path.resolve(process.cwd(), flags.input);
    const outputPath = path.resolve(process.cwd(), flags.output);
    const flatten = flags.flatten;
    
    // Validate inputs before proceeding
    validateInputs(inputPath, outputPath);
    
    // Set up directory structure based on flatten option
    const iconsDir = path.join(outputPath, "icons");
    const pngOutputDir = flatten ? iconsDir : path.join(iconsDir, "png");
    const macOutputDir = flatten ? iconsDir : path.join(iconsDir, "mac");
    const winOutputDir = flatten ? iconsDir : path.join(iconsDir, "win");
    
    // Display configuration
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Flatten mode: ${flatten}`);
    console.log("---");
    
    // Create necessary directories
    await ensureDirExists(outputPath);
    await ensureDirExists(iconsDir);
    if (!flatten) {
      await ensureDirExists(pngOutputDir);
    }
    
    // Step 1: Create all PNG files from the source image
    await createAllPNGs(inputPath, pngOutputDir);
    
    // Step 2: Generate platform-specific icon files
    await generateIcons(pngOutputDir, macOutputDir, winOutputDir);
    
    // Step 3: Rename PNG files to Electron's expected format
    await renamePNGsToElectronFormat(pngOutputDir);
    
    // Success message
    console.log("\n✅ ALL DONE! Icons generated successfully.");
    console.log(`📁 Output directory: ${outputPath}`);
    
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Start the icon generation process
main();

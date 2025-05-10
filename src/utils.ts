/**
 * @file utilities/utils.ts
 *
 * @summary Helper functions used throughout the extension.
 * @author Stephen Kaplan <skaplanofficial@gmail.com>
 *
 * Created at     : 2023-07-06 14:48:00
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import path from "path";

import {
  Clipboard,
  environment,
  getFrontmostApplication,
  getPreferenceValues,
  LocalStorage,
  showInFinder,
  showToast,
  Toast,
} from "@raycast/api";
import { runAppleScript } from "@raycast/utils";

import { mkdir } from "fs/promises";

/**
 * Gets currently selected images in Finder.
 *
 * @returns A promise resolving to the comma-separated list of images as a string.
 */
const getSelectedFinderImages = async (): Promise<string> => {
  return runAppleScript(
    `set imageTypes to {"PNG", "JPG", "JPEG", "TIF", "HEIF", "GIF", "ICO", "ICNS", "ASTC", "BMP", "DDS", "EXR", "JP2", "KTX", "Portable Bitmap", "Adobe Photoshop", "PVR", "TGA", "WebP", "SVG", "PDF", "HEIC", "AV1 Image File Format"}
    
    try
      tell application "Finder"
        set theSelection to selection

        if theSelection is {} and (count Finder windows) > 0 then
          repeat with i from 1 to (count Finder windows)
            activate window i
            set theSelection to selection

            set selectionKinds to {}
            repeat with j from 1 to (count theSelection)
              set selectionKinds to selectionKinds & kind of (item j of theSelection)
            end repeat

            set containsImage to false
            repeat with imageType in imageTypes
              if selectionKinds contains imageType then
                set containsImage to true
                exit repeat
              end if
            end repeat
          end repeat
        end if

        if theSelection is {} then
          return
        else if (theSelection count) is equal to 1 then
          repeat with imageType in imageTypes
            if (kind of the first item of theSelection) contains imageType then
              return the POSIX path of (theSelection as alias)
              exit repeat
            end if
          end repeat
        else
          set thePaths to {}
          repeat with i from 1 to (theSelection count)
            repeat with imageType in imageTypes
              if (kind of (item i of theSelection)) contains imageType then
                copy (POSIX path of (item i of theSelection as alias)) to end of thePaths
                exit repeat
              end if
            end repeat
          end repeat
          return thePaths
        end if
      end tell
    on error message number -1743
      set btn to button returned of (display alert "Permission Needed" message "To use Image Modification on selected images in Finder, you must allow Raycast to control Finder in System Settings > Privacy & Security > Automation." buttons {"Dismiss", "Open Privacy Settings"})
      if btn is "Open Privacy Settings" then
        open location "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"
      end if
    end try`,
  );
};

/**
 * Gets currently selected images in Path Finder.
 *
 * @returns A promise resolving to the comma-separated list of images as a string.
 */
const getSelectedPathFinderImages = async (): Promise<string> => {
  return runAppleScript(
    `set imageTypes to {"PNG", "JPG", "JPEG", "TIF", "HEIF", "GIF", "ICO", "ICNS", "ASTC", "BMP", "DDS", "EXR", "JP2", "KTX", "Portable Bitmap", "Adobe Photoshop", "PVR", "TGA", "WebP", "SVG", "PDF", "HEIC", "AV1 Image File Format"}

    try
      tell application "Path Finder"
        set theSelection to selection

        if theSelection is {} and (count windows) > 0 then
          repeat with i from 1 to (count windows)
            activate window i
            set theSelection to selection

            set selectionKinds to {}
            repeat with j from 1 to (count theSelection)
              set selectionKinds to selectionKinds & kind of (item j of theSelection)
            end repeat

            set containsImage to false
            repeat with imageType in imageTypes
              if selectionKinds contains imageType then
                set containsImage to true
                exit repeat
              end if
            end repeat
          end repeat
        end if

        if theSelection is {} then
          return
        else if (theSelection count) is equal to 1 then
          repeat with imageType in imageTypes
            if (kind of the first item of theSelection) contains imageType then
              return the POSIX path of first item of theSelection
              exit repeat
            end if
          end repeat
        else
          set thePaths to {}
          repeat with i from 1 to (theSelection count)
            repeat with imageType in imageTypes
              if (kind of (item i of theSelection)) contains imageType then
                copy (POSIX path of (item i of theSelection)) to end of thePaths
                exit repeat
              end if
            end repeat
          end repeat
          return thePaths
        end if
      end tell
    on error message number -1743
      set btn to button returned of (display alert "Permission Needed" message "To use Image Modification on selected images in Path Finder, you must allow Raycast to control Path Finder in System Settings > Privacy & Security > Automation." buttons {"Dismiss", "Open Privacy Settings"})
      if btn is "Open Privacy Settings" then
        open location "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"
      end if
    end try`,
  );
};

/**
 * Gets currently selected TTML files in Finder.
 *
 * @returns A promise resolving to the comma-separated list of TTML files as a string.
 */
const getSelectedTTMLFiles = async (): Promise<string> => {
  const result = await runAppleScript(
    `set subtitleTypes to {"TTML", "XML", "SubRip Subtitle", "SubRip Text", "SubRip", "TXT"}
    
    try
      tell application "Finder"
        set theSelection to selection

        if theSelection is {} and (count Finder windows) > 0 then
          repeat with i from 1 to (count Finder windows)
            activate window i
            set theSelection to selection

            set selectionKinds to {}
            repeat with j from 1 to (count theSelection)
              set selectionKinds to selectionKinds & kind of (item j of theSelection)
            end repeat

            set containsSubtitle to false
            repeat with subtitleType in subtitleTypes
              if selectionKinds contains subtitleType then
                set containsSubtitle to true
                exit repeat
              end if
            end repeat
          end repeat
        end if

        if theSelection is {} then
          return ""
        else if (theSelection count) is equal to 1 then
          repeat with subtitleType in subtitleTypes
            if (kind of the first item of theSelection) contains subtitleType then
              return the POSIX path of (theSelection as alias)
              exit repeat
            end if
          end repeat
        else
          set thePaths to {}
          repeat with i from 1 to (theSelection count)
            repeat with subtitleType in subtitleTypes
              if (kind of (item i of theSelection)) contains subtitleType then
                copy (POSIX path of (item i of theSelection as alias)) to end of thePaths
                exit repeat
              end if
            end repeat
          end repeat
          return thePaths
        end if
      end tell
    on error message number -1743
      set btn to button returned of (display alert "Permission Needed" message "To use Subtitle Conversion on selected files in Finder, you must allow Raycast to control Finder in System Settings > Privacy & Security > Automation." buttons {"Dismiss", "Open Privacy Settings"})
      if btn is "Open Privacy Settings" then
        open location "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"
      end if
      return ""
    end try`,
  );

  console.log("AppleScript result:", result);
  return result || "";
};

/**
 * Adds an item to the list of temporary files to remove.
 * @param item The path of the item to remove.
 */
export const addItemToRemove = async (item: string) => {
  const itemsToRemove = (await LocalStorage.getItem("itemsToRemove")) ?? "";
  await LocalStorage.setItem("itemsToRemove", itemsToRemove + ", " + item);
};

/**
 * Gets a path to a temporary file with the given name and extension.
 *
 * The file will be added to the list of temporary files to remove upon cleanup.
 *
 * @param name The name of the file
 * @param extension The extension of the file
 * @returns A promise resolving to the path of the temporary file.
 */
export const getScopedTempFile = async (name: string, extension: string) => {
  const tempPath = path.join(os.tmpdir(), `${name}.${extension}`);
  return {
    path: tempPath,
    [Symbol.asyncDispose]: async () => {
      if (fs.existsSync(tempPath)) {
        await fs.promises.rm(tempPath, { recursive: true });
      }
    },
  };
};

export const getScopedTempDirectory = async (name: string) => {
  const tempPath = path.join(os.tmpdir(), name);
  await mkdir(tempPath, { recursive: true });
  return {
    path: tempPath,
    [Symbol.asyncDispose]: async () => {
      if (fs.existsSync(tempPath)) {
        await fs.promises.rm(tempPath, { recursive: true });
      }
    },
  };
};

/**
 * Cleans up temporary files created by the extension.
 *
 * @returns A promise resolving when the cleanup is complete.
 */
export const cleanup = async () => {
  const itemsToRemove = (await LocalStorage.getItem("itemsToRemove")) ?? "";
  const itemsToRemoveArray = itemsToRemove.toString().split(", ");
  for (const item of itemsToRemoveArray) {
    if (fs.existsSync(item)) {
      await fs.promises.rm(item, { recursive: true });
    }
  }
  await LocalStorage.removeItem("itemsToRemove");
};

/**
 * Gets selected TTML files in the preferred file manager application.
 *
 * @returns A promise resolving to the list of selected TTML file paths.
 */
export const getSelectedFiles = async (): Promise<string[]> => {
  const selectedFiles: string[] = [];

  // Get selected TTML files from Finder
  const finderFiles = await getSelectedTTMLFiles();
  console.log("Finder files:", finderFiles);
  
  if (finderFiles) {
    const files = finderFiles.split(", ");
    selectedFiles.push(...files.filter(Boolean));
  }

  console.log("Selected files:", selectedFiles);
  return selectedFiles;
};

/**
 * Puts the produced images in the user's preferred location, deleting the files at the given paths.
 *
 * @param imagePaths The paths of the produced images.
 * @returns A promise resolving when the operation is complete.
 */
export const moveImageResultsToFinalDestination = async (imagePaths: string[]) => {
  let activeApp = "Finder";
  try {
    activeApp = (await getFrontmostApplication()).name;
  } catch (error) {
    console.error(`Couldn't get frontmost application: : ${error}`);
  }

//   const preferences = getPreferenceValues<Preferences>();
//   // Handle the result per the user's preference
//   if (preferences.imageResultHandling == ImageResultHandling.CopyToClipboard) {
//     await copyImagesAtPathsToClipboard(imagePaths);
//     deleteFiles(imagePaths);
// //   } else if (preferences.imageResultHandling == ImageResultHandling.OpenInPreview) {
// //     await openPathsInPreview(imagePaths);
// //     deleteFiles(imagePaths);
//   } else if (preferences.inputMethod == ImageInputSource.NeoFinderSelection || activeApp == "NeoFinder") {
//     await showInFinder(imagePaths[0]);
//   } else if (preferences.inputMethod == ImageInputSource.HoudahSpotSelection || activeApp == "HoudahSpot") {
//     await showInFinder(imagePaths[0]);
//   }
};

/**
 * Returns the destination paths for the given original paths, based on the user's preferences.
 *
 * @param originalPaths The original paths of image files.
 * @param generated Whether the images were generated by the extension.
 * @param newExtension The new extension of the images, if any.
 * @returns The destination paths for the given original paths.
 */
export const getDestinationPaths = async (
    originalPaths: string[],
    generated = false,
    newExtension: string | undefined = undefined,
  ): Promise<string[]> => {
    const preferences = getPreferenceValues<Preferences>();
    const currentDirectory = await getCurrentDirectory(originalPaths[0]);
    return originalPaths.map((imgPath) => {
      let newPath = imgPath;

      newPath = path.join(currentDirectory, path.basename(newPath));

      newPath = newExtension ? newPath.replace(path.extname(newPath), `.${newExtension}`) : newPath;
  
      return newPath;
    });
  };
  

/**
 * Gets the destination path for an image, given the original path and the desired extension, taking the user's preferences into account.
 * @param originalPath The original path of the image.
 * @param targetExtension The desired extension of the image. If not provided, the original extension will be used.
 * @returns The destination path for the image.
 */
export const getImageDestination = (originalPath: string, targetExtension?: string): string => {
  const preferences = getPreferenceValues<Preferences>();

  // Decompose the original path into its components
  const originalExtension = path.extname(originalPath);
  const originalName = path.basename(originalPath, originalExtension);
  const originalDir = path.dirname(originalPath);

  // Construct & return the new path
  const newExtension = targetExtension ? `${targetExtension}` : originalExtension;
  const newFileName = `${originalName}.${newExtension}`;

  return path.join(originalDir, newFileName);
};

/**
 * Deletes the files at the given paths.
 *
 * @param filePaths The paths of the files to delete.
 */
export const deleteFiles = (filePaths: string | string[]) => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  for (const path of paths) {
    fs.unlinkSync(path);
  }
};

/**
 * Returns the name of the frontmost application based on whether it owns the menubar.
 *
 * @returns The name of the frontmost application, or "Finder" if no application owns the menubar, which shouldn't generally happen.
 */
export const getMenubarOwningApplication = async () => {
  return runAppleScript(`use framework "Foundation"
    use scripting additions
    set workspace to current application's NSWorkspace's sharedWorkspace()
    set runningApps to workspace's runningApplications()
    
    set targetApp to missing value
    repeat with theApp in runningApps
      if theApp's ownsMenuBar() then
        set targetApp to theApp
        exit repeat
      end if
    end repeat
    
    if targetApp is missing value then
      return "Finder"
    else
      return targetApp's localizedName() as text
    end if`);
};

/**
 * Returns the current directory of the file manager. Tries Path Finder first, if it's the frontmost application, then falls back to Finder.
 *
 * @returns The current directory of the file manager.
 */
export const getCurrentDirectory = async (itemPath: string) => {
  // Get name of frontmost application
  let activeApp = "Finder";
  try {
    activeApp = await getMenubarOwningApplication();
  } catch (error) {
    console.error(`Couldn't get frontmost application: ${error}`);
  }

  // Attempt to get current directory of Path Finder
  try {
    if (activeApp == "Path Finder") {
      return runAppleScript(`tell application "Path Finder"
        if 1 ≤ (count finder windows) then
          try
          get POSIX path of (target of finder window 1)
          on error message number -1728
            -- Folder is nonstandard, use container of selection
            tell application "System Events"
              set itemPath to POSIX file "${itemPath}" as alias
              return POSIX path of container of itemPath
            end tell
          end try
        else
          get POSIX path of desktop
        end if
      end tell`);
    }
  } catch (error) {
    // Error getting directory of Path Finder, fall back to Finder
    console.error(`Couldn't get current directory of Path Finder: ${error}`);
  }

  // Fallback to getting current directory from Finder
  return runAppleScript(`tell application "Finder"
    if 1 ≤ (count Finder windows) then
      try
        return POSIX path of (target of window 1 as alias)
      on error message number -1700
        -- Folder is nonstandard, use container of selection
        set itemPath to POSIX file "${itemPath}" as alias
        return POSIX path of (container of itemPath as alias)
      end try
    else
      return POSIX path of (desktop as alias)
    end if
  end tell`);
};

/**
 * Shows or updates a toast to display the given error, and logs the error to the console.
 * @param title The title of the toast.
 * @param error The error to show.
 * @param toast The toast to update.
 */
export const showErrorToast = async (title: string, error: Error, toast?: Toast, messageText?: string) => {
  console.error(error);
  if (!toast) {
    toast = await showToast({
      title: title,
      message: messageText ?? error.message,
      style: Toast.Style.Failure,
      primaryAction: {
        title: "Copy Error",
        onAction: async () => {
          await Clipboard.copy(error.message);
        },
      },
    });
  } else {
    toast.title = title;
    toast.message = messageText ?? error.message;
    toast.style = Toast.Style.Failure;
    toast.primaryAction = {
      title: "Copy Error",
      onAction: async () => {
        await Clipboard.copy(error.message);
      },
    };
  }
};

export const expandTilde = (filePath: string) => {
  const homedir = os.homedir();
  if (filePath.startsWith("~")) {
    return filePath.replace(/^~(?=$|\/|\\)/, homedir);
  }

  const regex = /(\/Users\/.*?)\/.*/;
  const match = filePath.match(regex);
  if (match) {
    return filePath.replace(match[1], homedir);
  }
  return filePath;
};
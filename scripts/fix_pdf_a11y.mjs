import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('package/pdfjs/web/viewer.html');
let html = fs.readFileSync(filePath, 'utf8');

// Landmarks
html = html.replace('<div class="toolbar">', '<div class="toolbar" role="region" aria-label="PDF Viewer Controls">');
html = html.replace('<div id="viewerContainer" tabindex="0">', '<div id="viewerContainer" tabindex="0" role="main" aria-label="PDF Document Pages">');
html = html.replace('<div id="dialogContainer">', '<div id="dialogContainer" role="region" aria-label="PDF Dialogs">');

// Label helper map
const labelMap = {
  'viewsManagerToggleButton': 'Toggle Sidebar Navigation',
  'viewsManagerSelectorButton': 'View Selector',
  'viewsManagerAddFileButton': 'Add File',
  'viewsManagerCurrentOutlineButton': 'Current Outline Item',
  'viewsManagerStatusActionButton': 'Views Manager Action',
  'thumbnailsViewMenu': 'Page Thumbnails',
  'outlinesViewMenu': 'Document Outline',
  'attachmentsViewMenu': 'Attachments',
  'layersViewMenu': 'Layers',
  'viewFindButton': 'Find in Document',
  'findPreviousButton': 'Find Previous Match',
  'findNextButton': 'Find Next Match',
  'previous': 'Previous Page',
  'next': 'Next Page',
  'zoomOutButton': 'Zoom Out',
  'zoomInButton': 'Zoom In',
  'printButton': 'Print Document',
  'downloadButton': 'Download Document',
  'secondaryToolbarToggleButton': 'Tools and Settings Menu',
  'secondaryOpenFile': 'Open File',
  'secondaryPrint': 'Print',
  'secondaryDownload': 'Download',
  'secondaryCurrentPage': 'Current Page Link',
  'firstPage': 'Go to First Page',
  'lastPage': 'Go to Last Page',
  'pageRotateCw': 'Rotate Clockwise',
  'pageRotateCcw': 'Rotate Counterclockwise',
  'cursorSelectTool': 'Text Selection Tool',
  'cursorHandTool': 'Hand Tool (Panning)',
  'scrollPage': 'Single Page Scrolling',
  'scrollVertical': 'Vertical Scrolling',
  'scrollHorizontal': 'Horizontal Scrolling',
  'scrollWrapped': 'Wrapped Scrolling',
  'spreadNone': 'No Page Spreads',
  'spreadOdd': 'Odd Page Spreads',
  'spreadEven': 'Even Page Spreads',
  'imageAltTextSettings': 'Image Alt Text Settings',
  'documentProperties': 'Document Properties',
  'editorStampAddImage': 'Add Image Stamp',
  'presentationMode': 'Presentation Mode',
  'editorHighlightButton': 'Highlight Text',
  'editorHighlightShowAll': 'Show All Highlights',
  'editorFreeTextButton': 'Add Free Text',
  'editorInkButton': 'Draw with Ink',
  'editorStampButton': 'Add Stamp',
  'editorSignatureButton': 'Add Signature',
  'editorModeButtons': 'Annotation Tools',
  'sidebarToggleButton': 'Toggle Sidebar',
  'viewThumbnail': 'Show Thumbnails',
  'viewOutline': 'Show Document Outline',
  'viewAttachments': 'Show Attachments',
  'viewLayers': 'Show Layers'
};

for (const [id, label] of Object.entries(labelMap)) {
  const regex = new RegExp(`id="${id}"([^>]*)>`, 'g');
  html = html.replace(regex, (match, rest) => {
    if (!rest.includes('aria-label=')) {
      return `id="${id}" aria-label="${label}"${rest}>`;
    }
    return match;
  });
}

// Find input & options
html = html.replace(/id="findInput" class="toolbarField"/g, 'id="findInput" class="toolbarField" aria-label="Find in document"');
html = html.replace(/id="findHighlightAll" tabindex="0"/g, 'id="findHighlightAll" tabindex="0" aria-label="Highlight all matches"');
html = html.replace(/id="findMatchCase" tabindex="0"/g, 'id="findMatchCase" tabindex="0" aria-label="Match case"');
html = html.replace(/id="findMatchDiacritics" tabindex="0"/g, 'id="findMatchDiacritics" tabindex="0" aria-label="Match diacritics"');
html = html.replace(/id="findEntireWord" tabindex="0"/g, 'id="findEntireWord" tabindex="0" aria-label="Match entire word"');

// Editor inputs
html = html.replace(/id="editorFreeHighlightThickness"/g, 'id="editorFreeHighlightThickness" aria-label="Free highlight thickness"');
html = html.replace(/id="editorFreeTextColor" class="editorParamsColor"/g, 'id="editorFreeTextColor" class="editorParamsColor" aria-label="Text Color"');
html = html.replace(/id="editorFreeTextFontSize" class="editorParamsSlider"/g, 'id="editorFreeTextFontSize" class="editorParamsSlider" aria-label="Font Size"');
html = html.replace(/id="editorInkColor" class="editorParamsColor"/g, 'id="editorInkColor" class="editorParamsColor" aria-label="Ink Color"');
html = html.replace(/id="editorInkThickness" class="editorParamsSlider"/g, 'id="editorInkThickness" class="editorParamsSlider" aria-label="Ink Thickness"');
html = html.replace(/id="editorInkOpacity" class="editorParamsSlider"/g, 'id="editorInkOpacity" class="editorParamsSlider" aria-label="Ink Opacity"');

// Bookmark link
html = html.replace(/id="viewBookmark" class="toolbarButton labeled" tabindex="0"/g, 'id="viewBookmark" class="toolbarButton labeled" tabindex="0" aria-label="Current Bookmark"');

// Password & signatures
html = html.replace(/id="password" class="toolbarField"/g, 'id="password" class="toolbarField" aria-label="Document Password"');
html = html.replace(/id="descriptionButton"/g, 'id="descriptionButton" aria-label="Description alternative text"');
html = html.replace(/id="decorativeButton"/g, 'id="decorativeButton" aria-label="Mark as decorative image"');
html = html.replace(/id="addSignatureTypeInput" type="text"/g, 'id="addSignatureTypeInput" type="text" aria-label="Type signature"');
html = html.replace(/id="addSignatureDrawThickness"/g, 'id="addSignatureDrawThickness" aria-label="Signature draw thickness"');
html = html.replace(/id="addSignatureFilePicker" type="file"/g, 'id="addSignatureFilePicker" type="file" aria-label="Upload signature file"');
html = html.replace(/id="addSignatureDescInput" type="text"/g, 'id="addSignatureDescInput" type="text" aria-label="Signature description"');
html = html.replace(/id="addSignatureSaveCheckbox"/g, 'id="addSignatureSaveCheckbox" aria-label="Save signature"');
html = html.replace(/id="editSignatureDescInput" type="text"/g, 'id="editSignatureDescInput" type="text" aria-label="Edit signature description"');

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully updated viewer.html with comprehensive accessibility enhancements!');

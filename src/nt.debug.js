"use strict";


function PrintFocus() {

    var selection = document.getSelection();

    if (selection.focusNode.nodeType === Node.TEXT_NODE) {
        console.log("selection: focusNode=" + selection.focusNode);
        console.log("selection: focusText=" + selection.focusNode.data);
        console.log("selection: focusOffset=" + selection.focusOffset + " / " + selection.focusNode.length);
    } else {
        console.log("selection: focusNode=" + selection.focusNode + " " + selection.focusNode.className);
        console.log("selection: focusOffset=" + selection.focusOffset + " / " + selection.focusNode.childNodes.length);
    }
    if (!selection.isCollapsed) {
        if (selection.anchorNode.nodeType === Node.TEXT_NODE) {
            console.log("selection: anchorNode=" + selection.anchorNode);
            console.log("selection: anchorText=" + selection.anchorNode.data);
            console.log("selection: anchorOffset=" + selection.anchorOffset + " / " + selection.anchorNode.length);
        } else {
            console.log("selection: anchorNode=" + selection.anchorNode + " " + selection.anchorNode.className);
            console.log("selection: anchorOffset=" + selection.anchorOffset + " / " + selection.anchorNode.childNodes.length);
        }
    }

}


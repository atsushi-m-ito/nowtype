"use strict";


function NextOrderNode(node, upper_limit_node){
    if (node.firstChild) {
        return node.firstChild;
    } else if (node.nextSibling) {
        return node.nextSibling;
    } else {
        //rise up //
        while (node.nextSibling === null) {
            node = node.parentNode;
            if (node === upper_limit_node) {
                return null; //no TEXT_NODE found//
            }
        }
        return node.nextSibling;
    }
}


function FindWord(word, start_node, start_offset, upper_limit_node){
    if(start_node.nodeType == Node.TEXT_NODE){
        if(start_offset < start_node.length){
            const p = start_node.data.indexOf(word,start_offset);
            if(p>=0){
                return {node:start_node, offset:p};
            }
        }
    }

    let node = NextOrderNode(start_node, upper_limit_node);
    while(node){
        if(node.nodeType == Node.TEXT_NODE){
            const p = node.data.indexOf(word);
            if(p>=0){
                return {node:node, offset:p};
            }
            node = NextOrderNode(node, upper_limit_node);
        }else if(node.className=="math"){
            node = node.lastChild;
        }else{
            node = NextOrderNode(node, upper_limit_node);
        }
    }
    return null;
}

let nt_finding_word = "";
function NT_FindAndSelect(word){
    if(word.length ==0) {
        nt_finding_word = "";
        return false;
    }

    nt_finding_word = word;

    const selection = document.getSelection();
    
    const focus = nt_render_div.contains(selection.focusNode) ? 
        FindWord(word, selection.focusNode, selection.focusOffset, nt_render_div) : 
        FindWord(word, nt_render_div.firstChild, 0, nt_render_div);

    if(focus){
        if(g_editable_math){
            DisableEdit(g_editable_math);
        }
        if(IsTextNodeInMath(focus.node)){
            EnableMathEdit(focus.node.parentNode.parentNode);
        }
        selection.setBaseAndExtent(focus.node, focus.offset, focus.node, focus.offset + word.length);
        return true;
    }
    return false;
}


function PreviousOrderNode(node, upper_limit_node){
    if (node.lastChild) {
        return node.lastChild;
    } else if (node.previousSibling) {
        return node.previousSibling;
    } else {
        //rise up //
        while (node.previousSibling === null) {
            node = node.parentNode;
            if (node === upper_limit_node) {
                return null; //no TEXT_NODE found//
            }
        }
        return node.previousSibling;
    }
}


function FindBackward(word, start_node, start_offset, upper_limit_node){
    if(start_node.nodeType == Node.TEXT_NODE){
        if(start_offset > 0){
            const p = start_node.data.lastIndexOf(word, start_offset - 1 );
            if(p>=0){
                return {node:start_node, offset:p};
            }
        }
    }

    let node = PreviousOrderNode(start_node, upper_limit_node);
    while(node){
        
        if(node.nodeType == Node.TEXT_NODE){
            const p = node.data.lastIndexOf(word);
            if(p>=0){
                return {node:node, offset:p};
            }
        }

        if((node.parentNode.className=="math") && 
            (node === node.parentNode.firstChild)){
            node = node.parentNode;
            //rise up //
            while (node.previousSibling === null) {
                node = node.parentNode;
                if (node === upper_limit_node) {
                    return null; //no TEXT_NODE found//
                }
            }
            node = node.previousSibling;
            
        }else{        
            node = PreviousOrderNode(node, upper_limit_node);
        }
    }
    return null;
}


function NT_FindBackwardAndSelect(word){
    if(word.length ==0) {
        nt_finding_word = "";
        return false;
    }

    nt_finding_word = word;
    
    const selection = document.getSelection();
    
    const focus = nt_render_div.contains(selection.anchorNode) ? 
        FindBackward(word, selection.anchorNode, selection.anchorOffset, nt_render_div) : 
        FindBackward(word, nt_render_div.lastChild, 0, nt_render_div);

    if(focus){        
        if(g_editable_math){
            DisableEdit(g_editable_math);
        }
        if(IsTextNodeInMath(focus.node)){
            EnableMathEdit(focus.node.parentNode.parentNode);
        }
        selection.setBaseAndExtent(focus.node, focus.offset, focus.node, focus.offset + word.length);        
        return true;
    }
    return false;
}

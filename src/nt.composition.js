"use strict";

let br_before_composition = null;
let node_before_composition = null;
let offset_before_composition = 0;
let length_before_composition = 0;
let is_collapsed_composition = false;

function OnCompositionstart(event){
    console.log("compositionstart: ", event.data); 
    //br is automatically removed by IME input.
    //then original br is kept before input IME//
    const selection = document.getSelection();
    
    const range = selection.getRangeAt(0);
    let focus_node = range.startContainer;
    let focus_offset = range.startOffset;
    let anchor_node = range.endContainer;
    let anchor_offset = range.endOffset;
    /*
    let focus_node = document.getSelection().focusNode;
    let focus_offset = document.getSelection().focusOffset;
    let anchor_node = document.getSelection().anchorNode;    
    let anchor_offset = document.getSelection().anchorOffset;
    */
    let ranged_sel_length = 0;
  
    is_collapsed_composition = selection.isCollapsed;
    if(!selection.isCollapsed) {
        console.log("selected range:")
        if((focus_node===anchor_node)&&(focus_node.nodeType===Node.TEXT_NODE)){
        /*
            const node = focus_node;
            
            if(focus_offset < anchor_offset){
                const text = node.data.slice(focus_offset, anchor_offset);
                node.deleteData(focus_offset, anchor_offset - focus_offset);
                node.insertData(focus_offset, text);
                
                undo_man.Begin(focus_node, anchor_offset, focus_node, focus_offset);
                undo_man.Register(UR_TYPE.DELETE_IN_TEXT, text, node, focus_offset, 1);
                undo_man.End(focus_node, focus_offset);

                ranged_sel_length = anchor_offset - focus_offset;
            }else{
                const text = node.data.slice(anchor_offset, focus_offset);
                node.deleteData(anchor_offset,  focus_offset - anchor_offset);
                node.insertData(anchor_offset, text);
                
                undo_man.Begin(focus_node, anchor_offset, focus_node, focus_offset);
                undo_man.Register(UR_TYPE.DELETE_IN_TEXT, text, node, anchor_offset, 1);
                undo_man.End(focus_node, anchor_offset);

                ranged_sel_length = focus_offset - anchor_offset;
            }
            selection.setBaseAndExtent(focus_node, anchor_offset, focus_node, focus_offset);
        }else{
            */
            /*{
                {
                    if(focus_offset < anchor_offset){
                        selection.collapse(focus_node,  focus_offset);
                    }else{
                        selection.collapse(focus_node, anchor_offset);
                    }
                }    

            }*/

            CorrectSelectionEdgeTable();
            CutSelection(event.currentTarget, selection);
        }
    }


    
    console.log("focus: ", focus_node,  focus_offset); 
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }
    
    node_before_composition = focus_node;
    offset_before_composition = focus_offset;
    length_before_composition = 0;
    

    if(focus_node.nodeName==="BR"){
        br_before_composition = focus_node;
        node_before_composition = focus_node.parentNode;
        offset_before_composition = GetIndex(focus_node.parentNode, focus_node);
        if(focus_node.previousSibling){
            if(focus_node.previousSibling.nodeType===Node.TEXT_NODE){
                length_before_composition = focus_node.previousSibling.length;
            }
        }
        console.log("keep original BR node");
    }else if(focus_node.hasChildNodes()){
        const ch = focus_node.childNodes.item(focus_offset);
        if(ch.nodeType === Node.TEXT_NODE){
            length_before_composition = ch.length;
        }else {
            if(ch.nodeName==="BR"){
                br_before_composition = ch;
                console.log("keep original BR node");
            }

            const prev = ch.previousSibling;
            if(prev){
                if(prev.nodeType === Node.TEXT_NODE){
                    length_before_composition = prev.length;
                }
            }
            
        }
    }else if(focus_node.nodeType === Node.TEXT_NODE){
        length_before_composition = focus_node.length - ranged_sel_length;

        console.log("IME is input on test:", focus_node.data);

    }
    
}


function OnCompositionupdate(event){
    //br is automatically removed by IME input.
    //then original br is kept before input IME//
    console.log("composition update: ", event.data);
    const focus_node = document.getSelection().focusNode;
    const focus_offset = document.getSelection().focusOffset;
    console.log("focus: ", focus_node, focus_offset);
    if(focus_node.nodeType===Node.TEXT_NODE){
        console.log("text: ", focus_node.data);
    }
    
    const anchor_node = document.getSelection().anchorNode;
    const anchor_offset = document.getSelection().anchorOffset;
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }

    if(!is_collapsed_composition){
        const selection = document.getSelection();
        console.log("text on test:", selection.focusNode.data);
        is_collapsed_composition = false;
    }
 
    
}



function OnCompositionend(event){
    const text = event.data;
    console.log("compositionend: ", text);
    const selection = document.getSelection();
    const focus_node = document.getSelection().focusNode;
    const focus_offset = document.getSelection().focusOffset;
    console.log("focus: ", focus_node, focus_offset);
    if(focus_node.nodeType===Node.TEXT_NODE){
        console.log("text: ", focus_node.data);
    }
    const anchor_node = document.getSelection().anchorNode;
    const anchor_offset = document.getSelection().anchorOffset;
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }
    

    if(text.length === 0) {
        if(br_before_composition){
            //rebone original BR node//
            let current_br = node_before_composition.childNodes.item(offset_before_composition);

            if(current_br.nodeName==="BR"){
                if(current_br !==br_before_composition){
                    const parent = node_before_composition;//current_br.parentNode;
                    parent.insertBefore(br_before_composition, current_br);
                    parent.removeChild(current_br);
                    selection.collapse(parent, offset_before_composition);                
                }
            }
        }
        br_before_composition=null;
        node_before_composition=null;
        return;
    }

    
    if(! selection.isCollapsed){
        console.log("selection: anchor(" + selection.anchorNode + ", " + selection.anchorOffset + ") - (" + selection.focusNode + ", " + selection.focusOffset + ")");
        console.log("ERROR: unexpected state, selection is isCollapsed when compositionend fires.");
        br_before_composition=null;
        node_before_composition=null;
        return ;
    }
    
/*
    const node = selection.focusNode;
    if(node.nodeType !== Node.TEXT_NODE){
        console.log("ERROR: unexpected state, focus node is not TEXT_NODE when compositionend fires.");
        br_before_composition=null;
        node_before_composition=null;
        return ;
    }
*/
/*
    const offset_end = selection.focusOffset;
    if(offset_end < text.length ){
        console.log("ERROR: unexpected state, focus offset is smaller than the length of input text when compositionend fires.");
        br_before_composition=null;
        return ;
    }
    */
    const offset = offset_before_composition;
    const node = node_before_composition;

    //only register undo/redo the inserting text, but actually inserting to DOM is already done by IME.//
    if(node.nodeType===Node.TEXT_NODE){
        if(node.data.slice(offset, offset + text.length ) !== text){

            alert("ERROR: IME input is not correctly detected (case 1).");
            br_before_composition = null;
            node_before_composition = null;
            return;
        }

        if(IsTextNodeInMath(node)){
            if((offset===0) || (offset + text.length === node.length )){
                node.deleteData(offset, text.length);
                SwitchInputChar(text, node, offset);
            }else{
                const margin = GetEditMargin(node.parentNode.parentNode);
                if((offset<margin)||(node.length - margin < offset + text.length)){
                    node.deleteData(offset, text.length);//cancel input//
                }else{        
                    //we must check special characters        
                    undo_man.Begin(node,offset);
                    undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, node, offset, text.length);
                    undo_man.End(node,offset);
                }
            }
        }else{
            //insert text into existing plane text node//
            undo_man.Begin(node,offset);
            undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, node, offset, text.length);
            undo_man.End(node,offset);
        }

    }else{
    
        //insert with creation of text node//
        //undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, node, offset, text.length);
        const parent = node;
        const index = offset;

        const ch = parent.childNodes.item(index);
        if(ch===null){
            alert("ERROR: IME input is not correctly detected (case 5).");
            br_before_composition = null;
            node_before_composition = null;
            return;        
        }

        if(ch.nodeType === Node.TEXT_NODE){
            const text_node = ch;
                
            if(text_node.data.slice(0, text.length ) !== text){
                alert("ERROR: IME input is not correctly detected (case 2).");
                br_before_composition = null;
                node_before_composition = null;
                return;
            }

            if(text_node.length === text.length){
                undo_man.Begin(node, offset);
                if(br_before_composition){
                    undo_man.Register(UR_TYPE.REMOVE_NODE, br_before_composition, node, offset, 1);
                }
                undo_man.Register(UR_TYPE.ADD_TEXT_NODE, text_node, node, offset, text.length);
                undo_man.End(text_node,text_node.length);

            }else{
                alert("ERROR: IME input is not correctly detected (case 3).");
                br_before_composition = null;
                node_before_composition = null;
                return;
            }
        }else if(ch.previousSibling){
            if(ch.previousSibling.nodeType !== Node.TEXT_NODE){
                alert("ERROR: IME input is not correctly detected (case 4).");
                br_before_composition = null;
                node_before_composition = null;
                return;
            }
            
            const text_node = ch.previousSibling;
            if(text_node.data === text){
                
                undo_man.Begin(node, offset);
                if(br_before_composition){
                    undo_man.Register(UR_TYPE.REMOVE_NODE, br_node, node, offset, 1);
                }
                undo_man.Register(UR_TYPE.ADD_TEXT_NODE, text_node, node, offset, text.length);
                undo_man.End(text_node, text_node.length);

            }else if(text_node.data.slice(text_node.length - text.length, text_node.length) === text){

                undo_man.Begin(node, offset);
                if(br_before_composition){
                    undo_man.Register(UR_TYPE.REMOVE_NODE, br_before_composition, node, offset, 1);
                }
                undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, text_node, text_node.length - text.length, text.length);
                undo_man.End(text_node,text_node.length);
            }else{
                alert("ERROR: IME input is not correctly detected (case 6).");
                br_before_composition = null;
                node_before_composition = null;
                return;
            }   
        }
    

    }

    br_before_composition = null;
    node_before_composition = null;
}


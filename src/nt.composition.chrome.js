"use strict";

let CHRM_IME_node_origin = null;
let CHRM_IME_offset = 0;
let CHRM_IME_length = 0;
let CHRM_IME_original_text = null;


let CHRM_IME_br_origin = null;
let CHRM_IME_parent = null;
let CHRM_IME_offset_in_parent = 0;

//let CHRM_IME_not_by_Henkan = false;
let CHRM_IME_update_count = 0;
let CHRM_IME_in_action = false;
let CHRM_IME_text_preceding_convert = null;
let CHRM_IME_node_preceding_convert = null;

let CHRM_IME_is_connected_undo = false;


function CHRM_OnCompositionstart(event){
    CHRM_IME_in_action = true;
    console.log("compositionstart: ", event.data);

    const selection = document.getSelection();
    if(selection.rangeCount === 0){event.currentTarget.blur();return false;}
   

    const range = selection.getRangeAt(0);    
    let focus_node = range.startContainer;
    let focus_offset = range.startOffset;
    let anchor_node = range.endContainer;
    let anchor_offset = range.endOffset;
    
    
  
    //const is_collapsed = selection.isCollapsed;
    CHRM_IME_is_connected_undo = false;
    
    console.log("focus: ", focus_node,  focus_offset); 
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }

    if(selection.isCollapsed){
        CHRM_IME_node_origin = focus_node;
        CHRM_IME_offset = focus_offset;
        CHRM_IME_length = 0;
        CHRM_IME_original_text = null;
        

        if(focus_node.nodeName==="BR"){
            CHRM_IME_br_origin = focus_node;
            CHRM_IME_parent = focus_node.parentNode;
            CHRM_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);

            console.log("keep original BR node");
        }else if(focus_node.hasChildNodes()){
            const ch = focus_node.childNodes.item(focus_offset);
            if(ch.nodeName==="BR"){
                CHRM_IME_br_origin = ch;
                CHRM_IME_parent = focus_node;
                CHRM_IME_offset_in_parent = focus_offset;

                console.log("keep original BR node");
            }else if(ch.nodeType===Node.TEXT_NODE){
                console.log("WARNING: focus is at parent of text");
                focus_node = ch;
                focus_offset = 0;
            }
        } 
        
        if(focus_node.nodeType === Node.TEXT_NODE){

            console.log("IME is input on text:", focus_node.data);

            // continuous text nodes are combined to avoid IME error//
            let p = focus_node.nextSibling;
            while(p){
                if(p.nodeType!==Node.TEXT_NODE){break;}
                p = p.nextSibling;
            }
            const first_not_text = p;
            
            const is_combined = (focus_node.nextSibling===first_not_text) ? false : true;
            if(is_combined){
                    
                undo_man.Begin(focus_node, focus_offset);
                while(focus_node.nextSibling!==first_not_text){
                    CombineTextNode(focus_node);                    
                }
                undo_man.End(focus_node, focus_offset);
                
                CHRM_IME_is_connected_undo = true;
                console.log("combine_text: ", focus_node.data);
            }
            ////////////////////////combined//
                
            CHRM_IME_node_origin = focus_node;
            CHRM_IME_offset = focus_offset;
            CHRM_IME_original_text = focus_node.data;
            CHRM_IME_length = CHRM_IME_original_text.length;
            CHRM_IME_parent = focus_node.parentNode;
            CHRM_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
        }
        
    }else{// not colappsed
        let de_selection = false;
        CHRM_IME_node_origin = focus_node;
        CHRM_IME_offset = focus_offset;
        CHRM_IME_original_text = null;

        if(anchor_node.nodeType === Node.TEXT_NODE){
            
            if(focus_node === anchor_node){
                //change into the case that collapse and by Henkan key//
                CHRM_IME_node_origin = focus_node;
                CHRM_IME_offset = focus_offset;
                CHRM_IME_original_text = focus_node.data;                    
                CHRM_IME_length = CHRM_IME_original_text.length;
                CHRM_IME_parent = focus_node.parentNode;
                CHRM_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
                de_selection = true;

            }else if(focus_node.nodeType === Node.TEXT_NODE){
                let is_only_text = true;
                let p = focus_node.nextSibling;
                while(p!==anchor_node){
                    if(p===null){is_only_text = false; break;}
                    if(p.nodeType!==Node.TEXT_NODE){is_only_text = false; break;}
                    p = p.nextSibling;
                }
                if(is_only_text){
                    undo_man.Begin(focus_node, focus_offset, anchor_node, anchor_offset);
                    let a_offset = 0;
                    while(focus_node.nextSibling!==anchor_node){
                        CombineTextNode(focus_node);
                    }
                    anchor_offset = focus_node.length + anchor_offset;
                    CombineTextNode(focus_node);                    
                    selection.setBaseAndExtent(focus_node,focus_offset, focus_node, anchor_offset);
                    undo_man.End(focus_node, focus_offset, focus_node, anchor_offset);
                    
                    CHRM_IME_node_origin = focus_node;
                    CHRM_IME_offset = focus_offset;
                    CHRM_IME_original_text = focus_node.data;
                    CHRM_IME_length = CHRM_IME_original_text.length;
                    CHRM_IME_parent = focus_node.parentNode;
                    CHRM_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
                    de_selection = true;
                    CHRM_IME_is_connected_undo = true;
                    console.log("combine_text: ", CHRM_IME_original_text);

                }
            }

        }

        const IME_TEST0214A = true;
        if(IME_TEST0214A){
            if(!de_selection){
                {
                    const [fnode, foffset] = CorrectFocusToText(focus_node, focus_offset);
                    selection.collapse(fnode, foffset);
                    CHRM_IME_node_origin = fnode;
                    CHRM_IME_offset = foffset;
                    CHRM_IME_original_text = fnode.data;                    
                    CHRM_IME_length = CHRM_IME_original_text.length;
                    CHRM_IME_parent = fnode.parentNode;
                    CHRM_IME_offset_in_parent = GetIndex(fnode.parentNode, fnode);
                    de_selection = true;
                }
                /*
                if(anchor_node.nodeType === Node.TEXT_NODE){
                    selection.setBaseAndExtent(anchor_node,0, anchor_node, anchor_offset);
                    CHRM_IME_node_origin = anchor_node;
                    CHRM_IME_offset = 0;
                    CHRM_IME_original_text = anchor_node.data;                    
                    CHRM_IME_length = CHRM_IME_original_text.length;
                    CHRM_IME_parent = anchor_node.parentNode;
                    CHRM_IME_offset_in_parent = GetIndex(anchor_node.parentNode, anchor_node);
                    de_selection = true;
                }else if(focus_node.nodeType === Node.TEXT_NODE){
                    selection.setBaseAndExtent(focus_node,focus_offset, focus_node, focus_node.length);
                    CHRM_IME_node_origin = focus_node;
                    CHRM_IME_offset = focus_offset;
                    CHRM_IME_original_text = focus_node.data;                    
                    CHRM_IME_length = CHRM_IME_original_text.length;
                    CHRM_IME_parent = focus_node.parentNode;
                    CHRM_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
                    de_selection = true;
                }
                */
            }
        }
        if(!de_selection){

            console.log("Cancel IME");
            
            //cancel IME input//            
            event.preventDefault();
            event.stopImmediatePropagation();
            event.currentTarget.blur();
            selection.removeAllRanges();
            //event.currentTarget.focus();
            alert("IME is cancelled to avoid bug"); 
            //!!!!This alert is very important to vanish IME subwindow on Chrome!!!!//
            
            
        }
        
    }

    console.log("CHRM_IME_original_text: ", CHRM_IME_original_text);
    if(CHRM_IME_node_preceding_convert){
        if((CHRM_IME_node_origin !== CHRM_IME_node_preceding_convert ) || 
            (CHRM_IME_node_origin.data !== CHRM_IME_text_preceding_convert.data) ){
            console.log("WARNING by Chrome bug: CHRM_IME_text_before  : ",CHRM_IME_text_preceding_convert);
            CHRM_IME_original_text = CHRM_IME_text_preceding_convert;
            CHRM_IME_node_origin = CHRM_IME_node_preceding_convert;
            CHRM_IME_length = CHRM_IME_original_text.length;

        /*} else if(CHRM_IME_node_origin.data !== CHRM_IME_text_preceding_convert.data){
            console.log("WARNING by Chrome bug: CHRM_IME_text_before  : ",CHRM_IME_text_preceding_convert);
            CHRM_IME_original_text = CHRM_IME_text_preceding_convert;
            CHRM_IME_length = CHRM_IME_original_text.length;
        */
        }
    }
    CHRM_IME_node_preceding_convert = null;
    CHRM_IME_text_preceding_convert = null;

    CHRM_IME_update_count = 0;
    
    //CHRM_IME_not_by_Henkan = false;
}


function CHRM_OnCompositionupdate(event){
    const subtext = event.data;
    console.log("composition update: ", subtext.length);
    
    const act_node = document.activeElement;
    console.log("active_element:", act_node, act_node.selectionStart, act_node.selectionEnd );

    const selection = document.getSelection();
    const focus_node = selection.focusNode;
    const focus_offset = selection.focusOffset;
    console.log("focus: ", focus_node, focus_offset);
    if(focus_node.nodeType===Node.TEXT_NODE){
        console.log("text: ", focus_node.data);
    }
    const anchor_node = selection.anchorNode;
    const anchor_offset = selection.anchorOffset;
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }
    ////////////////////////////just for log///

    
    /*

    if(CHRM_IME_update_count===0) {
        if(focus_node.nodeType!==Node.TEXT_NODE){
            console.log("ERROR: IME first update is not focusing text node");
            event.currentTarget.blur();
            selection.removeAllRanges();
            return;
        }

        //to judge which the IME is simple input or re-translation by "Henkan" key//
        
        if(event.data.length === 1){
            if((focus_node.length - CHRM_IME_length) === 1){
                CHRM_IME_not_by_Henkan = true;
            }            
        }

        if(CHRM_IME_not_by_Henkan){
            console.log("IME by simple input");
        }else{
            
            console.log("IME by Henkan key");
            
        }
                
    }
*/

    CHRM_IME_update_count++;
/*
    if(CHRM_IME_node_origin !== focus_node){
        console.log("node is changed: ");
        //CHRM_IME_node_origin = focus_node;
        if(focus_node.nodeType!==Node.TEXT_NODE){
            console.log("node become to be not text");            
        }
    }
*/
    //console.log("CHRM_IME_original_text: ", CHRM_IME_original_text);
    
}


function CHRM_OnCompositionend(event){
    const subtext = event.data;
    console.log("compositionend: ", subtext.length);
    //console.log("CHRM_IME_original_text: ", CHRM_IME_original_text);
    
    
    const CHRM_IME_ResetParams = ()=>{
        CHRM_IME_br_origin = null;
        CHRM_IME_node_origin = null;
        CHRM_IME_offset = 0;
        CHRM_IME_length = 0;
        CHRM_IME_original_text = null;
        CHRM_IME_in_action = false;
    };

    /*
    if(CHRM_IME_null===0){
        console.log("IME input is cancel: case 3 (no update)");
        CHRM_IME_ResetParams();
        return;
    }
    */

    const selection = document.getSelection();
    if(selection.rangeCount===0){
        console.log("IME input is cancel: case 4 (by focus blur)");
        CHRM_IME_ResetParams();
        return;
    }

    const focus_node = document.getSelection().focusNode;
    const focus_offset = document.getSelection().focusOffset;
    
    
    {//just for log////////////////////////
        console.log("focus: ", focus_node, focus_offset);
        if(focus_node.nodeType===Node.TEXT_NODE){
            console.log("text: ", focus_node.data);
        }
        const anchor_node = document.getSelection().anchorNode;
        const anchor_offset = document.getSelection().anchorOffset;
        if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
            console.log("anchor: ", anchor_node,  anchor_offset);
        }
    
    }////////////////////////just for log//
    


    
    if(CHRM_IME_node_origin===null){
        console.log("IME input is cancel: case 6 (CHRM_IME_node_origin is null)");
        CHRM_IME_ResetParams();
        return;
    }
    
    

    if(CHRM_IME_is_connected_undo){
        //in future, the Undo history is connected with 
        //the previous "CombineText" operation in OnCompositionstart//
    }


    {
        
        if(CHRM_IME_original_text){
            if((focus_node.nodeType !== Node.TEXT_NODE) || 
                (focus_node!==CHRM_IME_parent.childNodes.item(CHRM_IME_offset_in_parent))){
                    
                console.log("all text restarted by Henkan key is deteled.");
                console.log("node:",CHRM_IME_node_origin);

                CHRM_IME_node_origin.data = CHRM_IME_original_text;
                undo_man.Begin(CHRM_IME_node_origin, CHRM_IME_node_origin.length);
                undo_man.Register(UR_TYPE.REMOVE_NODE, CHRM_IME_node_origin, CHRM_IME_parent, CHRM_IME_offset_in_parent, 1);

                if(CHRM_IME_offset_in_parent===0){
                    if(!CHRM_IME_parent.hasChildNodes()){
                        AddNode("BR", CHRM_IME_parent, CHRM_IME_parent.firstChild);
                        console.log("add BR in P/H1/LI tag");  
                    }else{
                        if(CHRM_IME_parent.firstChild.nodeName==="BR"){
                            undo_man.Register(UR_TYPE.ADD_NODE, CHRM_IME_parent.firstChild, CHRM_IME_parent, CHRM_IME_offset_in_parent, 1);

                            console.log("br was automatically added by IME, here we only register");  

                        }else if(CHRM_IME_parent.nodeName==="LI"){
                            if((CHRM_IME_parent.firstChild.nodeName === "OL")||
                            (CHRM_IME_parent.firstChild.nodeName === "UL")){
                                AddNode("BR", CHRM_IME_parent, CHRM_IME_parent.firstChild);
                                console.log("add BR before child OL/UL in LI tag");  
                            }
                        }

                    }
                }
                
                if(CHRM_IME_parent.nodeName==="P"){
                    if(IsSpanMathImg(CHRM_IME_parent.firstChild)){
                        const figure = ConvertPtoFigure(CHRM_IME_parent);
                        
                        const focus = EnableMathEdit(figure.firstChild, 2);
                        document.getSelection().collapse(focus.node, focus.foffset);
                        undo_man.End(focus.node, focus.foffset);
                        
                        CHRM_IME_ResetParams();
                        return;
                    }
                }
                
                undo_man.End(focus_node, focus_offset);
                
                CHRM_IME_ResetParams();
                return;
            

            }else if(focus_node !== CHRM_IME_node_origin){
                console.log("IME input node is changed by browser engine");
                undo_man.Begin(CHRM_IME_node_origin, CHRM_IME_node_origin.length);
                CHRM_IME_node_origin.data = CHRM_IME_original_text;
                undo_man.Register(UR_TYPE.REMOVE_NODE, CHRM_IME_node_origin, CHRM_IME_parent, CHRM_IME_offset_in_parent, 1);
                undo_man.Register(UR_TYPE.ADD_NODE, focus_node, CHRM_IME_parent, CHRM_IME_offset_in_parent, 1);
                undo_man.End(focus_node, focus_offset);
                
                CHRM_IME_ResetParams();
                return;
            
            }else if(focus_node.data === CHRM_IME_original_text){
                console.log("IME input is cancel: case 2 (updated but not changed)");
                CHRM_IME_ResetParams();
                return;
            
            }else {

                const width = focus_node.length - CHRM_IME_length;
                if(width === event.data.length){
                    // simple input (not by Henkan key)//                    

                    const text = CHRM_IME_node_origin.data.slice(CHRM_IME_offset, CHRM_IME_offset + width);
                    console.log("IME input text" , text);
                    
                    if(IsTextNodeInMath(CHRM_IME_node_origin)){
                        if((CHRM_IME_offset===0) || (CHRM_IME_offset === CHRM_IME_length )){
                            
                            CHRM_IME_node_origin.deleteData(CHRM_IME_offset, width);
                            SwitchInputChar(text, CHRM_IME_node_origin, CHRM_IME_offset);
                        }else{
                            const margin = GetEditMargin(CHRM_IME_node_origin.parentNode.parentNode);
                            if((CHRM_IME_offset < margin)||(CHRM_IME_node_origin.length - margin < CHRM_IME_offset + width)){
                                CHRM_IME_node_origin.deleteData(CHRM_IME_offset, width);//cancel input//
                                console.log("IME input is cancel: case 5 (within the begin/end mark for math like node)");
                                CHRM_IME_ResetParams();
                                return;
                            }else{        
                                //we must check special characters     
                                console.log("regarded, insert into math like text");   

                                undo_man.Begin(CHRM_IME_node_origin,CHRM_IME_offset);
                                undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, CHRM_IME_node_origin, CHRM_IME_offset, width);
                                undo_man.End(CHRM_IME_node_origin,CHRM_IME_offset + width);
                            }
                        }
                    }else{ //as plain text//
                            
                        console.log("regarded, insert into plain text");
                    
                        undo_man.Begin(CHRM_IME_node_origin,CHRM_IME_offset);
                        undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, CHRM_IME_node_origin, CHRM_IME_offset, width);
                        undo_man.End(CHRM_IME_node_origin,CHRM_IME_offset + width);
                        
                    }
                }else{ // (restarted by Henkan key) //
                    console.log("regarded, replace all text data in the node");
                
                    undo_man.Begin(CHRM_IME_node_origin, CHRM_IME_offset);
                    undo_man.Register(UR_TYPE.DELETE_IN_TEXT, CHRM_IME_original_text, CHRM_IME_node_origin, 0, CHRM_IME_original_text.length);
                    undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, CHRM_IME_node_origin.data, CHRM_IME_node_origin, 0, CHRM_IME_node_origin.length);
                    undo_man.End(focus_node, focus_offset);
                }
            }
        }else {// (!CHRM_IME_original_text)
            
            
            if(focus_node.nodeType !== Node.TEXT_NODE){
                console.log("IME input is cancel (case 1): new node is added and but removed.");
                    
                if(CHRM_IME_br_origin){ 
                    const new_br = CHRM_IME_parent.childNodes.item(CHRM_IME_offset_in_parent);
                    if((new_br !==null) && (new_br !== CHRM_IME_br_origin)){
                        CHRM_IME_parent.insertBefore(CHRM_IME_br_origin, new_br);
                        CHRM_IME_parent.removeChild(new_br);
                        selection.collapse(CHRM_IME_parent, CHRM_IME_offset_in_parent);                
    
                        console.log("br is revived.");
                    }
                }
            }else{
                
                const width =focus_node.length;
                const text = focus_node.data;//.slice(CHRM_IME_offset, CHRM_IME_offset + width);
                console.log("IME input text", text);
                console.log("regarded, add text");
                
                undo_man.Begin(CHRM_IME_parent, CHRM_IME_offset_in_parent);
                if(CHRM_IME_br_origin){
                    if(CHRM_IME_br_origin.parentNode !== CHRM_IME_parent){
                        undo_man.Register(UR_TYPE.REMOVE_NODE, CHRM_IME_br_origin, CHRM_IME_parent, CHRM_IME_offset_in_parent, 1);
                    }
                }
                undo_man.Register(UR_TYPE.ADD_TEXT_NODE, focus_node, focus_node.parentNode, GetIndex(focus_node.parentNode,focus_node), width);
                if(CHRM_IME_br_origin){
                    if(focus_node.nextSibling===CHRM_IME_br_origin){
                        RemoveNode(CHRM_IME_br_origin);
                    }
                }
                undo_man.End(focus_node, width);
            }
            
        }
    }


    CHRM_IME_ResetParams();
}



/*
key lock to suppress that focus moves out of IME region
*/
function CHRM_OnKeydownForIME(event){
    if(CHRM_IME_in_action){
        switch(event.key){
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowDown":
            case "PageUp":
            case "PageDown":
            case "Home":
            case "End":
                event.preventDefault();
                event.stopImmediatePropagation();
            break;
        }        
        
    }else{
        if(event.key==="Process"){
        
            if(event.code==="Convert"){
                console.log("catch Convert key before compositionstart: ",event.key, event.code);
                const selection = document.getSelection();
                const focus_node = selection.focusNode;
                if(focus_node.nodeType===Node.TEXT_NODE){
                    console.log("Text before composition: ", focus_node.data);
                    CHRM_IME_node_preceding_convert = focus_node;
                    CHRM_IME_text_preceding_convert = focus_node.data;
                }
            }
        }
    }

}


function CHRM_OnBeforeinputForIME(event){
        console.log("beforeinput: ", event.data);
        
}

function CHRM_OnContextmenuForIME(event){
    if(CHRM_IME_in_action){
        console.log("contextmenu: ");
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}

